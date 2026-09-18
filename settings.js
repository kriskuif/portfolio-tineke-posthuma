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
        pattern:'linear-gradient(135deg, rgba(40,88,106,.03), rgba(40,88,106,.00))'
      },
      minimal:{
        id:'minimal',name:'Duin & Zee',
        bg:'#f8f5ed',paper:'#fffefb',ink:'#24323a',muted:'#6b797e',line:'#d9e1df',
        accent:'#245b78',accentSoft:'#dfecef',heroA:'#f6ebd5',heroB:'#dfeef1',
        bodyFont:'Verdana, Geneva, sans-serif',titleFont:'Palatino Linotype, Georgia, serif',
        pattern:'radial-gradient(ellipse at 88% 12%, rgba(91,158,183,.16) 0 13%, transparent 13.5%), radial-gradient(ellipse at 78% 100%, rgba(217,191,130,.20) 0 18%, transparent 18.5%)',
        bodyBg:'url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20180%22%3E%0A%20%20%3Cg%20fill%3D%22none%22%20stroke%3D%22%235f9fb4%22%20stroke-linecap%3D%22round%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%2048%20C75%2018%20150%2018%20225%2048%20S375%2078%20450%2048%20S525%2018%20600%2048%22%20stroke-width%3D%222.2%22%20opacity%3D%22.13%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%2092%20C75%2062%20150%2062%20225%2092%20S375%20122%20450%2092%20S525%2062%20600%2092%22%20stroke-width%3D%221.8%22%20opacity%3D%22.09%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%20136%20C75%20106%20150%20106%20225%20136%20S375%20166%20450%20136%20S525%20106%20600%20136%22%20stroke-width%3D%221.5%22%20opacity%3D%22.07%22%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E") repeat, linear-gradient(180deg,#eef6f7 0,#f8f5ed 220px,#f8f5ed 100%)'
      }
    };
    return profiles[id] || profiles.natuurlijk;
  }

  function exportThemeMotif(id){
    if(id==='wandelgids') return `<svg class="export-motif" aria-hidden="true" viewBox="0 0 250 250">
            <g fill="currentColor">
              <!-- brede stam met de typische openingen/bochten uit een tree-of-life silhouet -->
              <path d="M104 224
                       C96 207 94 190 96 172
                       C99 148 101 129 96 112
                       C91 96 83 84 69 72
                       L78 64
                       C91 73 101 84 108 97
                       C106 79 110 60 121 42
                       L132 45
                       C122 64 119 82 123 99
                       C132 80 145 65 163 53
                       L171 62
                       C152 76 139 93 133 112
                       C147 96 164 84 184 76
                       L189 88
                       C166 98 149 112 137 131
                       C128 146 125 164 127 184
                       C129 201 126 215 118 226
                       Z"></path>

              <!-- hoofdtakken, dik en vloeiend zoals de referentie -->
              <path d="M107 130
                       C91 116 77 109 56 108
                       C41 107 31 101 22 91
                       L27 83
                       C39 92 50 96 64 94
                       C82 92 98 98 111 108Z"></path>
              <path d="M109 112
                       C94 96 80 88 62 85
                       C51 83 43 78 35 70
                       L42 62
                       C53 70 64 73 76 72
                       C91 70 103 76 113 89Z"></path>
              <path d="M115 91
                       C108 75 99 64 86 56
                       C75 49 68 41 64 30
                       L75 27
                       C81 38 90 45 102 49
                       C113 53 121 61 126 74Z"></path>
              <path d="M132 126
                       C149 111 165 103 185 102
                       C203 101 216 94 226 83
                       L232 91
                       C220 104 206 111 190 113
                       C168 116 151 126 137 141Z"></path>
              <path d="M131 108
                       C146 92 161 84 179 81
                       C192 79 202 73 210 64
                       L217 72
                       C207 83 196 89 183 91
                       C166 94 151 102 137 117Z"></path>
              <path d="M129 89
                       C137 72 147 61 160 53
                       C172 46 181 38 186 27
                       L197 31
                       C191 44 181 54 168 61
                       C156 68 147 79 141 94Z"></path>

              <!-- lagere zijtakken die de ronde kroon afmaken -->
              <path d="M101 151
                       C82 142 66 140 48 144
                       C35 147 25 145 15 139
                       L19 130
                       C31 136 42 136 55 132
                       C75 126 94 130 108 140Z"></path>
              <path d="M132 154
                       C151 143 168 140 188 144
                       C201 147 213 145 225 138
                       L230 147
                       C217 155 203 157 190 154
                       C170 150 153 154 137 165Z"></path>

              <!-- boomwortels: breed, symmetrisch en duidelijk zichtbaar -->
              <path d="M106 217
                       C91 217 79 214 68 207
                       C60 202 51 199 40 201
                       C49 193 59 190 72 193
                       C81 195 90 198 100 197Z"></path>
              <path d="M116 220
                       C100 227 87 233 70 235
                       C80 227 89 219 99 210Z"></path>
              <path d="M111 222
                       C102 237 94 242 83 246
                       C88 235 93 224 101 214Z"></path>
              <path d="M119 223
                       C114 239 108 246 101 250
                       C103 238 106 227 111 216Z"></path>
              <path d="M123 222
                       C129 239 135 246 142 250
                       C140 238 137 227 132 216Z"></path>
              <path d="M128 220
                       C144 227 157 233 174 235
                       C164 227 155 219 145 210Z"></path>
              <path d="M138 217
                       C153 217 165 214 176 207
                       C184 202 193 199 204 201
                       C195 193 185 190 172 193
                       C163 195 154 198 144 197Z"></path>

              <!-- losse bladeren: vergelijkbaar met de druppelvormige bladeren uit de referentie -->
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(31 83) rotate(-68) scale(0.86)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(43 66) rotate(-55) scale(0.92)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(58 51) rotate(-46) scale(0.88)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(75 38) rotate(-34) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(95 28) rotate(-20) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(116 22) rotate(-6) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(137 24) rotate(14) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(158 31) rotate(28) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(178 43) rotate(42) scale(0.86)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(197 58) rotate(56) scale(0.9)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(214 77) rotate(68) scale(0.84)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(24 105) rotate(-78) scale(0.84)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(42 96) rotate(-62) scale(0.9)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(61 83) rotate(-48) scale(0.88)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(82 67) rotate(-35) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(105 55) rotate(-20) scale(0.8)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(132 55) rotate(18) scale(0.8)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(154 68) rotate(34) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(177 82) rotate(48) scale(0.86)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(199 96) rotate(62) scale(0.9)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(219 106) rotate(78) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(28 130) rotate(-82) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(49 124) rotate(-68) scale(0.88)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(70 109) rotate(-52) scale(0.84)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(94 91) rotate(-34) scale(0.8)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(119 78) rotate(-15) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(143 81) rotate(17) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(166 95) rotate(35) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(190 109) rotate(52) scale(0.86)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(211 123) rotate(69) scale(0.86)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(38 151) rotate(-76) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(60 149) rotate(-61) scale(0.84)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(82 132) rotate(-44) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(106 112) rotate(-27) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(147 113) rotate(28) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(171 131) rotate(44) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(193 147) rotate(61) scale(0.84)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(216 151) rotate(77) scale(0.76)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(53 172) rotate(-69) scale(0.76)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(76 169) rotate(-53) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(99 149) rotate(-37) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(160 150) rotate(38) scale(0.78)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(183 169) rotate(53) scale(0.82)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(206 172) rotate(69) scale(0.76)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(72 188) rotate(-58) scale(0.72)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(94 181) rotate(-43) scale(0.76)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(166 182) rotate(43) scale(0.76)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(189 188) rotate(58) scale(0.72)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(89 56) rotate(-6) scale(0.68)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(149 53) rotate(12) scale(0.68)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(69 72) rotate(-18) scale(0.7)"></path>
              <path d="M0-12C9-11 14-3 10 5C6 13-4 15-11 9C-17 3-14-7-6-11C-4-12-2-12 0-12Z" transform="translate(172 71) rotate(20) scale(0.7)"></path>
            </g>
          </svg>`;
    if(id==='tijdschrift') return `<svg class="export-motif" aria-hidden="true" viewBox="0 0 220 220">
      <path d="M46.4 10 L47.3 55.8 L43.3 60.7 L33.1 57.1 L58.9 87.8 L51.3 90.4 L34 81.1 L25.1 88.7 L10 82 L21.6 94.4 L21.6 102.4 L31.3 108.7 L28.7 116.7 L43.3 126.4 L66.4 128.7 L71.8 134.9 L38.4 134.9 L37.1 144.2 L14.4 154 L42 166 L45.1 172.7 L41.1 176.7 L50 178.9 L82.9 169.1 L83.8 175.3 L64.2 196.7 L74 193.1 L99.3 199.3 L111.3 180.7 L120.2 189.1 L136.7 166.4 L138.9 154 L172.2 191.8 L173.6 185.6 L142.9 152.7 L173.1 155.8 L173.6 147.8 L190.9 145.1 L205.1 133.1 L182.4 128.7 L180.2 123.8 L202 112.7 L209.6 102.4 L202.9 95.3 L207.8 57.6 L200.7 67.3 L185.1 74 L180.7 70 L165.6 87.8 L158.4 89.1 L161.6 65.6 L154.4 45.6 L156.2 31.8 L145.6 41.6 L125.1 16.2 L127.3 35.8 L125.1 42.4 L119.8 41.6 L122 75.8 L117.6 77.1 L110.4 61.1 L113.1 40.7 L106.9 43.8 L98.4 34.4 L89.6 39.3 L79.8 30 L61.1 24.7 Z" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M171.8 190.2 C157.5 174.8 144.3 158.3 132.7 143.4 C126.5 111.5 125.5 77.8 125.2 25.5" stroke-width="3.1"/>
        <path d="M132.7 143.4 C116.8 120.8 94.4 95.1 51.6 20.7 M131.7 143.2 C108.4 133.3 82.3 119.6 25.2 90.2 M130.8 144.1 C100.5 147.2 72.2 151.8 25.4 158.4 M132 145.2 C111.9 158.9 96.4 174.3 72.4 193.3 M133.4 143.1 C143.6 112 149.8 79.1 153.7 39.3 M133.9 143.8 C155.4 125.1 177.8 109.1 204.7 98.9 M134.1 144.5 C154.2 143.6 175.4 141.2 198.7 134.3" stroke-width="2.6"/>
        <path d="M104.2 104.7 L79.5 93.6 M94.7 89.8 L68 75.2 M82.2 70.4 L60.1 56.1 M66.4 48.8 L54.3 37.6 M101.4 130.4 L72.1 126.6 M82.4 139.6 L51.5 143.8 M101.9 157.7 L83 166.8 M91.2 174.7 L78.2 183.7 M141.7 112.2 L159.6 93 M148 91.5 L166.2 72.7 M151.8 68.8 L157 52.1 M151.9 126.4 L178.2 113 M161.9 134.6 L187.2 129.4 M151.2 148 L174.1 149.3" stroke-width="1.7" opacity=".78"/>
        <path d="M59.1 40.8 C76.7 54.3 91.4 70.5 103.4 88.7 M44.5 96.1 C68.1 106.7 90.1 119 108.7 132.3 M49.8 158.2 C75.1 157.4 95.7 154.1 113.6 148.5 M145.3 56.8 C141.2 82.2 137.8 104.5 135 126.2 M178.9 82.5 C161.8 99.4 149.7 115.5 139.4 132.8" stroke-width="1.15" opacity=".58"/>
      </g>
    </svg>`;
    if(id==='dagboek') return `<svg class="export-motif" aria-hidden="true" viewBox="-28 -28 296 296"><circle cx="120" cy="120" r="96" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="120" cy="120" r="78" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="120" cy="120" r="54" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="120.0,38.0 125.1,94.5 151.4,44.2 134.4,98.4 178.0,62.0 141.6,105.6 195.8,88.6 145.5,114.9 202.0,120.0 145.5,125.1 195.8,151.4 141.6,134.4 178.0,178.0 134.4,141.6 151.4,195.8 125.1,145.5 120.0,202.0 114.9,145.5 88.6,195.8 105.6,141.6 62.0,178.0 98.4,134.4 44.2,151.4 94.5,125.1 38.0,120.0 94.5,114.9 44.2,88.6 98.4,105.6 62.0,62.0 105.6,98.4 88.6,44.2 114.9,94.5" fill="currentColor" fill-opacity=".20" stroke="currentColor" stroke-width="1.6"/><path d="M120 8L132 102L120 120L108 102Z M232 120L138 132L120 120L138 108Z M120 232L108 138L120 120L132 138Z M8 120L102 108L120 120L102 132Z" fill="currentColor" fill-opacity=".55" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/><path d="M199 41L139 106L120 120L134 93Z M199 199L134 147L120 120L147 134Z M41 199L106 139L120 120L93 134Z M41 41L106 101L120 120L93 106Z" fill="currentColor" fill-opacity=".34" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/><circle cx="120" cy="120" r="17" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="120" cy="120" r="7" fill="currentColor"/><g fill="currentColor" font-family="Arial, sans-serif" font-size="15" font-weight="700" text-anchor="middle"><text x="120" y="-3">N</text><text x="120" y="259">Z</text><text x="-12" y="125">W</text><text x="252" y="125">O</text></g></svg>`;
    if(id==='minimal') return `<svg class="export-motif export-shell-main" aria-hidden="true" viewBox="0 0 260 230" style="transform:rotate(-12deg);transform-origin:center">
      <path d="M130 21 Q121 14 111 22 Q99 17 90 28 Q77 24 70 38 Q56 36 52 51 Q38 51 36 67 Q22 72 26 87 Q15 97 22 111 Q14 124 25 135 Q21 149 35 157 Q35 169 49 175 Q57 182 74 184 L82 188 L85 202 L76 211 L103 217 L120 213 Q130 222 140 213 L157 217 L184 211 L175 202 L178 188 L186 184 Q203 182 211 175 Q225 169 225 157 Q239 149 235 135 Q246 124 238 111 Q245 97 234 87 Q238 72 224 67 Q222 51 208 51 Q204 36 190 38 Q183 24 170 28 Q161 17 149 22 Q139 14 130 21Z" fill="none" stroke="currentColor" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M130 198 C129 150 129 92 130 22 M126 197 C119 149 115 91 111 23 M121 197 C108 151 99 94 91 29 M116 196 C96 151 81 97 71 40 M111 195 C85 153 64 105 53 54 M106 194 C74 156 49 115 38 72 M101 193 C64 161 38 127 26 91 M134 197 C141 149 145 91 149 23 M139 197 C152 151 161 94 169 29 M144 196 C164 151 179 97 189 40 M149 195 C175 153 196 105 207 54 M154 194 C186 156 211 115 222 72 M159 193 C196 161 222 127 234 91" fill="none" stroke="currentColor" stroke-width="3.7" stroke-linecap="round"/>
      <path d="M124 191 C111 145 106 88 102 31 M118 190 C96 146 88 92 81 42 M112 188 C82 149 66 104 57 66 M106 186 C72 155 50 124 39 99 M136 191 C149 145 154 88 158 31 M142 190 C164 146 172 92 179 42 M148 188 C178 149 194 104 203 66 M154 186 C188 155 210 124 221 99" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity=".78"/>
      <path d="M104 39 l-4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 M84 48 l-4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 5 2 M63 63 l-4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 M156 39 l4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5 M176 48 l4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5 -5 2 M197 63 l4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" opacity=".82"/>
      <path d="M82 188 Q95 181 109 187 Q119 194 130 201 Q141 194 151 187 Q165 181 178 188 M85 202 Q104 197 120 204 Q130 209 140 204 Q156 197 175 202" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    </svg><svg class="export-motif export-shell-small" aria-hidden="true" viewBox="0 0 260 230" style="transform:rotate(-40deg);transform-origin:center">
      <path d="M130 21 Q121 14 111 22 Q99 17 90 28 Q77 24 70 38 Q56 36 52 51 Q38 51 36 67 Q22 72 26 87 Q15 97 22 111 Q14 124 25 135 Q21 149 35 157 Q35 169 49 175 Q57 182 74 184 L82 188 L85 202 L76 211 L103 217 L120 213 Q130 222 140 213 L157 217 L184 211 L175 202 L178 188 L186 184 Q203 182 211 175 Q225 169 225 157 Q239 149 235 135 Q246 124 238 111 Q245 97 234 87 Q238 72 224 67 Q222 51 208 51 Q204 36 190 38 Q183 24 170 28 Q161 17 149 22 Q139 14 130 21Z" fill="none" stroke="currentColor" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M130 198 C129 150 129 92 130 22 M126 197 C119 149 115 91 111 23 M121 197 C108 151 99 94 91 29 M116 196 C96 151 81 97 71 40 M111 195 C85 153 64 105 53 54 M106 194 C74 156 49 115 38 72 M101 193 C64 161 38 127 26 91 M134 197 C141 149 145 91 149 23 M139 197 C152 151 161 94 169 29 M144 196 C164 151 179 97 189 40 M149 195 C175 153 196 105 207 54 M154 194 C186 156 211 115 222 72 M159 193 C196 161 222 127 234 91" fill="none" stroke="currentColor" stroke-width="3.7" stroke-linecap="round"/>
      <path d="M124 191 C111 145 106 88 102 31 M118 190 C96 146 88 92 81 42 M112 188 C82 149 66 104 57 66 M106 186 C72 155 50 124 39 99 M136 191 C149 145 154 88 158 31 M142 190 C164 146 172 92 179 42 M148 188 C178 149 194 104 203 66 M154 186 C188 155 210 124 221 99" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity=".78"/>
      <path d="M104 39 l-4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 M84 48 l-4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 5 2 M63 63 l-4 5 5 2 -4 5 5 2 -4 5 5 2 -4 5 M156 39 l4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5 M176 48 l4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5 -5 2 M197 63 l4 5 -5 2 4 5 -5 2 4 5 -5 2 4 5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" opacity=".82"/>
      <path d="M82 188 Q95 181 109 187 Q119 194 130 201 Q141 194 151 187 Q165 181 178 188 M85 202 Q104 197 120 204 Q130 209 140 204 Q156 197 175 202" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
    return `<svg class="export-route" aria-hidden="true" viewBox="0 0 280 230"><path d="M20 210C70 177 116 190 101 145C88 105 35 125 58 82C82 37 150 90 178 52C199 24 232 16 258 28" fill="none" stroke="currentColor" stroke-dasharray="2 16" stroke-linecap="round" stroke-width="7"/><circle cx="20" cy="210" r="7" fill="currentColor"/><path d="M245 16L266 28L249 45" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/></svg>`;
  }

  async function buildExportDocument(){
    const imageData = await imageAsDataUrl();
    const theme = exportThemeProfile();
    const chapters = groups.map(group => `<section class="chapter"><div class="chapter-head"><span>${group.n}</span><div><h2>${esc(group.title)}</h2><p>${esc(group.sub)}</p></div></div>${group.topics.map((topic,index)=>topicHtml(topic,`${group.n}.${index+1}`)).join('')}</section>`).join('');
    const photo = imageData ? `<img class="portrait" src="${imageData}" alt="Tineke Posthuma">` : '';
    const motif = exportThemeMotif(theme.id);
    return `<!DOCTYPE html><html lang="nl" data-portfolio-theme="${theme.id}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio Tineke Posthuma · Wandeltrainer 3</title><style>
      @page{margin:18mm}
      *{box-sizing:border-box}
      html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{margin:0;background:${theme.bodyBg||theme.bg};color:${theme.ink};font-family:${theme.bodyFont};line-height:1.55}
      .page{max-width:900px;margin:auto;padding:34px}
      .cover{position:relative;overflow:hidden;display:grid;grid-template-columns:1fr 230px;gap:32px;align-items:center;padding:34px;border:1px solid ${theme.line};border-radius:24px;background:${theme.pattern},linear-gradient(135deg,${theme.heroA},${theme.heroB});margin-bottom:24px}
      .cover>div,.portrait{position:relative;z-index:2}
      .export-motif,.export-route{position:absolute;right:245px;top:22px;width:190px;height:190px;color:${theme.accent};opacity:.11;z-index:1}
      .export-shell-main{transform:rotate(-12deg)!important;transform-origin:center}
      .export-shell-small{width:95px;height:95px;right:473px;top:124px;opacity:.09;transform:rotate(-40deg)!important;transform-origin:center}
      .export-route{width:230px;height:190px;right:230px;top:28px;opacity:.23}
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
    </style></head><body><div class="page"><header class="cover"><div><div class="eyebrow">Portfolio · Wandeltrainer 3</div><h1>Tineke <span>Posthuma</span></h1><p>Een persoonlijk portfolio over mijn ontwikkeling als wandeltrainer, met praktijkervaringen, trainingsplannen, feedback, reflecties en bewijsstukken.</p><span class="theme-label">Thema: ${esc(theme.name)}</span></div>${photo}${motif}</header><section class="intro"><h2>Over dit portfolio</h2><p>Deze website is opgezet als digitaal portfolio voor Wandeltrainer 3. Hier komen de persoonlijke teksten, praktijkvoorbeelden, trainingsplannen, reflecties en bewijsstukken van Tineke samen in één overzichtelijk geheel.</p></section>${chapters}<footer>Portfolio Tineke Posthuma · Wandeltrainer 3</footer></div></body></html>`;
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