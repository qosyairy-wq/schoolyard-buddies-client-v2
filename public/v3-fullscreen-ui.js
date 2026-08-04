/* Schoolyard Buddies v3.0.3 — universal fullscreen UI controller */
(() => {
  'use strict';
  const BUILD = '3.0.3';
  const ROOT_SELECTORS = [
    '#dialog-container', '#task-container', '#hud-help-modal',
    '#school-assignment-overlay', '#syh-inventory-overlay',
    '#syh-secret-code-overlay', '#syh-quick-chat-panel',
    '#character-3d-preview-modal', '#stage137-modal-fullscreen',
    '#focus-question-view', '#focus-mode-screen', '#focus-report-view',
    '#education-centre-screen', '#education-centre-menu-view',
    '#education-mini-game-menu', '#education-mini-game-pause-overlay',
    '#report-screen', '#story-progression-screen', '#world-event-screen',
    '#world-map-screen', '#pause-screen', '#mmorpg-screen',
    '#themed-confirm-screen', '#stage6-level-intro', '#stage6-level-complete',
    '#stage61-intro', '#stage61-complete',
    '.quiz-modal', '.question-modal', '.play-task-modal', '.play-mode-modal',
    '[role="dialog"]'
  ];
  const EXCLUDED_IDS = new Set(['start-screen','loading-screen','character-setup-screen']);
  const ACTIVE_CLASS = 'syb-fullscreen-active';
  let locked=false, previousPaused, previousBodyOverflow='', scheduled=false;

  function styleVisible(el){
    if(!el || EXCLUDED_IDS.has(el.id) || el.hidden || el.closest('#start-screen,#loading-screen,#character-setup-screen')) return false;
    if(el.classList.contains('hidden') || el.getAttribute('aria-hidden')==='true') return false;
    const s=getComputedStyle(el);
    if(s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity||'1')<=0.01) return false;
    const r=el.getBoundingClientRect();
    return r.width>4 && r.height>4;
  }
  function setPaused(open){
    if(open===locked)return;
    locked=open;
    document.body.classList.toggle('syb-blocking-ui-open',open);
    document.documentElement.classList.toggle('syb-blocking-ui-open',open);
    window.__SYB_BLOCKING_UI_OPEN__=open;
    try{window.setGameplayInputLayersEnabled?.(!open);}catch(_){}
    try{window.SYBInput?.setEnabled?.(!open);}catch(_){}
    const state=window.STATE;
    if(state){
      if(open){
        previousPaused=state.paused;
        state.paused=true;
        if(state.joystick){state.joystick.active=false;state.joystick.vector?.set?.(0,0);}
      }else if(previousPaused!==undefined){state.paused=previousPaused;}
    }
    if(open){previousBodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    else document.body.style.overflow=previousBodyOverflow;
    document.dispatchEvent(new CustomEvent(open?'syb:ui-pause':'syb:ui-resume',{detail:{build:BUILD}}));
  }
  function refresh(){
    const roots=new Set();
    document.querySelectorAll(ROOT_SELECTORS.join(',')).forEach(el=>{if(styleVisible(el))roots.add(el);});
    document.querySelectorAll('.'+ACTIVE_CLASS).forEach(el=>{if(!roots.has(el))el.classList.remove(ACTIVE_CLASS);});
    roots.forEach(el=>el.classList.add(ACTIVE_CLASS));
    setPaused(roots.size>0);
  }
  function scheduleRefresh(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;refresh();});
  }
  window.SYBFullscreenUI=Object.freeze({
    build:BUILD, refresh:scheduleRefresh, isOpen:()=>locked,
    closeAll:()=>{document.querySelectorAll('.'+ACTIVE_CLASS).forEach(el=>el.classList.remove(ACTIVE_CLASS));setPaused(false);}
  });
  const observer=new MutationObserver(scheduleRefresh);
  function start(){
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden','open']});
    scheduleRefresh();setInterval(scheduleRefresh,300);
  }
  addEventListener('resize',scheduleRefresh,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(scheduleRefresh,120),{passive:true});
  document.addEventListener('click',scheduleRefresh,true);
  document.addEventListener('pointerup',scheduleRefresh,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
