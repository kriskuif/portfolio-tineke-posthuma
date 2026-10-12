(() => {
  'use strict';

  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  // Stable keys: these introductory texts are independent of chapter order.
  const fields = [
    {
      id: 'intro_text_hero_description',
      selector: '#start .hero-copy .lead',
      label: 'Introductietekst op de startpagina',
      maxLength: 1500
    },
    {
      id: 'intro_text_photo_caption',
      selector: '#start .hero-photo-card figcaption',
      label: 'Bijschrift onder de foto',
      maxLength: 300
    },
    {
      id: 'intro_text_about_description',
      selector: '#over .intro-grid .card:not(.quote-card) > p',
      label: 'Beschrijving: Een portfolio dat meegroeit',
      maxLength: 1600
    },
    {
      id: 'intro_text_about_quote',
      selector: '#over .intro-grid .quote-card > strong',
      label: 'Spreuk in Over dit portfolio',
      maxLength: 500
    }
  ];

  const style = document.createElement('style');
  style.textContent = `
    .intro-edit-wrap{position:relative;min-width:0;display:flow-root}
    .intro-edit-wrap .intro-edit-btn{
      position:absolute;top:0;right:0;width:28px;height:28px;
      border:1px solid transparent;border-radius:8px;background:rgba(255,255,255,.76);
      color:#70867b;display:grid;place-items:center;font:inherit;font-size:.9rem;
      cursor:pointer;transition:background .15s,color .15s,border-color .15s;
      z-index:3
    }
    .intro-edit-wrap .intro-edit-btn:hover,
    .intro-edit-wrap .intro-edit-btn:focus-visible{
      color:#1f5e4a;background:#edf4ef;border-color:#c2d6c8;outline:none
    }
    body:not(.can-edit) .intro-edit-btn{display:none!important}
    body.can-edit .intro-edit-wrap{padding-right:30px}
    .intro-edit-wrap .quote-card strong,
    .quote-card .intro-edit-wrap > strong{display:block}
    .intro-edit-wrap.intro-caption-wrap{margin:0}
    .intro-caption-wrap .intro-edit-btn{top:5px;right:0}
    .intro-editor-overlay{
      position:fixed;inset:0;z-index:5500;display:grid;place-items:center;
      padding:18px;background:rgba(18,34,28,.51)
    }
    .intro-editor-dialog{
      box-sizing:border-box;width:min(590px,100%);max-height:90dvh;overflow:auto;
      background:#fff;border:1px solid #dce5df;border-radius:18px;
      box-shadow:0 28px 90px rgba(13,35,27,.34)
    }
    .intro-editor-head{
      display:flex;align-items:center;justify-content:space-between;gap:12px;
      padding:15px 18px;background:linear-gradient(135deg,#1d5745,#286b55);color:white
    }
    .intro-editor-head strong{font:700 1.1rem Georgia,serif}
    .intro-editor-close{
      display:grid;place-items:center;flex:0 0 auto;width:34px;height:34px;
      border:1px solid rgba(255,255,255,.25);border-radius:9px;
      background:rgba(255,255,255,.12);color:white;font:inherit;
      font-size:1.25rem;cursor:pointer
    }
    .intro-editor-body{padding:20px;display:grid;gap:10px}
    .intro-editor-body label{font-size:.83rem;font-weight:850;color:#405047}
    .intro-editor-body textarea{
      box-sizing:border-box;width:100%;min-height:145px;resize:vertical;
      padding:11px 12px;background:white;color:#263b32;border:1px solid #ced9d2;
      border-radius:11px;font:inherit;line-height:1.5
    }
    .intro-editor-body textarea:focus{outline:2px solid rgba(31,94,74,.16);border-color:#7ca08e}
    .intro-editor-counter{font-size:.72rem;color:#697d70;text-align:right}
    .intro-editor-message{min-height:1.2em;margin:0;color:#67766c;font-size:.8rem}
    .intro-editor-message.error{color:#98433a}
    .intro-editor-actions{display:flex;flex-wrap:wrap;gap:9px;justify-content:flex-end;margin-top:6px}
    .intro-editor-actions button{
      border-radius:10px;padding:10px 14px;font:inherit;font-size:.8rem;
      font-weight:850;cursor:pointer
    }
    .intro-editor-cancel{border:1px solid #dce7df;background:#eef3ef;color:#1f5e4a}
    .intro-editor-save{border:1px solid #1f5e4a;background:#1f5e4a;color:white}
    .intro-editor-actions button:disabled{opacity:.55;cursor:not-allowed}
    @media(max-width:600px){
      .intro-editor-overlay{padding:10px}
      .intro-editor-body{padding:14px}
      .intro-editor-dialog{max-height:94dvh}
      body.can-edit .intro-edit-wrap{padding-right:26px}
    }
  `;
  document.head.appendChild(style);

  const activeFields = fields.map(config => {
    const target = document.querySelector(config.selector);
    if (!target) return null;
    const wrapper = document.createElement('div');
    wrapper.className = 'intro-edit-wrap' + (target.tagName === 'FIGCAPTION' ? ' intro-caption-wrap' : '');
    target.before(wrapper);
    wrapper.appendChild(target);
    const button = document.createElement('button');
    button.className = 'intro-edit-btn';
    button.type = 'button';
    button.textContent = '✎';
    button.title = config.label + ' aanpassen';
    button.setAttribute('aria-label', config.label + ' aanpassen');
    wrapper.appendChild(button);
    const field = { ...config, target, button };
    button.addEventListener('click', () => openEditor(field));
    return field;
  }).filter(Boolean);

  if (!activeFields.length) return;

  async function loadSavedTexts() {
    try {
      const { data, error } = await client.from('portfolio_content')
        .select('id,value')
        .in('id', activeFields.map(field => field.id));
      if (error) throw error;
      const saved = new Map((data || []).map(row => [row.id, String(row.value ?? '')]));
      activeFields.forEach(field => {
        const value = saved.get(field.id);
        if (typeof value === 'string' && value.trim()) {
          field.target.textContent = value.trim();
        }
      });
    } catch (error) {
      console.warn('Startpagina- en portfolioteksten laden mislukt:', error);
    }
  }

  function openEditor(field) {
    if (!document.body.classList.contains('can-edit')) return;
    document.querySelector('.intro-editor-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'intro-editor-overlay';
    overlay.innerHTML = `
      <section class="intro-editor-dialog" role="dialog" aria-modal="true" aria-label="Portfoliotekst aanpassen">
        <header class="intro-editor-head">
          <strong>Tekst aanpassen</strong>
          <button type="button" class="intro-editor-close" aria-label="Sluiten">×</button>
        </header>
        <div class="intro-editor-body">
          <label for="intro-editor-text"></label>
          <textarea id="intro-editor-text"></textarea>
          <div class="intro-editor-counter"></div>
          <p class="intro-editor-message" role="status" aria-live="polite"></p>
          <div class="intro-editor-actions">
            <button type="button" class="intro-editor-cancel">Annuleren</button>
            <button type="button" class="intro-editor-save">Opslaan</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    const textarea = overlay.querySelector('textarea');
    const message = overlay.querySelector('.intro-editor-message');
    const save = overlay.querySelector('.intro-editor-save');
    const counter = overlay.querySelector('.intro-editor-counter');
    const initial = field.target.textContent.trim();
    textarea.value = initial;
    textarea.maxLength = field.maxLength;
    overlay.querySelector('label').textContent = field.label;
    const updateCounter = () => {
      counter.textContent = textarea.value.length + ' / ' + field.maxLength + ' tekens';
    };
    updateCounter();
    textarea.addEventListener('input', updateCounter);

    let isSaving = false;
    const escape = event => { if (event.key === 'Escape') close(); };
    function close() {
      if (isSaving) return;
      if (textarea.value.trim() !== initial &&
          !window.confirm('De aangepaste tekst is nog niet opgeslagen. Wijzigingen verwerpen?')) return;
      document.removeEventListener('keydown', escape);
      overlay.remove();
    }
    overlay.querySelector('.intro-editor-close').addEventListener('click', close);
    overlay.querySelector('.intro-editor-cancel').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    document.addEventListener('keydown', escape);

    async function saveText() {
      const value = textarea.value.trim();
      if (!value) {
        message.textContent = 'Vul eerst een tekst in.';
        message.classList.add('error');
        textarea.focus();
        return;
      }
      if (isSaving) return;
      isSaving = true;
      save.disabled = true;
      message.classList.remove('error');
      message.textContent = 'Opslaan op de website…';
      try {
        const { data, error: sessionError } = await client.auth.getSession();
        if (sessionError || !data?.session || !document.body.classList.contains('can-edit')) {
          throw new Error('Je bent niet meer ingelogd als beheerder.');
        }
        const { error } = await client.from('portfolio_content')
          .upsert([{ id: field.id, value }], { onConflict: 'id' });
        if (error) throw error;
        field.target.textContent = value;
        if (typeof setStatus === 'function') {
          setStatus(field.label + ' opgeslagen op website', 'saved');
        }
        document.removeEventListener('keydown', escape);
        overlay.remove();
      } catch (error) {
        console.error('Portfoliotekst opslaan mislukt:', error);
        message.textContent = 'Opslaan mislukt: ' + String(error?.message || error);
        message.classList.add('error');
        isSaving = false;
        save.disabled = false;
      }
    }
    save.addEventListener('click', saveText);
    textarea.addEventListener('keydown', event => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        saveText();
      }
    });
    textarea.focus();
  }

  loadSavedTexts();
})();
