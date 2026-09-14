(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const SITE_URL = 'https://kriskuif.github.io/portfolio-tineke-posthuma/';
  const settingsClient = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!settingsClient) return;

  const style = document.createElement('style');
  style.textContent = `
    .sidebar{display:flex;flex-direction:column}
    .nav{flex:0 0 auto}
    .settings-nav{margin-top:auto;padding:10px 0 4px;border-top:1px solid rgba(255,255,255,.14)}
    .settings-nav a{display:grid;grid-template-columns:30px 1fr;align-items:center;text-decoration:none;padding:9px 10px;border-radius:12px;color:rgba(255,255,255,.82);font-size:.86rem;transition:.18s ease}
    .settings-nav a:hover,.settings-nav a.active{background:rgba(255,255,255,.12);color:#fff;transform:translateX(2px)}
    .settings-nav .n{display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:rgba(255,255,255,.10);font-size:.8rem;font-weight:800}
    body:not(.can-edit) .settings-nav,body:not(.can-edit) #instellingen{display:none!important}
    .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .settings-card{border:1px solid #dfe5df;border-radius:18px;padding:19px;background:#fcfdfb}
    .settings-card.wide{grid-column:1/-1}
    .settings-card h4{margin:0 0 5px;font-size:1rem;color:#294f40}
    .settings-card>p{margin:0 0 15px;color:#66746e;font-size:.86rem}
    .settings-form{display:grid;gap:10px}
    .settings-form label{display:grid;gap:5px;font-size:.78rem;font-weight:800;color:#405047}
    .settings-form input{width:100%;padding:10px 11px;border:1px solid #ced9d2;border-radius:11px;font:inherit;background:#fff}
    .settings-actions{display:flex;gap:8px;flex-wrap:wrap}
    .settings-btn{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 12px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .settings-btn.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .settings-btn.danger{background:#fff1ef;color:#8b3e35;border:1px solid #efd1cd}
    .settings-message{min-height:1.2em;margin:10px 0 0!important;color:#526158!important;font-size:.78rem!important;white-space:pre-line}
    .settings-meta{display:grid;gap:8px;margin:0 0 15px}
    .settings-meta-row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #edf1ee;font-size:.82rem}
    .settings-meta-row span{color:#66746e}.settings-meta-row strong{text-align:right;color:#30483d;overflow-wrap:anywhere}
    .export-help{font-size:.76rem!important;margin-top:10px!important}
    @media(max-width:760px){.settings-grid{grid-template-columns:1fr}.settings-card.wide{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const sidebar = document.getElementById('sidebar');
  const sideFoot = sidebar?.querySelector('.side-foot');
  const settingsNav = document.createElement('div');
  settingsNav.className = 'settings-nav';
  settingsNav.innerHTML = '<a href="#instellingen"><span class="n">⚙</span><span>Instellingen</span></a>';
  if (sidebar && sideFoot) sidebar.insertBefore(settingsNav, sideFoot);

  const main = document.querySelector('main');
  const footer = main?.querySelector('footer');
  const settingsSection = document.createElement('section');
  settingsSection.className = 'section';
  settingsSection.id = 'instellingen';
  settingsSection.innerHTML = `
    <div class="section-header">
      <div class="section-icon">⚙</div>
      <div><h3>Instellingen</h3><p class="subtitle">Account, export en onderhoud van het portfolio.</p></div>
    </div>
    <div class="settings-grid">
      <article class="settings-card">
        <h4>Account</h4>
        <p>Beheer het ingelogde beheeraccount.</p>
        <div class="settings-meta">
          <div class="settings-meta-row"><span>Ingelogd als</span><strong data-settings-email>—</strong></div>
        </div>
        <div class="settings-actions"><button class="settings-btn secondary" type="button" data-settings-logout>Uitloggen</button></div>
      </article>

      <article class="settings-card">
        <h4>Wachtwoord wijzigen</h4>
        <p>Vul je huidige wachtwoord in en kies daarna een nieuw wachtwoord.</p>
        <div class="settings-form">
          <label>Huidig wachtwoord<input type="password" autocomplete="current-password" data-current-password></label>
          <label>Nieuw wachtwoord<input type="password" autocomplete="new-password" data-new-password></label>
          <label>Herhaal nieuw wachtwoord<input type="password" autocomplete="new-password" data-new-password-confirm></label>
        </div>
        <div class="settings-actions" style="margin-top:12px"><button class="settings-btn" type="button" data-change-password>Wachtwoord wijzigen</button></div>
        <p class="settings-message" data-password-message></p>
      </article>

      <article class="settings-card wide">
        <h4>Portfolio exporteren</h4>
        <p>Maak een zelfstandige kopie van de actuele online portfolio-inhoud.</p>
        <div class="settings-actions">
          <button class="settings-btn" type="button" data-export-html>HTML-bestand</button>
          <button class="settings-btn" type="button" data-export-pdf>PDF</button>
          <button class="settings-btn" type="button" data-export-word>Word (.doc)</button>
          <button class="settings-btn secondary" type="button" data-copy-link>Publieke link kopiëren</button>
        </div>
        <p class="export-help">De HTML- en Word-export bevatten de actuele opgeslagen teksten. Bij PDF opent het afdrukvenster; kies daar “Opslaan als PDF”.</p>
        <p class="settings-message" data-export-message></p>
      </article>

      <article class="settings-card">
        <h4>Status</h4>
        <p>Controleer de actuele online versie.</p>
        <div class="settings-meta">
          <div class="settings-meta-row"><span>Voortgang</span><strong data-settings-progress>—</strong></div>
          <div class="settings-meta-row"><span>Laatste wijziging</span><strong data-settings-updated>—</strong></div>
        </div>
        <div class="settings-actions"><button class="settings-btn secondary" type="button" data-refresh-online>Online inhoud opnieuw laden</button></div>
        <p class="settings-message" data-sync-message></p>
      </article>

      <article class="settings-card">
        <h4>Back-up & lokaal herstel</h4>
        <p>De centrale versie blijft in Supabase staan. Hier kun je daarnaast een gegevensback-up downloaden of alleen de lokale browserkopie vernieuwen.</p>
        <div class="settings-actions">
          <button class="settings-btn secondary" type="button" data-export-json>JSON-back-up</button>
          <button class="settings-btn secondary" type="button" data-clear-cache>Lokale cache vernieuwen</button>
        </div>
        <p class="settings-message" data-maintenance-message></p>
      </article>
    </div>`;
  if (main && footer) main.insertBefore(settingsSection, footer);

  const $ = (selector) => settingsSection.querySelector(selector);
  const safe = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

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

  async function imageAsDataUrl(){
    try{
      const image = document.querySelector('.hero-photo-card img');
      if(!image) return '';
      const response = await fetch(image.src, {cache:'no-store'});
      if(!response.ok) return '';
      const blob = await response.blob();
      return await new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }catch(_err){ return ''; }
  }

  function progressSummary(){
    let total = 0;
    let filled = 0;
    groups.forEach(group => group.topics.forEach(topic => {
      total += 1;
      if(topic.fields.some(([id]) => String(state.values[id] || '').trim())) filled += 1;
    }));
    return {filled,total};
  }

  function topicHtml(topic, number){
    const populated = topic.fields
      .map(([id,label]) => ({label, value:String(state.values[id] || '').trim()}))
      .filter(item => item.value);
    const content = populated.length
      ? populated.map(item => `<div class="field"><h4>${safe(item.label)}</h4><p>${safe(item.value).replace(/\n/g,'<br>')}</p></div>`).join('')
      : '<p class="empty">Nog niet ingevuld.</p>';
    return `<article class="topic"><div class="topic-label">Onderdeel ${number}</div><h3>${safe(topic.title)}</h3>${content}</article>`;
  }

  async function buildExportDocument(){
    const imageData = await imageAsDataUrl();
    const chapters = groups.map(group => {
      const topics = group.topics.map((topic,index)=>topicHtml(topic, `${group.n}.${index+1}`)).join('');
      return `<section class="chapter"><div class="chapter-head"><span>${group.n}</span><div><h2>${safe(group.title)}</h2><p>${safe(group.sub)}</p></div></div>${topics}</section>`;
    }).join('');
    const photo = imageData ? `<img class="portrait" src="${imageData}" alt="Tineke Posthuma">` : '';
    return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio Tineke Posthuma · Wandeltrainer 3</title><style>
      @page{margin:18mm}*{box-sizing:border-box}body{margin:0;background:#fbfaf6;color:#1d2924;font-family:Arial,sans-serif;line-height:1.55}.page{max-width:900px;margin:0 auto;padding:34px}.cover{display:grid;grid-template-columns:1fr 230px;gap:32px;align-items:center;padding:34px;border:1px solid #dedfd6;border-radius:24px;background:#f3eee1;margin-bottom:24px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#1f5e4a}.cover h1{font-family:Georgia,serif;font-size:52px;line-height:.95;margin:12px 0;color:#1d2924}.cover h1 span{color:#1f5e4a}.cover p{color:#526158}.portrait{width:100%;border-radius:18px;border:8px solid #fff}.intro,.chapter{background:#fff;border:1px solid #dfe5df;border-radius:20px;padding:24px;margin:16px 0}.intro h2,.chapter h2,.topic h3{font-family:Georgia,serif}.intro h2{margin-top:0}.chapter-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}.chapter-head>span{display:grid;place-items:center;min-width:40px;height:40px;background:#e6efe9;color:#1f5e4a;border-radius:12px;font-weight:700}.chapter-head h2{margin:0 0 3px}.chapter-head p{margin:0;color:#66746e}.topic{border-top:1px solid #e7ece8;padding:18px 0 6px}.topic:first-of-type{border-top:0}.topic-label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#75857c;font-weight:700}.topic h3{margin:4px 0 12px;color:#294f40}.field{margin:10px 0;padding-left:12px;border-left:3px solid #dbe7df}.field h4{margin:0 0 3px;font-size:12px;color:#446054}.field p{margin:0;white-space:normal;color:#405047}.empty{color:#8a948f;font-style:italic}footer{text-align:center;color:#66746e;font-size:12px;margin:28px 0}@media print{body{background:#fff}.page{padding:0}.cover,.intro,.chapter{break-inside:avoid;box-shadow:none}.topic{break-inside:avoid}}@media(max-width:650px){.page{padding:15px}.cover{grid-template-columns:1fr}.cover h1{font-size:42px}.portrait{max-width:260px}}
    </style></head><body><div class="page"><header class="cover"><div><div class="eyebrow">Portfolio · Wandeltrainer 3</div><h1>Tineke <span>Posthuma</span></h1><p>Een persoonlijk portfolio over mijn ontwikkeling als wandeltrainer, met praktijkervaringen, trainingsplannen, feedback, reflecties en bewijsstukken.</p></div>${photo}</header><section class="intro"><h2>Over dit portfolio</h2><p>Deze website is opgezet als digitaal portfolio voor Wandeltrainer 3. Hier komen de persoonlijke teksten, praktijkvoorbeelden, trainingsplannen, reflecties en bewijsstukken van Tineke samen in één overzichtelijk geheel.</p></section>${chapters}<footer>Portfolio Tineke Posthuma · Wandeltrainer 3</footer></div></body></html>`;
  }

  async function refreshOnlineContent(showMessage=true){
    const message = $('[data-sync-message]');
    if(showMessage && message) message.textContent = 'Online inhoud laden…';
    try{
      const {data,error} = await settingsClient.from('portfolio_content').select('id,value,updated_at');
      if(error) throw error;
      if(Array.isArray(data)){
        data.forEach(row => { state.values[row.id] = row.value ?? ''; });
        const latest = data.map(row=>row.updated_at).filter(Boolean).sort().at(-1) || null;
        if(latest) state.updatedAt = latest;
        try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(_err){}
        renderChapters();
        updateSettingsMeta(latest);
      }
      if(showMessage && message) message.textContent = 'Online inhoud is opnieuw geladen.';
    }catch(err){
      console.error(err);
      if(showMessage && message) message.textContent = 'Opnieuw laden is mislukt.';
    }
  }

  async function updateSettingsMeta(latestOverride=null){
    const {data} = await settingsClient.auth.getSession();
    const session = data?.session;
    $('[data-settings-email]').textContent = session?.user?.email || 'Niet ingelogd';
    const {filled,total} = progressSummary();
    $('[data-settings-progress]').textContent = `${filled} van ${total} onderdelen ingevuld`;
    let latest = latestOverride || state.updatedAt || null;
    if(latest){
      const date = new Date(latest);
      $('[data-settings-updated]').textContent = Number.isNaN(date.getTime()) ? 'Onbekend' : date.toLocaleString('nl-NL');
    }else{
      $('[data-settings-updated]').textContent = 'Nog geen online wijziging';
    }
  }

  $('[data-change-password]')?.addEventListener('click', async()=>{
    const message = $('[data-password-message]');
    const current = $('[data-current-password]').value || '';
    const next = $('[data-new-password]').value || '';
    const confirm = $('[data-new-password-confirm]').value || '';
    if(!current || next.length < 8){ message.textContent='Vul je huidige wachtwoord in en kies een nieuw wachtwoord van minimaal 8 tekens.'; return; }
    if(next !== confirm){ message.textContent='De twee nieuwe wachtwoorden komen niet overeen.'; return; }
    const {data} = await settingsClient.auth.getSession();
    const email = data?.session?.user?.email;
    if(!email){ message.textContent='Je bent niet ingelogd.'; return; }
    message.textContent='Wachtwoord controleren…';
    const {error:signInError} = await settingsClient.auth.signInWithPassword({email,password:current});
    if(signInError){ message.textContent='Het huidige wachtwoord klopt niet.'; return; }
    message.textContent='Nieuw wachtwoord opslaan…';
    const {error} = await settingsClient.auth.updateUser({password:next});
    if(error){ message.textContent='Wachtwoord wijzigen mislukt: '+error.message; return; }
    $('[data-current-password]').value='';
    $('[data-new-password]').value='';
    $('[data-new-password-confirm]').value='';
    message.textContent='Wachtwoord is gewijzigd.';
  });

  $('[data-settings-logout]')?.addEventListener('click', async()=>{
    await settingsClient.auth.signOut();
    location.hash = '#start';
    location.reload();
  });

  $('[data-export-html]')?.addEventListener('click', async()=>{
    const message = $('[data-export-message]');
    message.textContent='HTML-bestand maken…';
    const html = await buildExportDocument();
    downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),'portfolio-tineke-posthuma.html');
    message.textContent='HTML-bestand is gemaakt.';
  });

  $('[data-export-word]')?.addEventListener('click', async()=>{
    const message = $('[data-export-message]');
    message.textContent='Word-bestand maken…';
    const html = await buildExportDocument();
    const wordHtml = html.replace('<html lang="nl">','<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="nl">');
    downloadBlob(new Blob(['\ufeff',wordHtml],{type:'application/msword'}),'portfolio-tineke-posthuma.doc');
    message.textContent='Word-bestand is gemaakt.';
  });

  $('[data-export-pdf]')?.addEventListener('click', async()=>{
    const message = $('[data-export-message]');
    const printWindow = window.open('', '_blank');
    if(!printWindow){ message.textContent='Sta pop-ups toe om de PDF-export te openen.'; return; }
    printWindow.document.write('<p style="font-family:Arial;padding:30px">PDF voorbereiden…</p>');
    message.textContent='PDF voorbereiden…';
    const html = await buildExportDocument();
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(()=>{ printWindow.focus(); printWindow.print(); }, 500);
    message.textContent='Afdrukvenster geopend. Kies “Opslaan als PDF”.';
  });

  $('[data-copy-link]')?.addEventListener('click', async()=>{
    const message = $('[data-export-message]');
    try{ await navigator.clipboard.writeText(SITE_URL); message.textContent='Publieke link is gekopieerd.'; }
    catch(_err){ message.textContent=SITE_URL; }
  });

  $('[data-refresh-online]')?.addEventListener('click',()=>refreshOnlineContent(true));

  $('[data-export-json]')?.addEventListener('click',()=>{
    const backup = {schema_version:1,portfolio:'Tineke Posthuma - Wandeltrainer 3',exported_at:new Date().toISOString(),values:{...state.values}};
    downloadBlob(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),'portfolio-tineke-posthuma-backup.json');
    $('[data-maintenance-message]').textContent='JSON-back-up is gedownload.';
  });

  $('[data-clear-cache]')?.addEventListener('click', async()=>{
    try{ localStorage.removeItem(STORAGE_KEY); }catch(_err){}
    $('[data-maintenance-message]').textContent='Lokale kopie gewist. Online inhoud wordt opnieuw geladen…';
    await refreshOnlineContent(false);
    $('[data-maintenance-message]').textContent='Lokale kopie is vernieuwd vanuit de online versie.';
  });

  settingsClient.auth.onAuthStateChange(()=>setTimeout(updateSettingsMeta,0));
  window.addEventListener('hashchange',()=>{
    settingsNav.querySelector('a')?.classList.toggle('active', location.hash === '#instellingen');
    if(location.hash === '#instellingen') updateSettingsMeta();
  });

  updateSettingsMeta();
})();