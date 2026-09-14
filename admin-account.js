(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const style = document.createElement('style');
  style.textContent = `
    .owner-management{grid-column:1/-1;border:1px solid #c9d9cf;background:linear-gradient(180deg,#f7fbf8,#f1f7f3);padding:18px;border-radius:17px}
    .owner-management-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding-bottom:13px;margin-bottom:14px;border-bottom:1px solid #dbe6df}
    .owner-management-head h4{margin:0 0 4px;color:#234f42;font-size:1.02rem}
    .owner-management-head p{margin:0;color:#66746e;font-size:.82rem}
    .owner-badge{white-space:nowrap;border-radius:999px;padding:5px 9px;background:#dcece3;color:#255744;font-size:.7rem;font-weight:900;letter-spacing:.03em;text-transform:uppercase}
    .owner-management .settings-card{background:#fff}
  `;
  document.head.appendChild(style);

  async function isOwner(){
    try{
      const { data: sessionData } = await client.auth.getSession();
      const email = sessionData?.session?.user?.email?.trim().toLowerCase();
      if(!email) return false;
      const { data, error } = await client
        .from('portfolio_editors')
        .select('role')
        .eq('email', email)
        .maybeSingle();
      if(error) throw error;
      return data?.role === 'owner';
    }catch(err){
      console.error('Eigenaarsrol controleren mislukt:', err);
      return false;
    }
  }

  async function injectOwnerSection(overlay){
    if(!overlay || overlay.querySelector('[data-owner-management]')) return;
    const grid = overlay.querySelector('.settings-grid');
    if(!grid) return;
    if(!(await isOwner())) return;
    if(!document.body.contains(overlay) || overlay.querySelector('[data-owner-management]')) return;

    const section = document.createElement('section');
    section.className = 'owner-management';
    section.setAttribute('data-owner-management','');
    section.innerHTML = `
      <div class="owner-management-head">
        <div><h4>Eigenaar & gebruikersbeheer</h4><p>Alleen zichtbaar voor het eigenaar-account. Hier kun je toegestane beheeraccounts aanmaken.</p></div>
        <span class="owner-badge">Alleen eigenaar</span>
      </div>
      <article class="settings-card" data-create-editor-card>
        <h4>Beheeraccount aanmaken</h4>
        <p>Maak een account aan voor een e-mailadres dat vooraf als beheerder is toegestaan. Het account wordt direct bevestigd; er is daarna geen bevestigingsmail nodig.</p>
        <div class="settings-form">
          <label>E-mailadres<input type="email" autocomplete="email" data-editor-email placeholder="naam@voorbeeld.nl"></label>
          <label>Wachtwoord<input type="password" autocomplete="new-password" data-editor-password></label>
          <label>Herhaal wachtwoord<input type="password" autocomplete="new-password" data-editor-password-confirm></label>
        </div>
        <div class="settings-actions" style="margin-top:12px"><button class="settings-btn" type="button" data-create-editor>Account aanmaken</button></div>
        <p class="settings-message" data-create-editor-message></p>
      </article>
    `;
    grid.appendChild(section);

    const message = section.querySelector('[data-create-editor-message]');
    section.querySelector('[data-create-editor]')?.addEventListener('click', async()=>{
      const email = section.querySelector('[data-editor-email]')?.value.trim().toLowerCase() || '';
      const password = section.querySelector('[data-editor-password]')?.value || '';
      const confirm = section.querySelector('[data-editor-password-confirm]')?.value || '';

      if(!email){ message.textContent='Vul een e-mailadres in.'; return; }
      if(password.length < 8){ message.textContent='Het wachtwoord moet minimaal 8 tekens bevatten.'; return; }
      if(password !== confirm){ message.textContent='De twee wachtwoorden komen niet overeen.'; return; }

      message.textContent='Account aanmaken…';
      const { data, error } = await client.functions.invoke('create-portfolio-editor-account', {
        body: { email, password }
      });

      if(error){
        let detail = error.message || 'Onbekende fout';
        try{
          const context = error.context;
          if(context?.json){
            const body = await context.json();
            if(body?.error) detail = body.error;
          }
        }catch(_err){}
        message.textContent='Account aanmaken mislukt: ' + detail;
        return;
      }
      if(data?.error){ message.textContent='Account aanmaken mislukt: ' + data.error; return; }

      section.querySelector('[data-editor-password]').value='';
      section.querySelector('[data-editor-password-confirm]').value='';
      message.textContent='Account is aangemaakt en direct bevestigd. Er kan nu met dit e-mailadres en wachtwoord worden ingelogd.';
    });
  }

  function scan(){
    document.querySelectorAll('.settings-overlay').forEach(overlay=>injectOwnerSection(overlay));
  }

  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.body,{childList:true,subtree:true});
})();