(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const SITE_URL = 'https://kriskuif.github.io/portfolio-tineke-posthuma/';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const style = document.createElement('style');
  style.textContent = `
    body:not(.can-edit) .topic-edit-btn,
    body:not(.can-edit) .top-actions { display:none !important; }
    .manage-btn{margin-left:auto;border:1px solid #dce7df;background:#fff;color:#1f5e4a;padding:8px 12px;border-radius:11px;font-weight:800;cursor:pointer}
    body.can-edit .manage-btn{margin-left:0}
    .auth-overlay{position:fixed;inset:0;z-index:3000;background:rgba(20,38,31,.36);display:grid;place-items:center;padding:20px}
    .auth-card{width:min(440px,100%);background:#fff;border-radius:20px;box-shadow:0 26px 80px rgba(20,43,34,.28);padding:22px;border:1px solid #dfe5df}
    .auth-card h3{margin:0 0 5px;font-family:Georgia,serif;color:#234f42}
    .auth-card p{margin:0 0 16px;color:#66746e;font-size:.88rem}
    .auth-fields{display:grid;gap:10px}.auth-fields input{width:100%;padding:11px 12px;border:1px solid #ced9d2;border-radius:11px;font:inherit}
    .auth-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.auth-actions button{border:0;border-radius:11px;padding:9px 12px;font-weight:800;cursor:pointer;background:#1f5e4a;color:#fff}.auth-actions button.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .auth-link{border:0;background:transparent;color:#1f5e4a;padding:0;font:inherit;font-weight:800;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
    .auth-switch{margin-top:16px!important;margin-bottom:0!important}
    .auth-close{float:right;border:0;background:transparent;font-size:1.3rem;cursor:pointer;color:#66746e}.auth-message{margin-top:12px!important;font-size:.8rem!important;white-space:pre-line}
  `;
  document.head.appendChild(style);

  const topbar = document.querySelector('.topbar');
  const manageBtn = document.createElement('button');
  manageBtn.className = 'manage-btn';
  manageBtn.type = 'button';
  manageBtn.textContent = 'Beheer';
  const topbarStatus = topbar?.querySelector('.status');
  if (topbarStatus) topbarStatus.insertAdjacentElement('afterend', manageBtn);
  else topbar?.appendChild(manageBtn);

  let currentSession = null;
  let canEdit = false;

  async function userIsEditor(session){
    if(!session?.user?.email) return false;
    try{
      const { data, error } = await client
        .from('portfolio_editors')
        .select('email')
        .eq('email', session.user.email.toLowerCase())
        .maybeSingle();
      if(error) throw error;
      return !!data;
    }catch(err){
      console.error('Beheerdercontrole mislukt:', err);
      return false;
    }
  }

  async function setCanEdit(session){
    currentSession = session || null;
    canEdit = currentSession ? await userIsEditor(currentSession) : false;
    document.body.classList.toggle('can-edit', canEdit);
    if(currentSession && canEdit) manageBtn.textContent = 'Beheer · ingelogd';
    else if(currentSession) manageBtn.textContent = 'Beheer · geen toegang';
    else manageBtn.textContent = 'Beheer';
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
    }catch(err){
      console.error('Portfolio laden mislukt:', err);
      setStatus('Online inhoud kon niet worden geladen','error');
    }
  }

  function openAuth(mode='login'){
    const existing = document.querySelector('.auth-overlay');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    document.body.appendChild(overlay);

    const closeOverlay = () => overlay.remove();

    function renderAuthView(nextMode=mode){
      mode = nextMode;

      if(currentSession){
        const signedInText = canEdit
          ? 'Je bent ingelogd en kunt de portfolio-onderdelen aanpassen.'
          : 'Je bent ingelogd, maar dit account staat niet op de beheerderslijst.';
        overlay.innerHTML = `<div class="auth-card">
          <button class="auth-close" type="button" aria-label="Sluiten">×</button>
          <h3>Portfolio beheren</h3>
          <p>${signedInText}</p>
          <div class="auth-actions"><button type="button" data-auth-logout>Uitloggen</button></div>
        </div>`;
        overlay.querySelector('.auth-close')?.addEventListener('click',closeOverlay);
        overlay.querySelector('[data-auth-logout]')?.addEventListener('click', async()=>{
          await client.auth.signOut();
          await setCanEdit(null);
          closeOverlay();
        });
        return;
      }

      if(mode === 'register'){
        overlay.innerHTML = `<div class="auth-card">
          <button class="auth-close" type="button" aria-label="Sluiten">×</button>
          <h3>Account aanmaken</h3>
          <p>Alleen vooraf goedgekeurde e-mailadressen kunnen een beheeraccount aanmaken.</p>
          <div class="auth-fields">
            <input type="email" data-auth-email placeholder="E-mailadres" autocomplete="email">
            <input type="password" data-auth-password placeholder="Kies een wachtwoord" autocomplete="new-password">
            <input type="password" data-auth-password-confirm placeholder="Herhaal wachtwoord" autocomplete="new-password">
          </div>
          <div class="auth-actions">
            <button type="button" data-auth-signup>Account aanmaken</button>
            <button type="button" class="secondary" data-auth-resend>Bevestigingsmail opnieuw sturen</button>
          </div>
          <p class="auth-switch">Heb je al een account? <button type="button" class="auth-link" data-auth-show-login>Terug naar inloggen</button></p>
          <p class="auth-message" data-auth-message></p>
        </div>`;

        const message = overlay.querySelector('[data-auth-message]');
        const getCredentials = () => ({
          email: overlay.querySelector('[data-auth-email]')?.value.trim() || '',
          password: overlay.querySelector('[data-auth-password]')?.value || '',
          passwordConfirm: overlay.querySelector('[data-auth-password-confirm]')?.value || ''
        });

        overlay.querySelector('.auth-close')?.addEventListener('click',closeOverlay);
        overlay.querySelector('[data-auth-show-login]')?.addEventListener('click',()=>renderAuthView('login'));
        overlay.querySelector('[data-auth-signup]')?.addEventListener('click', async()=>{
          const {email,password,passwordConfirm}=getCredentials();
          if(!email||password.length<8){
            message.textContent='Gebruik een geldig e-mailadres en een wachtwoord van minimaal 8 tekens.';
            return;
          }
          if(!passwordConfirm){
            message.textContent='Vul het wachtwoord nogmaals in ter controle.';
            overlay.querySelector('[data-auth-password-confirm]')?.focus();
            return;
          }
          if(password!==passwordConfirm){
            message.textContent='De twee wachtwoorden komen niet overeen. Controleer ze en probeer opnieuw.';
            overlay.querySelector('[data-auth-password-confirm]')?.focus();
            return;
          }
          message.textContent='Account aanmaken…';
          const { error } = await client.auth.signUp({
            email,
            password,
            options:{ emailRedirectTo: SITE_URL }
          });
          if(error){ message.textContent='Account maken mislukt: '+error.message; return; }
          message.textContent='Account aangemaakt. Controleer je e-mail en gebruik de nieuwste bevestigingslink.';
        });
        overlay.querySelector('[data-auth-resend]')?.addEventListener('click', async()=>{
          const {email}=getCredentials();
          if(!email){ message.textContent='Vul eerst je e-mailadres in.'; return; }
          message.textContent='Nieuwe bevestigingsmail versturen…';
          const { error } = await client.auth.resend({
            type:'signup',
            email,
            options:{ emailRedirectTo: SITE_URL }
          });
          if(error){ message.textContent='Opnieuw versturen mislukt: '+error.message; return; }
          message.textContent='Nieuwe bevestigingsmail verstuurd. Gebruik alleen de nieuwste link.';
        });
        return;
      }

      overlay.innerHTML = `<div class="auth-card">
        <button class="auth-close" type="button" aria-label="Sluiten">×</button>
        <h3>Inloggen</h3>
        <p>Log in om portfolio-onderdelen te kunnen invullen en op de openbare website op te slaan.</p>
        <div class="auth-fields">
          <input type="email" data-auth-email placeholder="E-mailadres" autocomplete="email">
          <input type="password" data-auth-password placeholder="Wachtwoord" autocomplete="current-password">
        </div>
        <div class="auth-actions"><button type="button" data-auth-login>Inloggen</button></div>
        <p class="auth-switch">Nog geen account? <button type="button" class="auth-link" data-auth-show-register>Account aanmaken</button></p>
        <p class="auth-message" data-auth-message></p>
      </div>`;

      const message = overlay.querySelector('[data-auth-message]');
      overlay.querySelector('.auth-close')?.addEventListener('click',closeOverlay);
      overlay.querySelector('[data-auth-show-register]')?.addEventListener('click',()=>renderAuthView('register'));
      overlay.querySelector('[data-auth-login]')?.addEventListener('click', async()=>{
        const email=overlay.querySelector('[data-auth-email]')?.value.trim() || '';
        const password=overlay.querySelector('[data-auth-password]')?.value || '';
        if(!email||!password){ message.textContent='Vul e-mailadres en wachtwoord in.'; return; }
        message.textContent='Inloggen…';
        const { data, error } = await client.auth.signInWithPassword({email,password});
        if(error){
          if(error.message?.toLowerCase().includes('email not confirmed')){
            message.textContent='Je e-mailadres is nog niet bevestigd. Ga naar “Account aanmaken” om een nieuwe bevestigingsmail te versturen.';
          }else{
            message.textContent='Inloggen mislukt: '+error.message;
          }
          return;
        }
        await setCanEdit(data.session);
        if(!canEdit){
          message.textContent='Dit account is ingelogd, maar heeft geen beheerrechten voor dit portfolio.';
          return;
        }
        message.textContent='Ingelogd.';
        setTimeout(closeOverlay,500);
      });
    }

    overlay.addEventListener('click',e=>{ if(e.target===overlay) closeOverlay(); });
    renderAuthView(mode);
  }

  manageBtn.addEventListener('click',()=>openAuth('login'));

  saveWindow = async function(win){
    if(!win || !openWindows.has(win.key)) return;
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData?.session;
    if(!session){
      setStatus('Log eerst in om wijzigingen op de website op te slaan','error');
      openAuth('login');
      return;
    }
    if(!(await userIsEditor(session))){
      setStatus('Dit account heeft geen beheerrechten','error');
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