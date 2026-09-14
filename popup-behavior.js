(() => {
  // Modal windows may only be closed with their explicit controls
  // (close/cancel/Escape where supported), never by clicking the backdrop.
  document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const isBackdrop = [...target.classList].some(name =>
      name.endsWith('-overlay') || name.endsWith('-layer')
    );
    if (!isBackdrop) return;
    event.stopImmediatePropagation();
    event.stopPropagation();
  }, true);

  // Freeze the portfolio behind modal popups. Editor windows already manage
  // their own scroll lock in script.js; this covers the other site-wide dialogs.
  const modalSelector = [
    '.auth-overlay',
    '.settings-overlay',
    '.password-recovery-overlay',
    '.file-upload-overlay',
    '.file-viewer-overlay',
    '.file-title-overlay'
  ].join(',');

  const root = document.documentElement;
  const body = document.body;
  let locked = false;
  let savedScrollY = 0;

  function hasModal(){
    return !!document.querySelector(modalSelector);
  }

  function syncScrollLock(){
    const shouldLock = hasModal();
    if (shouldLock === locked) return;
    locked = shouldLock;

    if (shouldLock) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      root.classList.add('site-modal-open');
      body.classList.add('site-modal-open');
      body.style.setProperty('--modal-scroll-y', `${savedScrollY}px`);
    } else {
      root.classList.remove('site-modal-open');
      body.classList.remove('site-modal-open');
      body.style.removeProperty('--modal-scroll-y');
      requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    html.site-modal-open,
    body.site-modal-open{
      overflow:hidden!important;
      overscroll-behavior:none!important;
    }
  `;
  document.head.appendChild(style);

  syncScrollLock();
  new MutationObserver(syncScrollLock).observe(document.body, {childList:true, subtree:true});
})();