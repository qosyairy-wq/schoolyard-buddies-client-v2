
/* Schoolyard Buddies v3.0.5 — shared blocking UI controller */
(() => {
  'use strict';

  const BLOCKING_SELECTORS = [
    '#shop-container:not(.hidden)',
    '#fitting-room-container:not(.hidden)',
    '#inventory-container:not(.hidden)',
    '#syh-quick-chat-panel.open',
    '#dialog-container:not(.hidden)',
    '#task-container:not(.hidden)',
    '#focus-mode-screen:not(.hidden)',
    '#education-centre-screen:not(.hidden)',
    '#world-map-screen:not(.hidden)',
    '#report-screen:not(.hidden)',
    '#pause-screen:not(.hidden)',
    '#themed-confirm-screen:not(.hidden)',
    '#story-progression-screen:not(.hidden)',
    '#mmorpg-screen:not(.hidden)',
    '#unlock-showcase.show'
  ];

  let savedMode = null;
  let uiWasOpen = false;

  function state() {
    try {
      return typeof STATE !== 'undefined' ? STATE : window.STATE;
    } catch (_) {
      return window.STATE || null;
    }
  }

  function clearInputs() {
    const s = state();
    if (!s) return;
    try {
      Object.keys(s.keys || {}).forEach(key => { s.keys[key] = false; });
      if (s.joystick) {
        s.joystick.active = false;
        if (s.joystick.vector?.set) s.joystick.vector.set(0, 0);
        else {
          if ('x' in s.joystick) s.joystick.x = 0;
          if ('y' in s.joystick) s.joystick.y = 0;
        }
      }
    } catch (_) {}
  }

  function setPaused(open) {
    const s = state();
    if (!s) return;
    try {
      if (open) {
        if (!uiWasOpen) savedMode = s.mode || 'playing';
        if ('paused' in s) s.paused = true;
        if (s.mode !== 'chat') s.mode = 'ui';
        clearInputs();
      } else {
        if ('paused' in s) s.paused = false;
        if (s.mode === 'ui' || s.mode === 'chat') {
          s.mode = ['playing','lobby'].includes(savedMode) ? savedMode : 'playing';
        }
        clearInputs();
      }
    } catch (_) {}
  }

  function anyBlockingUIOpen() {
    return BLOCKING_SELECTORS.some(selector => {
      try { return !!document.querySelector(selector); }
      catch (_) { return false; }
    });
  }

  function refresh() {
    const open = anyBlockingUIOpen();
    document.body.classList.toggle('syb-blocking-ui-open', open);
    document.documentElement.classList.toggle('syb-blocking-ui-open', open);
    if (open !== uiWasOpen) {
      setPaused(open);
      uiWasOpen = open;
    }
  }

  function updateViewportHeight() {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--syb-vh', `${Math.max(320, Math.round(height))}px`);
  }

  function hardenChatClose() {
    const close = document.getElementById('syh-chat-close');
    const panel = document.getElementById('syh-quick-chat-panel');
    if (!close || !panel || close.dataset.sybCloseHardened === '1') return;
    close.dataset.sybCloseHardened = '1';

    const closePanel = event => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      document.getElementById('syh-quick-chat-input')?.blur?.();
      document.body.classList.remove('syh-chat-typing');
      setTimeout(refresh, 0);
    };

    close.addEventListener('pointerup', closePanel, true);
    close.addEventListener('touchend', closePanel, {capture:true, passive:false});
  }

  function init() {
    updateViewportHeight();
    hardenChatClose();
    refresh();

    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => {
        hardenChatClose();
        refresh();
      });
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class','aria-hidden','style']
    });

    window.addEventListener('resize', updateViewportHeight, {passive:true});
    window.visualViewport?.addEventListener('resize', updateViewportHeight, {passive:true});
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 80), {passive:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
