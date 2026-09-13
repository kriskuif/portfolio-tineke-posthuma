(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const style = document.createElement('style');
  style.textContent = `
    body:not(.can-edit) .topic-edit-btn,
    body:not(.can-edit) .top-actions { display:none !important; }
    .manage-btn{margin-left:auto;border:1px solid #dce7df;background:#fff;color:#1f5e4a;padding:8px 12px;border-radius:11px;font-weight:800;cursor:pointer}
    body.can-edit .manage-btn{margin-left:0}
    .auth-overlay{position:fixed;inset:0;z-index:3000;background:rgba(20,38,31,.36);display:grid;place-items:center;padding:20px}
    .auth-card{width:min(420px,100%);background:#fff;border-radius:20px;box-shadow:0 26px 80px rgba(20,43,34,.28);padding:22px;border:1px solid #dfe5df}
    .auth-card h3{margin:0 0 5px;font-family:Georgia,serif;color:#234f42}
    .auth-card p{margin:0 0 16px;color:#66746e;font-size:.88rem}
    .auth-fields{display:grid;gap:10px}.auth-fields input{width:100%;padding:11px 12px;border:1px solid #ced9d2;border-radius:11px;font:inherit}
    .auth-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.auth-actions button{border:0;border-radius:11px;padding:9px 12px;font-weight:800;cursor:pointer;background:#1f5e4a;color:#fff}.auth-actions button.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .auth-close{float:right;border:0;background:transparent;font-size:1.3rem;cursor:pointer;color:#66746e}.auth-message{margin-top:12px!important;font-size:.8rem!important}
  `;
  document.head.appendChild(style);

  const topbar = document.querySelector('.topbar');
  const manageBtn = document.createElement('button');
  manageBtn.className = 'manage-btn';
  manageBtn.type = 'button';
  manageBtn.textContent = 'Beheer';
  topbar?.appendChild(manageBtn);

  let currentSession = null;
  let remoteReady = false;

  function setCanEdit(session){
    currentSession = session || null;
    document.body.classList.toggle('can-edit', !!session);
    manageBtn.textContent = session ? 'Beheer · ingelogd' : 'Beheer';
    renderChapters?.();
  }

  async function loadRemoteContent(){
    try{
      const { data, error } = await client.from('portfolio_content').select('id,value,updated_at');
      if(error) throw error;
      if(Array.isArray(data) && data.length){
        data.forEach(row => { state.values[row.id] = row.value ?? ''; });
        const latest = data.map(r=>r.updated_at).filter(Boolean).sort().at(-1);
        if(latest) state.updatedAt = latest;
        try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(_err){}
        renderChapters();
        setStatus('Portfolio geladen','saved');
      }
      remoteReady = true;
    }catch(err){
      console.error('Portfolio laden mislukt:', err);
      setStatus('Online inhoud kon niet worden geladen','error');
    }
  }

  function openAuth(){
    const existing = document.querySelector('.auth-overlay');
    if(existing){ existing.remove(); return; }
    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `<div class="auth-card">
      <button class="auth-close" type="button" aria-label="Sluiten">×</button>
      <h3>Portfolio beheren</h3>
      <p>${currentSession ? 'Je bent ingelogd en kunt de portfolio-onderdelen aanpassen.' : 'Log in om portfolio-onderdelen te kunnen invullen en op de openbare website op te slaan.'}</p>
      ${currentSession ? '' : `<div class="auth-fields"><input type="email" data-auth-email placeholder="E-mailadres"><input type="password" data-auth-password placeholder="Wachtwoord"></div>`}
      <div class="auth-actions">
        ${currentSession ? '<button type="button" data-auth-logout>Uitloggen</button>' : '<button type="button" data-auth-login>Inloggen</button><button type="button" class="secondary" data-auth-signup>Account aanmaken</button>'}
      </div>
      <p class="auth-message" data-auth-message></p>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.auth-close')?.addEventListener('click',()=>overlay.remove());
    overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });

    const message = overlay.querySelector('[data-auth-message]');
    const credentials = () => ({
      email: overlay.querySelector('[data-auth-email]')?.value.trim(),
      password: overlay.querySelector('[data-auth-password]')?.value || ''
    });

    overlay.querySelector('[data-auth-login]')?.addEventListener('click', async()=>{
      const {email,password}=credentials();
      if(!email||!password){ message.textContent='Vul e-mailadres en wachtwoord in.'; return; }
      message.textContent='Inloggen…';
      const { data, error } = await client.auth.signInWithPassword({email,password});
      if(error){ message.textContent='Inloggen mislukt: '+error.message; return; }
      setCanEdit(data.session);
      message.textContent='Ingelogd.';
      setTimeout(()=>overlay.remove(),500);
    });

    overlay.querySelector('[data-auth-signup]')?.addEventListener('click', async()=>{
      const {email,password}=credentials();
      if(!email||password.length<8){ message.textContent='Gebruik een geldig e-mailadres en een wachtwoord van minimaal 8 tekens.'; return; }
      message.textContent='Account aanmaken…';
      const { error } = await client.auth.signUp({email,password});
      if(error){ message.textContent='Account maken mislukt: '+error.message; return; }
      message.textContent='Account aangemaakt. Controleer je e-mail om het account te bevestigen. Daarna kun je hier inloggen.';
    });

    overlay.querySelector('[data-auth-logout]')?.addEventListener('click', async()=>{
      await client.auth.signOut();
      setCanEdit(null);
      overlay.remove();
    });
  }

  manageBtn.addEventListener('click',openAuth);

  const originalSaveWindow = saveWindow;
  saveWindow = async function(win){
    if(!win || !openWindows.has(win.key)) return;
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData?.session;
    if(!session){
      setStatus('Log eerst in om wijzigingen op de website op te slaan','error');
      openAuth();
      return;
    }

    const previous = {};
    const rows = [];
    win.topic.fields.forEach(([id])=>{
      previous[id] = state.values[id] || '';
      const field = win.el.querySelector(`[data-modal-field="${id}"]`);
      const value = field?.value || '';
      state.values[id] = value;
      rows.push({id,value});
    });

    setStatus('Opslaan op website…','saving');
    const { error } = await client.from('portfolio_content').upsert(rows,{onConflict:'id'});
    if(error){
      Object.entries(previous).forEach(([id,value])=>{ state.values[id]=value; });
      setStatus('Opslaan op website mislukt','error');
      console.error('Online opslaan mislukt:', error);
      return;
    }

    persistState(`${win.topic.title} opgeslagen op website`);
    setWindowDirty(win,false);
    const cardSelector=`[data-topic-card="${win.groupIndex}-${win.topicIndex}"]`;
    renderChapters();
    closeWindow(win,true);
    if(![...openWindows.values()].some(item=>!item.minimized)){
      requestAnimationFrame(()=>document.querySelector(cardSelector)?.scrollIntoView({behavior:'smooth',block:'center'}));
    }
  };

  client.auth.getSession().then(({data})=>setCanEdit(data?.session||null));
  client.auth.onAuthStateChange((_event,session)=>setCanEdit(session));
  loadRemoteContent();
})();