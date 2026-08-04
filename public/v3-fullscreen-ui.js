/* Schoolyard Buddies v3.0.1 — one fullscreen/pause controller for desktop and mobile */
(() => {
  'use strict';
  const candidates = [
    '#dialog-container','#task-container','#hud-help-modal','#school-assignment-overlay',
    '#syh-inventory-overlay','#syh-secret-code-overlay','#syh-quick-chat-panel',
    '#character-3d-preview-modal','#stage137-modal-fullscreen','#focus-question-view',
    '.quiz-modal','.question-modal','.play-task-modal','.play-mode-modal','[role="dialog"]'
  ];
  const excludedIds = new Set(['start-screen','loading-screen','character-setup-screen']);
  let previousPaused;
  let locked = false;

  function visible(el) {
    if (!el || excludedIds.has(el.id) || el.classList.contains('hidden') || el.getAttribute('aria-hidden') === 'true') return false;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  }
  function gameplayStarted() {
    const mode = String(window.STATE?.mode || '');
    return ['playing','lobby','gameplay'].includes(mode) || document.body.classList.contains('game-started');
  }
  function pause(open) {
    if (open === locked) return;
    locked = open;
    document.body.classList.toggle('syb-blocking-ui-open', open);
    try { window.setGameplayInputLayersEnabled?.(!open); } catch (_) {}
    if (window.STATE) {
      if (open) {
        previousPaused = window.STATE.paused;
        window.STATE.paused = true;
        if (window.STATE.joystick) {
          window.STATE.joystick.active = false;
          window.STATE.joystick.vector?.set?.(0,0);
        }
      } else if (previousPaused !== undefined) {
        window.STATE.paused = previousPaused;
      }
    }
    window.__SYB_BLOCKING_UI_OPEN__ = open;
    document.dispatchEvent(new CustomEvent(open ? 'syb:ui-pause' : 'syb:ui-resume'));
  }
  function refresh() {
    let any = false;
    document.querySelectorAll(candidates.join(',')).forEach(el => {
      const on = gameplayStarted() && visible(el);
      el.classList.toggle('syb-visible', on);
      any ||= on;
    });
    pause(any);
  }
  let queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refresh(); });
  }
  new MutationObserver(queue).observe(document.documentElement, {
    subtree:true, childList:true, attributes:true,
    attributeFilter:['class','style','hidden','aria-hidden','open']
  });
  addEventListener('resize', queue, {passive:true});
  addEventListener('orientationchange', queue, {passive:true});
  document.addEventListener('click', queue, true);
  document.addEventListener('pointerup', queue, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queue, {once:true}); else queue();
  setInterval(refresh, 500);
})();
