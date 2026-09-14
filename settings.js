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
    .settings-window-title{display:flex;align-items:center;gap:11px}.settings-window-title .icon{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.12);display:grid;place-items:center;font-size:1rem}
    .settings-window-title strong{display:block;font-family:Georgia,serif;font-size:1.2rem}.settings-window-title span{display:block;font-size:.72rem;opacity:.76;margin-top:1px}
    .settings-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.10);color:#fff;font-size:1.25rem;cursor:pointer}
    .settings-close:hover{background:#8d3e3e}
    .settings-window-body{padding:18px;overflow:auto;overscroll-behavior:contain}
    .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .settings-card{border:1px solid #dfe5df;border-radius:17px;padding:17px;background:#fcfdfb}
    .settings-card.wide{grid-column:1/-1}
    .settings-card h4{margin:0 0 5px;font-size:1rem;color:#294f40}.settings-card>p{margin:0 0 14px;color:#66746e;font-size:.84rem}
    .settings-form{display:grid;gap:9px}.settings-form label{display:grid;gap:5px;font-size:.76rem;font-weight:800;color:#405047}.settings-form input{width:100%;padding:10px 11px;border:1px solid #ced9d2;border-radius:11px;font:inherit;background:#fff}
    .settings-actions{display:flex;gap:8px;flex-wrap:wrap}.settings-btn{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 12px;font:inherit;font-size:.79rem;font-weight:850;cursor:pointer}.settings-btn.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}.settings-btn.danger{background:#fff1ef;color:#8b3e35;border:1px solid #efd1cd}
    .settings-message{min-height:1.2em;margin:10px 0 0!important;color:#526158!important;font-size:.76rem!important;white-space:pre-line}.settings-meta{display:grid;gap:6px;margin:0 0 14px}.settings-meta-row{display:flex;justify-content:space-between;gap:16px;padding:7px 0;border-bottom:1px solid #edf1ee;font-size:.8rem}.settings-meta-row span{color:#66746e}.settings-meta-row strong{text-align:right;color:#30483d;overflow-wrap:anywhere}.export-help{font-size:.74rem!important;margin-top:9px!important}
    @media(max-width:760px){.settings-grid{grid-template-columns:1fr}.settings-card.wide{grid-column:auto}.settings-window{max-height:92vh}.settings-window-body{padding:13px}}
  `;
  document.head.appendChild(style);

  const oldSection = document.getElementById('instellingen');
  oldSection?.remove();

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

  async function buildExportDocument(){
    const imageData = await imageAsDataUrl();
    const chapters = groups.map(group => `<section class="chapter"><div class="chapter-head"><span>${group.n}</span><div><h2>${esc(group.title)}</h2><p>${esc(group.sub)}</p></div></div>${group.topics.map((topic,index)=>topicHtml(topic,`${group.n}.${index+1}`)).join('')}</section>`).join('');
    const photo = imageData ? `<img class="portrait" src="${imageData}" alt="Tineke Posthuma">` : '';
    return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio Tineke Posthuma · Wandeltrainer 3</title><style>@page{margin:18mm}*{box-sizing:border-box}body{margin:0;background:#fbfaf6;color:#1d2924;font-family:Arial,sans-serif;line-height:1.55}.page{max-width:900px;margin:auto;padding:34px}.cover{display:grid;grid-template-columns:1fr 230px;gap:32px;align-items:center;padding:34px;border:1px solid #dedfd6;border-radius:24px;background:#f3eee1;margin-bottom:24px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#1f5e4a}.cover h1{font-family:Georgia,serif;font-size:52px;line-height:.95;margin:12px 0}.cover h1 span{color:#1f5e4a}.cover p{color:#526158}.portrait{width:100%;border-radius:18px;border:8px solid #fff}.intro,.chapter{background:#fff;border:1px solid #dfe5df;border-radius:20px;padding:24px;margin:16px 0}.intro h2,.chapter h2,.topic h3{font-family:Georgia,serif}.intro h2{margin-top:0}.chapter-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}.chapter-head>span{display:grid;place-items:center;min-width:40px;height:40px;background:#e6efe9;color:#1f5e4a;border-radius:12px;font-weight:700}.chapter-head h2{margin:0 0 3px}.chapter-head p{margin:0;color:#66746e}.topic{border-top:1px solid #e7ece8;padding:18px 0 6px}.topic-label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#75857c;font-weight:700}.topic h3{margin:4px 0 12px;color:#294f40}.field{margin:10px 0;padding-left:12px;border-left:3px solid #dbe7df}.field h4{margin:0 0 3px;font-size:12px;color:#446054}.field p{margin:0;color:#405047}.empty{color:#8a948f;font-style:italic}footer{text-align:center;color:#66746e;font-size:12px;margin:28px 0}@media print{body{background:#fff}.page{padding:0}.cover,.intro,.chapter,.topic{break-inside:avoid}}@media(max-width:650px){.page{padding:15px}.cover{grid-template-columns:1fr}.cover h1{font-size:42px}.portrait{max-width:260px}}</style></head><body><div class="page"><header class="cover"><div><div class="eyebrow">Portfolio · Wandeltrainer 3</div><h1>Tineke <span>Posthuma</span></h1><p>Een persoonlijk portfolio over mijn ontwikkeling als wandeltrainer, met praktijkervaringen, trainingsplannen, feedback, reflecties en bewijsstukken.</p></div>${photo}</header><section class="intro"><h2>Over dit portfolio</h2><p>Deze website is opgezet als digitaal portfolio voor Wandeltrainer 3. Hier komen de persoonlijke teksten, praktijkvoorbeelden, trainingsplannen, reflecties en bewijsstukken van Tineke samen in één overzichtelijk geheel.</p></section>${chapters}<footer>Portfolio Tineke Posthuma · Wandeltrainer 3</footer></div></body></html>`;
  }

  async function refreshOnlineContent(messageEl){
    if(messageEl) messageEl.textContent='Online inhoud laden…';
    try{
      const {data,error}=await client.from('portfolio_content').select('id,value,updated_at');
      if(error) throw error;
      if(Array.isArray(data)){
        data.forEach(row=>{state.values[row.id]=row.value??'';});
        const latest=data.map(row=>row.updated_at).filter(Boolean).sort().at(-1)||null;
        if(latest) state.updatedAt=latest;
        try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_err){}
        renderChapters();
      }
      if(messageEl) messageEl.textContent='Online inhoud is opnieuw geladen.';
    }catch(err){
      console.error(err);
      if(messageEl) messageEl.textContent='Opnieuw laden is mislukt.';
    }
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
      <header class="settings-window-head"><div class="settings-window-title"><div class="icon">⚙</div><div><strong>Instellingen</strong><span>Account, export en onderhoud</span></div></div><button class="settings-close" type="button" aria-label="Sluiten">×</button></header>
      <div class="settings-window-body"><div class="settings-grid">
        <article class="settings-card"><h4>Account</h4><p>Beheer het ingelogde beheeraccount.</p><div class="settings-meta"><div class="settings-meta-row"><span>Ingelogd als</span><strong>${esc(session.user?.email||'—')}</strong></div></div><div class="settings-actions"><button class="settings-btn secondary" type="button" data-settings-logout>Uitloggen</button></div></article>
        <article class="settings-card"><h4>Wachtwoord wijzigen</h4><p>Controleer eerst je huidige wachtwoord en kies daarna een nieuw wachtwoord.</p><div class="settings-form"><label>Huidig wachtwoord<input type="password" autocomplete="current-password" data-current-password></label><label>Nieuw wachtwoord<input type="password" autocomplete="new-password" data-new-password></label><label>Herhaal nieuw wachtwoord<input type="password" autocomplete="new-password" data-new-password-confirm></label></div><div class="settings-actions" style="margin-top:12px"><button class="settings-btn" type="button" data-change-password>Wachtwoord wijzigen</button></div><p class="settings-message" data-password-message></p></article>
        <article class="settings-card wide"><h4>Portfolio exporteren</h4><p>Maak een zelfstandige kopie van de actuele portfolio-inhoud.</p><div class="settings-actions"><button class="settings-btn" type="button" data-export-html>HTML-bestand</button><button class="settings-btn" type="button" data-export-pdf>PDF</button><button class="settings-btn" type="button" data-export-word>Word (.doc)</button><button class="settings-btn secondary" type="button" data-copy-link>Publieke link kopiëren</button></div><p class="export-help">HTML en Word bevatten de actuele opgeslagen teksten. Voor PDF opent het afdrukvenster; kies daar “Opslaan als PDF”.</p><p class="settings-message" data-export-message></p></article>
        <article class="settings-card"><h4>Status</h4><p>Controleer de actuele online versie.</p><div class="settings-meta"><div class="settings-meta-row"><span>Voortgang</span><strong data-settings-progress>${progress.filled} van ${progress.total} onderdelen</strong></div><div class="settings-meta-row"><span>Laatste wijziging</span><strong data-settings-updated>${esc(updated)}</strong></div></div><div class="settings-actions"><button class="settings-btn secondary" type="button" data-refresh-online>Online inhoud opnieuw laden</button></div><p class="settings-message" data-sync-message></p></article>
        <article class="settings-card"><h4>Back-up & lokaal herstel</h4><p>Download een gegevensback-up of vernieuw alleen de lokale browserkopie. De centrale versie blijft in Supabase staan.</p><div class="settings-actions"><button class="settings-btn secondary" type="button" data-export-json>JSON-back-up</button><button class="settings-btn secondary" type="button" data-clear-cache>Lokale cache vernieuwen</button></div><p class="settings-message" data-maintenance-message></p></article>
      </div></div>
    </section>`;
    document.body.appendChild(overlay);
    const previousOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';

    const close=()=>{
      overlay.remove();
      document.documentElement.style.overflow=previousOverflow;
      document.body.style.overflow='';
    };
    overlay.querySelector('.settings-close')?.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay) close();});

    const passwordMessage=overlay.querySelector('[data-password-message]');
    overlay.querySelector('[data-change-password]')?.addEventListener('click',async()=>{
      const current=overlay.querySelector('[data-current-password]')?.value||'';
      const next=overlay.querySelector('[data-new-password]')?.value||'';
      const confirm=overlay.querySelector('[data-new-password-confirm]')?.value||'';
      if(!current||next.length<8){passwordMessage.textContent='Vul je huidige wachtwoord in en kies een nieuw wachtwoord van minimaal 8 tekens.';return;}
      if(next!==confirm){passwordMessage.textContent='De twee nieuwe wachtwoorden komen niet overeen.';return;}
      passwordMessage.textContent='Wachtwoord controleren…';
      const email=session.user?.email||'';
      const {error:verifyError}=await client.auth.signInWithPassword({email,password:current});
      if(verifyError){passwordMessage.textContent='Het huidige wachtwoord klopt niet.';return;}
      const {error:updateError}=await client.auth.updateUser({password:next});
      if(updateError){passwordMessage.textContent='Wachtwoord wijzigen mislukt: '+updateError.message;return;}
      passwordMessage.textContent='Wachtwoord is gewijzigd.';
      overlay.querySelector('[data-current-password]').value='';
      overlay.querySelector('[data-new-password]').value='';
      overlay.querySelector('[data-new-password-confirm]').value='';
    });

    overlay.querySelector('[data-settings-logout]')?.addEventListener('click',async()=>{await client.auth.signOut();close();location.reload();});

    const exportMessage=overlay.querySelector('[data-export-message]');
    overlay.querySelector('[data-export-html]')?.addEventListener('click',async()=>{exportMessage.textContent='HTML maken…';const html=await buildExportDocument();downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),'portfolio-tineke-posthuma.html');exportMessage.textContent='HTML-bestand gemaakt.';});
    overlay.querySelector('[data-export-word]')?.addEventListener('click',async()=>{exportMessage.textContent='Word-bestand maken…';const html=await buildExportDocument();downloadBlob(new Blob(['\ufeff',html],{type:'application/msword'}),'portfolio-tineke-posthuma.doc');exportMessage.textContent='Word-bestand gemaakt.';});
    overlay.querySelector('[data-export-pdf]')?.addEventListener('click',async()=>{exportMessage.textContent='PDF-weergave openen…';const html=await buildExportDocument();const win=window.open('','_blank');if(!win){exportMessage.textContent='Sta pop-ups toe om PDF te maken.';return;}win.document.open();win.document.write(html);win.document.close();win.addEventListener('load',()=>setTimeout(()=>win.print(),250),{once:true});exportMessage.textContent='Kies in het afdrukvenster “Opslaan als PDF”.';});
    overlay.querySelector('[data-copy-link]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(SITE_URL);exportMessage.textContent='Publieke link gekopieerd.';}catch(_err){exportMessage.textContent='Kopiëren lukte niet. Gebruik: '+SITE_URL;}});

    const syncMessage=overlay.querySelector('[data-sync-message]');
    overlay.querySelector('[data-refresh-online]')?.addEventListener('click',async()=>{await refreshOnlineContent(syncMessage);const p=progressSummary();overlay.querySelector('[data-settings-progress]').textContent=`${p.filled} van ${p.total} onderdelen`;overlay.querySelector('[data-settings-updated]').textContent=state.updatedAt?new Date(state.updatedAt).toLocaleString('nl-NL'):'Nog niet bekend';});

    const maintenance=overlay.querySelector('[data-maintenance-message]');
    overlay.querySelector('[data-export-json]')?.addEventListener('click',()=>{const payload={schema_version:1,exported_at:new Date().toISOString(),portfolio:'Tineke Posthuma - Wandeltrainer 3',values:state.values};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),'portfolio-tineke-posthuma-backup.json');maintenance.textContent='JSON-back-up gedownload.';});
    overlay.querySelector('[data-clear-cache]')?.addEventListener('click',async()=>{try{localStorage.removeItem(STORAGE_KEY);}catch(_err){}await refreshOnlineContent(maintenance);maintenance.textContent='Lokale browserkopie is vernieuwd vanuit de online versie.';});
  }

  settingsNav?.querySelector('[data-open-settings]')?.addEventListener('click',openSettings);
})();