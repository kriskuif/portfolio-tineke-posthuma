(() => {
  const DB_NAME = 'portfolio-tineke-html-export';
  const STORE_NAME = 'handles';
  const HANDLE_KEY = 'portfolio-html';
  const FILE_NAME = 'portfolio-tineke-posthuma.html';

  let fileHandle = null;
  let writeQueue = Promise.resolve();

  function updateStatus(text, statusClass = '') {
    const saveStatus = document.getElementById('saveStatus');
    const statusWrap = saveStatus?.closest('.status');
    if (saveStatus) saveStatus.textContent = text;
    if (statusWrap) {
      statusWrap.classList.remove('saved', 'saving', 'error');
      if (statusClass) statusWrap.classList.add(statusClass);
    }
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getStoredHandle() {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (_err) {
      return null;
    }
  }

  async function storeHandle(handle) {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (_err) {
      // Het opslaan van de handle is alleen gemak; de huidige sessie kan doorgaan.
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function buildStandaloneHtml() {
    // Wacht één tick zodat renderChapters() de zojuist opgeslagen tekst heeft getoond.
    await new Promise(resolve => setTimeout(resolve, 0));

    const clone = document.documentElement.cloneNode(true);
    const cloneBody = clone.querySelector('body');

    clone.style.overflow = '';
    clone.style.overscrollBehavior = '';
    cloneBody?.style.removeProperty('overflow');
    cloneBody?.style.removeProperty('overscroll-behavior');
    cloneBody?.classList.remove('menu-open', 'window-dragging');

    // De deelversie is een schoon portfolio, zonder bewerkingsinterface.
    clone.querySelectorAll(
      '.editor-window,#windowLayer,.topic-edit-btn,.topic-state,.chapter-progress,.topbar,script'
    ).forEach(el => el.remove());

    // CSS in het HTML-bestand opnemen.
    const sourceStylesheet = document.querySelector('link[rel="stylesheet"]');
    const clonedStylesheet = clone.querySelector('link[rel="stylesheet"]');
    if (sourceStylesheet && clonedStylesheet) {
      const response = await fetch(sourceStylesheet.href, { cache: 'no-store' });
      if (!response.ok) throw new Error('stylesheet');
      const css = await response.text();
      const style = document.createElement('style');
      style.textContent = css;
      clonedStylesheet.replaceWith(style);
    }

    // Afbeeldingen echt in het HTML-bestand opnemen zodat mailen/offline openen blijft werken.
    const liveImages = [...document.querySelectorAll('img')];
    const clonedImages = [...clone.querySelectorAll('img')];
    for (let i = 0; i < clonedImages.length; i += 1) {
      const source = liveImages[i];
      if (!source?.src) continue;
      try {
        const response = await fetch(source.src, { cache: 'no-store' });
        if (!response.ok) throw new Error('image');
        const dataUrl = await blobToDataUrl(await response.blob());
        clonedImages[i].setAttribute('src', dataUrl);
      } catch (_err) {
        // Alleen als inbouwen mislukt, de absolute online afbeelding als terugval gebruiken.
        clonedImages[i].setAttribute('src', source.src);
      }
    }

    const exportedMeta = document.createElement('meta');
    exportedMeta.setAttribute('name', 'portfolio-exported-at');
    exportedMeta.setAttribute('content', new Date().toISOString());
    clone.querySelector('head')?.appendChild(exportedMeta);

    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  async function ensureWritableHandleFromUserAction() {
    if (!('showSaveFilePicker' in window)) {
      throw new Error('unsupported');
    }

    if (!fileHandle) fileHandle = await getStoredHandle();

    if (fileHandle) {
      try {
        const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (permission === 'granted') return fileHandle;
      } catch (_err) {
        fileHandle = null;
      }
    }

    fileHandle = await window.showSaveFilePicker({
      id: 'portfolio-tineke-html',
      suggestedName: FILE_NAME,
      types: [{
        description: 'HTML-bestand',
        accept: { 'text/html': ['.html'] }
      }]
    });
    await storeHandle(fileHandle);
    return fileHandle;
  }

  async function writeStandaloneHtml(handle) {
    const html = await buildStandaloneHtml();
    const writable = await handle.createWritable();
    await writable.write(html);
    await writable.close();
    updateStatus('Opgeslagen · HTML-bestand bijgewerkt', 'saved');
  }

  function scheduleHtmlWrite() {
    // Deze functie wordt rechtstreeks vanuit de klik/keyboard-save aangeroepen.
    // Daardoor mag de browser de eerste keer veilig om een bestandslocatie vragen.
    const handlePromise = ensureWritableHandleFromUserAction();

    writeQueue = writeQueue
      .catch(() => {})
      .then(async () => {
        const handle = await handlePromise;
        await writeStandaloneHtml(handle);
      })
      .catch(err => {
        if (err?.name === 'AbortError') {
          updateStatus('Tekst opgeslagen · HTML-bestand niet gekoppeld', 'saved');
          return;
        }
        if (err?.message === 'unsupported') {
          updateStatus('Tekst opgeslagen · automatisch HTML bijwerken niet ondersteund', 'saved');
          return;
        }
        console.error('Automatisch HTML opslaan mislukt:', err);
        updateStatus('Tekst opgeslagen · HTML bijwerken mislukt', 'error');
      });
  }

  // Een eerder gekozen bestand alvast ophalen. Schrijfrechten worden pas bij een bewuste save gevraagd.
  getStoredHandle().then(handle => { if (handle) fileHandle = handle; });

  // Haak in op de bestaande opslagfunctie. Daarmee geldt automatisch HTML bijwerken
  // voor de normale Opslaan-knop én voor Ctrl/Cmd+S.
  const originalPersistState = window.persistState;
  if (typeof originalPersistState === 'function') {
    window.persistState = function patchedPersistState(...args) {
      const ok = originalPersistState.apply(this, args);
      if (ok) scheduleHtmlWrite();
      return ok;
    };
  }
})();
