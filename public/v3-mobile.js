/* Schoolyard Buddies v3.0.0 — single authoritative mobile runtime */
(() => {
  'use strict';
  const isMobile = matchMedia('(hover:none) and (pointer:coarse), (max-width:1100px)').matches;
  if (!isMobile) return;
  const BUILD = '3.0.0';
  document.documentElement.dataset.sybMobileBuild = BUILD;

  const $ = id => document.getElementById(id);
  const safe = fn => { try { return fn(); } catch (_) { return undefined; } };
  let menuOpen = false;
  let joystickPointer = null;

  function gameplayActive() {
    const mode = String(window.STATE?.mode || '');
    return ['playing','lobby'].includes(mode) && !document.body.classList.contains('start-screen-active');
  }
  function setInputEnabled(enabled) {
    safe(() => window.setGameplayInputLayersEnabled?.(enabled));
    if (!enabled && window.STATE?.joystick) {
      window.STATE.joystick.active = false;
      window.STATE.joystick.vector?.set?.(0,0);
    }
  }
  function setModal(open) {
    document.body.classList.toggle('syb-v3-modal-open', !!open);
    setInputEnabled(!open);
  }
  function resizeRenderer() {
    const vv = window.visualViewport;
    const w = Math.max(1, Math.round(vv?.width || innerWidth));
    const h = Math.max(1, Math.round(vv?.height || innerHeight));
    const container = $('canvas-container');
    const canvas = container?.querySelector('canvas');
    if (container) Object.assign(container.style,{width:`${w}px`,height:`${h}px`});
    if (canvas) Object.assign(canvas.style,{width:`${w}px`,height:`${h}px`});
    safe(() => window.renderer?.setSize?.(w,h,false));
    safe(() => { if (window.camera) { window.camera.aspect=w/h; window.camera.updateProjectionMatrix?.(); } });
  }

  function buildMenu() {
    if ($('syb-v3-menu')) return;
    const menu = document.createElement('section');
    menu.id='syb-v3-menu'; menu.setAttribute('aria-hidden','true');
    menu.innerHTML=`<div class="syb-v3-head"><h2>Schoolyard Menu</h2><button class="syb-v3-close" id="syb-v3-close" type="button">×</button></div>
      <div class="syb-v3-grid">
        <button class="syb-v3-item" data-target="story"><span>📖</span>Story</button>
        <button class="syb-v3-item" data-target="report"><span>📊</span>Report</button>
        <button class="syb-v3-item" data-target="wardrobe"><span>👗</span>Wardrobe</button>
        <button class="syb-v3-item" data-target="inventory"><span>🎒</span>Inventory</button>
        <button class="syb-v3-item" data-target="chat"><span>💬</span>Chat</button>
        <button class="syb-v3-item" data-target="sound"><span>🔊</span>Sound</button>
        <button class="syb-v3-item" data-target="pause"><span>⏸️</span>Pause</button>
        <button class="syb-v3-item" data-target="close"><span>▶️</span>Resume</button>
      </div>`;
    document.body.appendChild(menu);
    $('syb-v3-close')?.addEventListener('click', closeMenu);
    menu.addEventListener('click', e => {
      const b=e.target.closest('[data-target]'); if(!b)return;
      const target=b.dataset.target;
      if(target==='close'||target==='pause'){ closeMenu(); return; }
      closeMenu();
      const mapping={story:'story-btn',report:'report-btn',wardrobe:'wardrobe-btn',inventory:'inventory-btn',sound:'sound-btn',chat:'syh-chat-fab'};
      const candidate=$(mapping[target]) || document.querySelector(`[data-action="${target}"], [aria-label*="${target}" i]`);
      candidate?.click?.();
    });
  }
  function openMenu(e) {
    e?.preventDefault?.(); e?.stopPropagation?.();
    buildMenu(); menuOpen=true;
    $('syb-v3-menu')?.classList.add('open'); $('syb-v3-menu')?.setAttribute('aria-hidden','false');
    setModal(true);
  }
  function closeMenu(e) {
    e?.preventDefault?.(); e?.stopPropagation?.();
    menuOpen=false;
    $('syb-v3-menu')?.classList.remove('open'); $('syb-v3-menu')?.setAttribute('aria-hidden','true');
    setModal(false); setTimeout(resizeRenderer,30);
  }

  function bindMenu() {
    const btn=$('syh-menu-shortcut'); if(!btn || btn.dataset.sybV3)return;
    btn.dataset.sybV3='1';
    btn.addEventListener('pointerup', openMenu, {capture:true});
    btn.addEventListener('click', openMenu, {capture:true});
  }

  function bindJoystick() {
    const zone=$('joystick-zone'); if(!zone || zone.dataset.sybV3)return;
    zone.dataset.sybV3='1';
    const stick=zone.querySelector('.joystick-stick, .stick, div') || zone;
    const move=(x,y)=>{
      const r=zone.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2;
      let dx=x-cx, dy=y-cy; const radius=Math.max(30,Math.min(r.width,r.height)*.34); const len=Math.hypot(dx,dy)||1;
      if(len>radius){dx*=radius/len;dy*=radius/len;}
      if(stick!==zone) stick.style.transform=`translate(${dx}px,${dy}px)`;
      if(window.STATE?.joystick){window.STATE.joystick.active=true;window.STATE.joystick.vector?.set?.(dx/radius,dy/radius);}
    };
    const end=e=>{
      if(joystickPointer!==null && e?.pointerId!==undefined && e.pointerId!==joystickPointer)return;
      joystickPointer=null; if(stick!==zone)stick.style.transform='translate(0,0)';
      if(window.STATE?.joystick){window.STATE.joystick.active=false;window.STATE.joystick.vector?.set?.(0,0);}
    };
    zone.addEventListener('pointerdown',e=>{if(menuOpen)return;joystickPointer=e.pointerId;zone.setPointerCapture?.(e.pointerId);move(e.clientX,e.clientY);e.preventDefault();e.stopPropagation();},{capture:true});
    zone.addEventListener('pointermove',e=>{if(e.pointerId!==joystickPointer)return;move(e.clientX,e.clientY);e.preventDefault();e.stopPropagation();},{capture:true});
    zone.addEventListener('pointerup',end,{capture:true}); zone.addEventListener('pointercancel',end,{capture:true});
  }

  function syncModalState() {
    const chat=$('syh-quick-chat-panel');
    const chatOpen=!!chat?.classList.contains('open');
    const other=!!document.querySelector('[role="dialog"]:not([aria-hidden="true"]),.quiz-modal.open,.question-modal.open,#stage6-level-intro.open,#stage6-level-complete.open');
    setModal(menuOpen || chatOpen || other);
  }

  let queued=false;
  function sync() {
    if(queued)return; queued=true;
    requestAnimationFrame(()=>{queued=false;resizeRenderer();buildMenu();bindMenu();bindJoystick();syncModalState();});
  }
  addEventListener('resize',sync,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(sync,120),{passive:true});
  visualViewport?.addEventListener('resize',sync,{passive:true});
  const obs=new MutationObserver(sync); obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-hidden']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();
  setTimeout(sync,300); setTimeout(sync,1200);
})();
