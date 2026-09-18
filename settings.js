(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const SITE_URL = 'https://kriskuif.github.io/portfolio-tineke-posthuma/';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const style = document.createElement('style');
  style.textContent = `
    .sidebar{display:flex;flex-direction:column}
    .nav{flex:0 0 auto}
    .settings-nav{margin-top:auto;padding:10px 0 4px;border-top:1px solid rgba(255,255,255,.14)}
    .settings-nav button{width:100%;display:grid;grid-template-columns:30px 1fr;align-items:center;text-align:left;border:0;background:transparent;padding:9px 10px;border-radius:12px;color:rgba(255,255,255,.82);font:inherit;font-size:.86rem;cursor:pointer;transition:.18s ease}
    .settings-nav button:hover{background:rgba(255,255,255,.12);color:#fff;transform:translateX(2px)}
    .settings-nav .n{display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:rgba(255,255,255,.10);font-size:.8rem;font-weight:800}
    body:not(.can-edit) .settings-nav{display:none!important}
    .settings-overlay{position:fixed;inset:0;z-index:3200;background:rgba(20,38,31,.42);display:grid;place-items:center;padding:18px}
    .settings-window{width:min(900px,calc(100vw - 28px));max-height:min(88vh,860px);display:flex;flex-direction:column;background:#fff;border:1px solid #d7e0da;border-radius:20px;box-shadow:0 28px 90px rgba(20,43,34,.30);overflow:hidden}
    .settings-window-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .settings-window-title{display:flex;align-items:center;gap:11px}
    .settings-window-title .icon{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.12);display:grid;place-items:center;font-size:1rem}
    .settings-window-title strong{display:block;font-family:Georgia,serif;font-size:1.2rem}
    .settings-window-title span{display:block;font-size:.72rem;opacity:.76;margin-top:1px}
    .settings-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.10);color:#fff;font-size:1.25rem;cursor:pointer}
    .settings-close:hover{background:#8d3e3e}
    .settings-window-body{padding:18px;overflow:auto;overscroll-behavior:contain}
    .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .settings-card{border:1px solid #dfe5df;border-radius:17px;padding:17px;background:#fcfdfb}
    .settings-card.wide{grid-column:1/-1}
    .settings-card h4{margin:0 0 5px;font-size:1rem;color:#294f40}
    .settings-card>p{margin:0 0 14px;color:#66746e;font-size:.84rem}
    .settings-form{display:grid;gap:9px}
    .settings-form label{display:grid;gap:5px;font-size:.76rem;font-weight:800;color:#405047}
    .settings-form input{width:100%;padding:10px 11px;border:1px solid #ced9d2;border-radius:11px;font:inherit;background:#fff}
    .settings-actions{display:flex;gap:8px;flex-wrap:wrap}
    .settings-btn{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 12px;font:inherit;font-size:.79rem;font-weight:850;cursor:pointer}
    .settings-btn.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .settings-btn.danger{background:#fff1ef;color:#8b3e35;border:1px solid #efd1cd}
    .settings-message{min-height:1.2em;margin:10px 0 0!important;color:#526158!important;font-size:.76rem!important;white-space:pre-line}
    .settings-meta{display:grid;gap:6px;margin:0 0 14px}
    .settings-meta-row{display:flex;justify-content:space-between;gap:16px;padding:7px 0;border-bottom:1px solid #edf1ee;font-size:.8rem}
    .settings-meta-row span{color:#66746e}
    .settings-meta-row strong{text-align:right;color:#30483d;overflow-wrap:anywhere}
    .export-help{font-size:.74rem!important;margin-top:9px!important}
    .settings-warning-layer{position:absolute;inset:0;z-index:5;background:rgba(16,31,25,.48);display:grid;place-items:center;padding:18px}
    .settings-warning{width:min(520px,calc(100vw - 42px));background:#fff;border:1px solid #ead8b9;border-radius:18px;box-shadow:0 26px 80px rgba(20,43,34,.32);padding:20px}
    .settings-warning-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;background:#fff4dc;color:#7b5a18;font-size:.72rem;font-weight:900;margin-bottom:10px}
    .settings-warning h4{margin:0 0 8px;font-family:Georgia,serif;font-size:1.25rem;color:#5b4320}
    .settings-warning p{margin:0 0 10px;color:#5e625f;font-size:.86rem}
    .settings-warning ul{margin:8px 0 16px;padding-left:20px;color:#4e5752;font-size:.82rem}
    .settings-warning .settings-actions{justify-content:flex-end}
    @media(max-width:760px){.settings-grid{grid-template-columns:1fr}.settings-card.wide{grid-column:auto}.settings-window{max-height:92vh}.settings-window-body{padding:13px}}
  `;
  document.head.appendChild(style);

  document.getElementById('instellingen')?.remove();

  const sidebar = document.getElementById('sidebar');
  const sideFoot = sidebar?.querySelector('.side-foot');
  let settingsNav = sidebar?.querySelector('.settings-nav');
  if (!settingsNav) {
    settingsNav = document.createElement('div');
    settingsNav.className = 'settings-nav';
    settingsNav.innerHTML = '<button type="button" data-open-settings><span class="n">⚙</span><span>Instellingen</span></button>';
    if (sidebar && sideFoot) sidebar.insertBefore(settingsNav, sideFoot);
  }

  const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1200);
  }

  function progressSummary(){
    let total=0, filled=0;
    groups.forEach(group => group.topics.forEach(topic => {
      total++;
      if(topic.fields.some(([id]) => String(state.values[id] || '').trim())) filled++;
    }));
    return {filled,total};
  }

  function allFieldIds(){
    return groups.flatMap(group => group.topics.flatMap(topic => topic.fields.map(([id]) => id)));
  }

  function openUnsavedEditors(){
    try{
      if(typeof openWindows === 'undefined') return [];
      return [...openWindows.values()].filter(win =>
        win?.topic?.fields?.some(([id]) => {
          const field = win.el?.querySelector(`[data-modal-field="${id}"]`);
          return field && field.value !== String(state.values[id] || '');
        })
      );
    }catch(_err){
      return [];
    }
  }

  function remoteMap(rows){
    const map = {};
    allFieldIds().forEach(id => { map[id] = ''; });
    (rows || []).forEach(row => {
      if(Object.prototype.hasOwnProperty.call(map, row.id)) map[row.id] = row.value ?? '';
    });
    return map;
  }

  function localDifferences(rows){
    const online = remoteMap(rows);
    return allFieldIds().filter(id => String(state.values[id] || '') !== String(online[id] || ''));
  }

  async function fetchOnlineRows(){
    const {data,error} = await client.from('portfolio_content').select('id,value,updated_at');
    if(error) throw error;
    return Array.isArray(data) ? data : [];
  }

  function applyOnlineRows(rows){
    state.values = remoteMap(rows);
    const latest = rows.map(row=>row.updated_at).filter(Boolean).sort().at(-1) || null;
    state.updatedAt = latest;
    try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }catch(_err){}
    renderChapters();
    return latest;
  }

  function confirmRisk(overlay,{title,summary,unsavedCount,differenceCount,confirmLabel='Toch doorgaan'}){
    return new Promise(resolve => {
      const layer = document.createElement('div');
      layer.className = 'settings-warning-layer';
      const details = [];
      if(unsavedCount){
        details.push(`${unsavedCount} open invulvenster${unsavedCount===1?' bevat':'s bevatten'} tekst die nog niet met Opslaan naar de website is geschreven. Die tekst blijft tijdens deze actie in het geopende venster staan, maar hoort niet bij de opnieuw geladen versie. Sluit of ververs je daarna zonder op te slaan, dan raak je die tekst kwijt.`);
      }
      if(differenceCount){
        details.push(`De lokale browserversie wijkt op ${differenceCount} veld${differenceCount===1?'':'en'} af van de online versie. Die lokale waarden worden vervangen door de waarden uit Supabase.`);
      }
      layer.innerHTML = `<div class="settings-warning" role="alertdialog" aria-modal="true">
        <div class="settings-warning-badge">⚠ Mogelijk gegevensverlies</div>
        <h4>${esc(title)}</h4>
        <p>${esc(summary)}</p>
        <ul>${details.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>
        <p><strong>De online gegevens in Supabase worden door deze actie niet verwijderd.</strong></p>
        <div class="settings-actions">
          <button class="settings-btn secondary" type="button" data-risk-cancel>Annuleren</button>
          <button class="settings-btn danger" type="button" data-risk-confirm>${esc(confirmLabel)}</button>
        </div>
      </div>`;
      overlay.appendChild(layer);
      const finish = value => { layer.remove(); resolve(value); };
      layer.querySelector('[data-risk-cancel]')?.addEventListener('click',()=>finish(false));
      layer.querySelector('[data-risk-confirm]')?.addEventListener('click',()=>finish(true));
      layer.addEventListener('click',e=>{ if(e.target===layer) finish(false); });
    });
  }

  async function guardedOnlineReplace(overlay,{mode,messageEl}){
    if(messageEl) messageEl.textContent='Controleren op niet-opgeslagen wijzigingen…';
    try{
      const rows = await fetchOnlineRows();
      const unsaved = openUnsavedEditors();
      const differences = localDifferences(rows);

      if(unsaved.length || differences.length){
        const isCache = mode === 'cache';
        const approved = await confirmRisk(overlay,{
          title: isCache ? 'Lokale cache vernieuwen?' : 'Online inhoud opnieuw laden?',
          summary: isCache
            ? 'Deze actie verwijdert de lokale browserkopie en bouwt die opnieuw op vanuit de centrale online versie.'
            : 'Deze actie vervangt de lokale inhoud van deze pagina door de huidige centrale versie uit Supabase.',
          unsavedCount: unsaved.length,
          differenceCount: differences.length,
          confirmLabel: isCache ? 'Cache vernieuwen' : 'Online versie laden'
        });
        if(!approved){
          if(messageEl) messageEl.textContent='Actie geannuleerd. Er is niets gewijzigd.';
          return null;
        }
      }

      if(mode === 'cache'){
        try{ localStorage.removeItem(STORAGE_KEY); }catch(_err){}
      }

      const latest = applyOnlineRows(rows);
      if(messageEl){
        messageEl.textContent = mode === 'cache'
          ? 'Lokale browserkopie is vernieuwd vanuit de online versie.'
          : 'Online inhoud is opnieuw geladen.';
      }
      return latest;
    }catch(err){
      console.error(err);
      if(messageEl) messageEl.textContent='De online inhoud kon niet worden geladen.';
      return null;
    }
  }

  async function imageAsDataUrl(){
    try{
      const image = document.querySelector('.hero-photo-card img');
      if(!image) return '';
      const response = await fetch(image.src,{cache:'no-store'});
      if(!response.ok) return '';
      const blob = await response.blob();
      return await new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.onload=()=>resolve(reader.result||'');
        reader.onerror=reject;
        reader.readAsDataURL(blob);
      });
    }catch(_err){ return ''; }
  }

  function topicHtml(topic,number){
    const rows = topic.fields
      .map(([id,label])=>({label,value:String(state.values[id]||'').trim()}))
      .filter(item=>item.value);
    const body = rows.length
      ? rows.map(item=>`<div class="field"><h4>${esc(item.label)}</h4><p>${esc(item.value).replace(/\n/g,'<br>')}</p></div>`).join('')
      : '<p class="empty">Nog niet ingevuld.</p>';
    return `<article class="topic"><div class="topic-label">Onderdeel ${number}</div><h3>${esc(topic.title)}</h3>${body}</article>`;
  }

  function exportThemeProfile(){
    const id = window.PortfolioThemes?.current?.() || document.documentElement.dataset.portfolioTheme || 'natuurlijk';
    const profiles = {
      natuurlijk:{
        id:'natuurlijk',name:'Natuurlijk',
        bg:'#fbfaf6',paper:'#ffffff',ink:'#1d2924',muted:'#66746e',line:'#dfe5df',
        accent:'#1f5e4a',accentSoft:'#e6efe9',heroA:'#f1ead8',heroB:'#eaf0e7',
        bodyFont:'Arial, sans-serif',titleFont:'Georgia, serif',
        pattern:'radial-gradient(circle at 88% 14%, rgba(135,170,111,.12) 0 8%, transparent 8.5%)'
      },
      wandelgids:{
        id:'wandelgids',name:'Bos & Blad',
        bg:'#f4f2e9',paper:'#fffefa',ink:'#243028',muted:'#6c776e',line:'#d8ded3',
        accent:'#284f36',accentSoft:'#dfe9da',heroA:'#ece7d4',heroB:'#e5ecdf',
        bodyFont:'Trebuchet MS, Arial, sans-serif',titleFont:'Palatino Linotype, Georgia, serif',
        pattern:'radial-gradient(ellipse at 88% 18%, rgba(86,118,73,.15) 0 7%, transparent 7.5%), radial-gradient(ellipse at 18% 82%, rgba(162,145,99,.10) 0 9%, transparent 9.5%)'
      },
      tijdschrift:{
        id:'tijdschrift',name:'Herfstpad',
        bg:'#fbf4ea',paper:'#fffdfa',ink:'#3b2923',muted:'#806b60',line:'#ead7ca',
        accent:'#944f38',accentSoft:'#f3ddd0',heroA:'#f4dfc8',heroB:'#f2d4bd',
        bodyFont:'Arial, sans-serif',titleFont:'Georgia, serif',
        pattern:'radial-gradient(ellipse at 88% 20%, rgba(188,104,63,.16) 0 10%, transparent 10.5%), radial-gradient(ellipse at 78% 92%, rgba(215,166,79,.20) 0 14%, transparent 14.5%)'
      },
      dagboek:{
        id:'dagboek',name:'Routekaart',
        bg:'#f3f7f7',paper:'#ffffff',ink:'#1f3035',muted:'#65777c',line:'#d4e0e2',
        accent:'#28586a',accentSoft:'#dcebed',heroA:'#e5eeee',heroB:'#dfeaed',
        bodyFont:'Segoe UI, Tahoma, sans-serif',titleFont:'Trebuchet MS, Segoe UI, sans-serif',
        pattern:'repeating-radial-gradient(ellipse at 88% 22%, transparent 0 22px, rgba(49,104,120,.07) 23px 24px, transparent 25px 42px)'
      },
      minimal:{
        id:'minimal',name:'Duin & Zee',
        bg:'#f8f5ed',paper:'#fffefb',ink:'#24323a',muted:'#6b797e',line:'#d9e1df',
        accent:'#245b78',accentSoft:'#dfecef',heroA:'#f6ebd5',heroB:'#dfeef1',
        bodyFont:'Verdana, Geneva, sans-serif',titleFont:'Palatino Linotype, Georgia, serif',
        pattern:'radial-gradient(ellipse at 88% 12%, rgba(91,158,183,.16) 0 13%, transparent 13.5%), radial-gradient(ellipse at 78% 100%, rgba(217,191,130,.20) 0 18%, transparent 18.5%)'
      }
    };
    return profiles[id] || profiles.natuurlijk;
  }

  async function buildExportDocument(){
    const imageData = await imageAsDataUrl();
    const theme = exportThemeProfile();
    const chapters = groups.map(group => `<section class="chapter"><div class="chapter-head"><span>${group.n}</span><div><h2>${esc(group.title)}</h2><p>${esc(group.sub)}</p></div></div>${group.topics.map((topic,index)=>topicHtml(topic,`${group.n}.${index+1}`)).join('')}</section>`).join('');
    const photo = imageData ? `<img class="portrait" src="${imageData}" alt="Tineke Posthuma">` : '';
    return `<!DOCTYPE html><html lang="nl" data-portfolio-theme="${theme.id}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio Tineke Posthuma · Wandeltrainer 3</title><style>
      @page{margin:18mm}
      *{box-sizing:border-box}
      html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{margin:0;background:${theme.bg};color:${theme.ink};font-family:${theme.bodyFont};line-height:1.55}
      .page{max-width:900px;margin:auto;padding:34px}
      .cover{position:relative;overflow:hidden;display:grid;grid-template-columns:1fr 230px;gap:32px;align-items:center;padding:34px;border:1px solid ${theme.line};border-radius:24px;background:${theme.pattern},linear-gradient(135deg,${theme.heroA},${theme.heroB});margin-bottom:24px}
      .eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:${theme.accent}}
      .theme-label{display:inline-block;margin-top:8px;padding:4px 8px;border-radius:999px;background:${theme.accentSoft};color:${theme.accent};font-size:10px;font-weight:700}
      .cover h1{font-family:${theme.titleFont};font-size:52px;line-height:.95;margin:12px 0}
      .cover h1 span{color:${theme.accent}}
      .cover p{color:${theme.muted}}
      .portrait{width:100%;border-radius:18px;border:8px solid ${theme.paper}}
      .intro,.chapter{background:${theme.paper};border:1px solid ${theme.line};border-radius:20px;padding:24px;margin:16px 0}
      .intro h2,.chapter h2,.topic h3{font-family:${theme.titleFont}}
      .intro h2{margin-top:0}
      .chapter-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}
      .chapter-head>span{display:grid;place-items:center;min-width:40px;height:40px;background:${theme.accentSoft};color:${theme.accent};border-radius:12px;font-weight:700}
      .chapter-head h2{margin:0 0 3px}.chapter-head p{margin:0;color:${theme.muted}}
      .topic{border-top:1px solid ${theme.line};padding:18px 0 6px}
      .topic-label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:${theme.muted};font-weight:700}
      .topic h3{margin:4px 0 12px;color:${theme.accent}}
      .field{margin:10px 0;padding-left:12px;border-left:3px solid ${theme.accentSoft}}
      .field h4{margin:0 0 3px;font-size:12px;color:${theme.accent}}
      .field p{margin:0;color:${theme.ink}}
      .empty{color:${theme.muted};font-style:italic}
      footer{text-align:center;color:${theme.muted};font-size:12px;margin:28px 0}
      @media print{
        body{background:${theme.bg}!important}
        .page{padding:0}
        .cover,.intro,.chapter,.topic{break-inside:avoid}
      }
      @media(max-width:650px){.page{padding:15px}.cover{grid-template-columns:1fr}.cover h1{font-size:42px}.portrait{max-width:260px}}
    </style></head><body><div class="page"><header class="cover"><div><div class="eyebrow">Portfolio · Wandeltrainer 3</div><h1>Tineke <span>Posthuma</span></h1><p>Een persoonlijk portfolio over mijn ontwikkeling als wandeltrainer, met praktijkervaringen, trainingsplannen, feedback, reflecties en bewijsstukken.</p><span class="theme-label">Thema: ${esc(theme.name)}</span></div>${photo}</header><section class="intro"><h2>Over dit portfolio</h2><p>Deze website is opgezet als digitaal portfolio voor Wandeltrainer 3. Hier komen de persoonlijke teksten, praktijkvoorbeelden, trainingsplannen, reflecties en bewijsstukken van Tineke samen in één overzichtelijk geheel.</p></section>${chapters}<footer>Portfolio Tineke Posthuma · Wandeltrainer 3</footer></div></body></html>`;
  }

  async function openSettings(){
    if(!document.body.classList.contains('can-edit')) return;
    document.querySelector('.settings-overlay')?.remove();

    const {data}=await client.auth.getSession();
    const session=data?.session;
    if(!session) return;

    const progress=progressSummary();
    const updated=state.updatedAt ? new Date(state.updatedAt).toLocaleString('nl-NL') : 'Nog niet bekend';

    const overlay=document.createElement('div');
    overlay.className='settings-overlay';
    overlay.innerHTML=`<section class="settings-window" role="dialog" aria-modal="true" aria-label="Instellingen">
      <header class="settings-window-head">
        <div class="settings-window-title"><div class="icon">⚙</div><div><strong>Instellingen</strong><span>Account, export en onderhoud</span></div></div>
        <button class="settings-close" type="button" aria-label="Sluiten">×</button>
      </header>
      <div class="settings-window-body"><div class="settings-grid">
        <article class="settings-card">
          <h4>Account</h4><p>Beheer het ingelogde beheeraccount.</p>
          <div class="settings-meta"><div class="settings-meta-row"><span>Ingelogd als</span><strong>${esc(session.user?.email||'—')}</strong></div></div>
          <div class="settings-actions"><button class="settings-btn secondary" type="button" data-settings-logout>Uitloggen</button></div>
        </article>
        <article class="settings-card">
          <h4>Wachtwoord wijzigen</h4><p>Controleer eerst je huidige wachtwoord en kies daarna een nieuw wachtwoord.</p>
          <div class="settings-form">
            <label>Huidig wachtwoord<input type="password" autocomplete="current-password" data-current-password></label>
            <label>Nieuw wachtwoord<input type="password" autocomplete="new-password" data-new-password></label>
            <label>Herhaal nieuw wachtwoord<input type="password" autocomplete="new-password" data-new-password-confirm></label>
          </div>
          <div class="settings-actions" style="margin-top:12px"><button class="settings-btn" type="button" data-change-password>Wachtwoord wijzigen</button></div>
          <p class="settings-message" data-password-message></p>
        </article>
        <article class="settings-card wide">
          <h4>Portfolio exporteren</h4><p>Maak een zelfstandige kopie van de actuele opgeslagen portfolio-inhoud.</p>
          <div class="settings-actions">
            <button class="settings-btn" type="button" data-export-html>HTML-bestand</button>
            <button class="settings-btn" type="button" data-export-pdf>PDF</button>
            <button class="settings-btn" type="button" data-export-word>Word (.doc)</button>
            <button class="settings-btn secondary" type="button" data-copy-link>Publieke link kopiëren</button>
          </div>
          <p class="export-help">Niet-opgeslagen tekst die nog in een open invulvenster staat, wordt niet meegenomen in een export.</p>
          <p class="settings-message" data-export-message></p>
        </article>
        <article class="settings-card">
          <h4>Status</h4><p>Controleer de actuele online versie.</p>
          <div class="settings-meta">
            <div class="settings-meta-row"><span>Voortgang</span><strong data-settings-progress>${progress.filled} van ${progress.total} onderdelen</strong></div>
            <div class="settings-meta-row"><span>Laatste wijziging</span><strong data-settings-updated>${esc(updated)}</strong></div>
          </div>
          <div class="settings-actions"><button class="settings-btn secondary" type="button" data-refresh-online>Online inhoud opnieuw laden</button></div>
          <p class="settings-message" data-sync-message></p>
        </article>
        <article class="settings-card">
          <h4>Back-up & lokaal herstel</h4>
          <p>Download een gegevensback-up of vernieuw de lokale browserkopie vanuit de centrale Supabase-versie.</p>
          <div class="settings-actions">
            <button class="settings-btn secondary" type="button" data-export-json>JSON-back-up</button>
            <button class="settings-btn secondary" type="button" data-clear-cache>Lokale cache vernieuwen</button>
          </div>
          <p class="settings-message" data-maintenance-message></p>
        </article>
      </div></div>
    </section>`;

    document.body.appendChild(overlay);
    const previousHtmlOverflow=document.documentElement.style.overflow;
    const previousBodyOverflow=document.body.style.overflow;
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';

    const closeSettings=()=>{
      overlay.remove();
      document.documentElement.style.overflow=previousHtmlOverflow;
      document.body.style.overflow=previousBodyOverflow;
    };

    overlay.querySelector('.settings-close')?.addEventListener('click',closeSettings);
    overlay.addEventListener('click',e=>{if(e.target===overlay) closeSettings();});

    overlay.querySelector('[data-settings-logout]')?.addEventListener('click',async()=>{
      await client.auth.signOut();
      closeSettings();
    });

    const passwordMessage=overlay.querySelector('[data-password-message]');
    overlay.querySelector('[data-change-password]')?.addEventListener('click',async()=>{
      const current=overlay.querySelector('[data-current-password]')?.value||'';
      const next=overlay.querySelector('[data-new-password]')?.value||'';
      const confirm=overlay.querySelector('[data-new-password-confirm]')?.value||'';
      if(!current){passwordMessage.textContent='Vul eerst je huidige wachtwoord in.';return;}
      if(next.length<8){passwordMessage.textContent='Het nieuwe wachtwoord moet minimaal 8 tekens bevatten.';return;}
      if(next!==confirm){passwordMessage.textContent='De nieuwe wachtwoorden komen niet overeen.';return;}
      passwordMessage.textContent='Huidig wachtwoord controleren…';
      const {error:verifyError}=await client.auth.signInWithPassword({email:session.user.email,password:current});
      if(verifyError){passwordMessage.textContent='Het huidige wachtwoord is niet correct.';return;}
      passwordMessage.textContent='Wachtwoord wijzigen…';
      const {error:updateError}=await client.auth.updateUser({password:next});
      if(updateError){passwordMessage.textContent='Wachtwoord wijzigen mislukt: '+updateError.message;return;}
      overlay.querySelector('[data-current-password]').value='';
      overlay.querySelector('[data-new-password]').value='';
      overlay.querySelector('[data-new-password-confirm]').value='';
      passwordMessage.textContent='Wachtwoord is gewijzigd.';
    });

    const exportMessage=overlay.querySelector('[data-export-message]');
    overlay.querySelector('[data-export-html]')?.addEventListener('click',async()=>{
      exportMessage.textContent='HTML-bestand maken…';
      const html=await buildExportDocument();
      downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),'portfolio-tineke-posthuma.html');
      exportMessage.textContent='HTML-bestand gedownload.';
    });
    overlay.querySelector('[data-export-word]')?.addEventListener('click',async()=>{
      exportMessage.textContent='Word-bestand maken…';
      const html=await buildExportDocument();
      downloadBlob(new Blob([html],{type:'application/msword'}),'portfolio-tineke-posthuma.doc');
      exportMessage.textContent='Word-bestand gedownload.';
    });
    overlay.querySelector('[data-export-pdf]')?.addEventListener('click',async()=>{
      const printWindow=window.open('','_blank');
      if(!printWindow){exportMessage.textContent='Sta pop-ups toe om de PDF-export te openen.';return;}
      exportMessage.textContent='PDF-weergave maken…';
      const html=await buildExportDocument();
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.addEventListener('load',()=>setTimeout(()=>printWindow.print(),250),{once:true});
      exportMessage.textContent='Kies in het afdrukvenster “Opslaan als PDF”.';
    });
    overlay.querySelector('[data-copy-link]')?.addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(SITE_URL);
        exportMessage.textContent='Publieke link gekopieerd.';
      }catch(_err){
        exportMessage.textContent='Kopiëren is niet gelukt.';
      }
    });

    const syncMessage=overlay.querySelector('[data-sync-message]');
    overlay.querySelector('[data-refresh-online]')?.addEventListener('click',async()=>{
      const latest=await guardedOnlineReplace(overlay,{mode:'online',messageEl:syncMessage});
      if(latest===null) return;
      const p=progressSummary();
      overlay.querySelector('[data-settings-progress]').textContent=`${p.filled} van ${p.total} onderdelen`;
      overlay.querySelector('[data-settings-updated]').textContent=latest?new Date(latest).toLocaleString('nl-NL'):'Nog niet bekend';
    });

    const maintenance=overlay.querySelector('[data-maintenance-message]');
    overlay.querySelector('[data-export-json]')?.addEventListener('click',()=>{
      const payload={schema_version:1,exported_at:new Date().toISOString(),portfolio:'Tineke Posthuma - Wandeltrainer 3',theme:(window.PortfolioThemes?.current?.()||document.documentElement.dataset.portfolioTheme||'natuurlijk'),values:state.values};
      downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),'portfolio-tineke-posthuma-backup.json');
      maintenance.textContent='JSON-back-up gedownload.';
    });
    overlay.querySelector('[data-clear-cache]')?.addEventListener('click',async()=>{
      const latest=await guardedOnlineReplace(overlay,{mode:'cache',messageEl:maintenance});
      if(latest===null) return;
      const p=progressSummary();
      overlay.querySelector('[data-settings-progress]').textContent=`${p.filled} van ${p.total} onderdelen`;
      overlay.querySelector('[data-settings-updated]').textContent=latest?new Date(latest).toLocaleString('nl-NL'):'Nog niet bekend';
    });
  }

  settingsNav?.querySelector('[data-open-settings]')?.addEventListener('click',openSettings);
})();