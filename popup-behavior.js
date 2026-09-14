(() => {
  // Modal windows on this site may only be closed with their explicit controls
  // (close/cancel/Escape where supported), never by accidentally clicking the backdrop.
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
})();