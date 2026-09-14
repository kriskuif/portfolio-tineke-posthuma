(() => {
  if (!window.pdfjsLib) return;

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  const style = document.createElement('style');
  style.textContent = `
    .file-paper.pdf-clean-viewer{
      width:min(100%,760px);
      min-height:0;
      aspect-ratio:auto;
      background:transparent;
      box-shadow:none;
      overflow:visible;
    }
    .pdf-clean-pages{display:grid;gap:14px;width:100%;align-items:start}
    .pdf-clean-page{display:block;width:100%;height:auto;background:#fff;box-shadow:0 4px 18px rgba(24,39,32,.16)}
    .pdf-clean-loading,.pdf-clean-error{width:100%;min-height:420px;display:grid;place-items:center;background:#fff;color:#607068;text-align:center;padding:24px;box-shadow:0 4px 18px rgba(24,39,32,.12)}
    .pdf-clean-error a{color:#1f5e4a;font-weight:800}
    @media(max-width:700px){.pdf-clean-pages{gap:9px}}
  `;
  document.head.appendChild(style);

  function isPdfIframe(iframe){
    if (!iframe || iframe.dataset.pdfCleanHandled) return false;
    const src = iframe.getAttribute('src') || '';
    return /\.pdf(?:[?#]|$)/i.test(src) || /application\/pdf/i.test(iframe.getAttribute('type') || '');
  }

  async function renderPdfIframe(iframe){
    if (!isPdfIframe(iframe)) return;
    iframe.dataset.pdfCleanHandled = '1';

    const paper = iframe.closest('.file-paper');
    if (!paper) return;

    const originalSrc = iframe.src;
    const pdfUrl = originalSrc.split('#')[0];
    paper.classList.add('pdf-clean-viewer');
    paper.innerHTML = '<div class="pdf-clean-loading">Document laden…</div>';

    try{
      const pdf = await window.pdfjsLib.getDocument({ url: pdfUrl }).promise;
      const pages = document.createElement('div');
      pages.className = 'pdf-clean-pages';
      paper.replaceChildren(pages);

      const targetWidth = Math.max(280, Math.min(760, paper.clientWidth || 760));
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);

      for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1){
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const cssScale = targetWidth / baseViewport.width;
        const cssViewport = page.getViewport({ scale: cssScale });
        const renderViewport = page.getViewport({ scale: cssScale * outputScale });

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-clean-page';
        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;
        canvas.setAttribute('aria-label', `Pagina ${pageNumber} van ${pdf.numPages}`);
        pages.appendChild(canvas);

        const context = canvas.getContext('2d', { alpha: false });
        await page.render({ canvasContext: context, viewport: renderViewport }).promise;
      }
    }catch(err){
      console.error('PDF kon niet zonder browserviewer worden weergegeven:', err);
      paper.innerHTML = `<div class="pdf-clean-error"><div><p>Het document kon niet in de vereenvoudigde weergave worden geladen.</p><p><a href="${pdfUrl}" target="_blank" rel="noopener">Document openen</a></p></div></div>`;
    }
  }

  function scan(root = document){
    root.querySelectorAll?.('.file-paper iframe').forEach(renderPdfIframe);
    if(root.matches?.('.file-paper iframe')) renderPdfIframe(root);
  }

  scan();
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if(node.nodeType === 1) scan(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });
})();