
(()=>{
  'use strict';

  const init=()=>{
    const hud=document.getElementById('hud');
    if(!hud || hud.dataset.syb420==='1') return;
    hud.dataset.syb420='1';
    hud.classList.add('syb-minimal-vibrant-hud');

    const left=hud.querySelector('.hud-top-left');
    const right=hud.querySelector('.hud-top-right');
    if(left) left.classList.add('syb-hud-group','syb-hud-left');
    if(right) right.classList.add('syb-hud-group','syb-hud-right');

    /* No global MutationObserver and no per-frame DOM manipulation. */
  };

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',init,{once:true})
    : init();
})();
