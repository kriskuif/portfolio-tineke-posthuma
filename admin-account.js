(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  function injectCard(overlay){
    if(!overlay || overlay.querySelector('[data-create-editor-card]')) return;
    const grid = overlay.querySelector('.settings-grid');
    if(!grid) return;

    const card = document.createElement('article');
    card.className = 'settings-card';
    card.setAttribute('data-create-editor-card','');
    card.innerHTML = `
      <h4>Beheeraccount aanmaken</h4>
      <p>Maak een account aan voor een e-mailadres dat vooraf als beheerder is toegestaan. Het account wordt direct bevestigd; er is daarna geen bevestigingsmail nodig.</p>
      <div class="settings-form">
        <label>E-mailadres<input type="email" autocomplete="email" data-editor-email placeholder="naam@voorbeeld.nl"></label>
        <label>Wachtwoord<input type="password" autocomplete="new-password" data-editor-password></label>
        <label>Herhaal wachtwoord<input type="password" autocomplete="new-password" data-editor-password-confirm></label>
      </div>
      <div class="settings-actions" style="margin-top:12px"><button class="settings-btn" type="button" data-create-editor>Account aanmaken</button></div>
      <p class="settings-message" data-create-editor-message></p>
    `;
    grid.appendChild(card);

    const message = card.querySelector('[data-create-editor-message]');
    card.querySelector('[data-create-editor]')?.addEventListener('click', async()=>{
      const email = card.querySelector('[data-editor-email]')?.value.trim().toLowerCase() || '';
      const password = card.querySelector('[data-editor-password]')?.value || '';
      const confirm = card.querySelector('[data-editor-password-confirm]')?.value || '';

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

      card.querySelector('[data-editor-password]').value='';
      card.querySelector('[data-editor-password-confirm]').value='';
      message.textContent='Account is aangemaakt en direct bevestigd. Er kan nu met dit e-mailadres en wachtwoord worden ingelogd.';
    });
  }

  function scan(){
    document.querySelectorAll('.settings-overlay').forEach(injectCard);
  }

  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.body,{childList:true,subtree:true});
})();