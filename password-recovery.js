(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const SITE_URL = 'https://kriskuif.github.io/portfolio-tineke-posthuma/';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const style = document.createElement('style');
  style.textContent = `
    .password-recovery-overlay{position:fixed;inset:0;z-index:3400;background:rgba(20,38,31,.40);display:grid;place-items:center;padding:20px}
    .password-recovery-card{width:min(440px,100%);background:#fff;border-radius:20px;box-shadow:0 26px 80px rgba(20,43,34,.30);padding:22px;border:1px solid #dfe5df}
    .password-recovery-card h3{margin:0 0 5px;font-family:Georgia,serif;color:#234f42}
    .password-recovery-card>p{margin:0 0 16px;color:#66746e;font-size:.88rem}
    .password-recovery-close{float:right;border:0;background:transparent;font-size:1.3rem;cursor:pointer;color:#66746e}
    .password-recovery-fields{display:grid;gap:10px}
    .password-recovery-fields input{width:100%;padding:11px 12px;border:1px solid #ced9d2;border-radius:11px;font:inherit;background:#fff}
    .password-recovery-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
    .password-recovery-actions button{border:0;border-radius:11px;padding:9px 12px;font:inherit;font-weight:800;cursor:pointer;background:#1f5e4a;color:#fff}
    .password-recovery-actions button.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .password-recovery-actions button:disabled{opacity:.6;cursor:wait}
    .password-recovery-message{margin-top:12px!important;margin-bottom:0!important;font-size:.8rem!important;color:#526158!important;white-space:pre-line}
    .password-forgot-row{margin-top:10px!important;margin-bottom:0!important}
    .password-forgot-link{border:0;background:transparent;color:#1f5e4a;padding:0;font:inherit;font-weight:800;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
  `;
  document.head.appendChild(style);

  const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function removeRecoveryOverlay(){
    document.querySelector('.password-recovery-overlay')?.remove();
  }

  async function sendRecoveryEmail(email, messageEl, button){
    const cleanEmail = String(email || '').trim();
    if(!cleanEmail){
      if(messageEl) messageEl.textContent = 'Vul eerst je e-mailadres in.';
      return false;
    }

    const originalLabel = button?.textContent || '';
    if(button){
      button.disabled = true;
      button.textContent = 'Herstelmail versturen…';
    }
    if(messageEl) messageEl.textContent = 'Herstelmail versturen…';

    const { error } = await client.auth.resetPasswordForEmail(cleanEmail, { redirectTo: SITE_URL });

    if(button){
      button.disabled = false;
      button.textContent = error ? originalLabel : 'Nieuwe herstelmail sturen';
    }

    if(error){
      if(messageEl) messageEl.textContent = 'Herstelmail versturen mislukt: ' + error.message;
      return false;
    }

    if(messageEl){
      messageEl.textContent = 'Als dit e-mailadres bij een account hoort, is er een herstelmail verstuurd. Open de nieuwste link in die mail om een nieuw wachtwoord te kiezen.';
    }
    return true;
  }

  function openForgotPassword(prefillEmail=''){
    document.querySelector('.auth-overlay')?.remove();
    removeRecoveryOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'password-recovery-overlay';
    overlay.innerHTML = `<div class="password-recovery-card" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
      <button class="password-recovery-close" type="button" aria-label="Sluiten">×</button>
      <h3 id="forgot-password-title">Wachtwoord vergeten?</h3>
      <p>Vul je e-mailadres in. Je krijgt een beveiligde herstelmail waarmee je een nieuw wachtwoord kunt kiezen.</p>
      <div class="password-recovery-fields">
        <input type="email" data-recovery-email autocomplete="email" placeholder="E-mailadres" value="${escapeHtml(prefillEmail)}">
      </div>
      <div class="password-recovery-actions">
        <button type="button" data-send-recovery>Herstelmail sturen</button>
        <button type="button" class="secondary" data-back-login>Terug naar inloggen</button>
      </div>
      <p class="password-recovery-message" data-recovery-message></p>
    </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    const message = overlay.querySelector('[data-recovery-message]');
    const emailInput = overlay.querySelector('[data-recovery-email]');
    const sendButton = overlay.querySelector('[data-send-recovery]');

    overlay.querySelector('.password-recovery-close')?.addEventListener('click', close);
    overlay.addEventListener('click', event => { if(event.target === overlay) close(); });
    overlay.querySelector('[data-back-login]')?.addEventListener('click', () => {
      close();
      document.querySelector('.manage-btn')?.click();
    });
    sendButton?.addEventListener('click', () => sendRecoveryEmail(emailInput?.value || '', message, sendButton));
    emailInput?.addEventListener('keydown', event => {
      if(event.key === 'Enter'){
        event.preventDefault();
        sendButton?.click();
      }
    });
    setTimeout(() => emailInput?.focus(), 0);
  }

  function openNewPassword(){
    document.querySelector('.auth-overlay')?.remove();
    removeRecoveryOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'password-recovery-overlay';
    overlay.innerHTML = `<div class="password-recovery-card" role="dialog" aria-modal="true" aria-labelledby="new-password-title">
      <button class="password-recovery-close" type="button" aria-label="Sluiten">×</button>
      <h3 id="new-password-title">Nieuw wachtwoord instellen</h3>
      <p>Kies een nieuw wachtwoord van minimaal 8 tekens en voer het tweemaal in.</p>
      <div class="password-recovery-fields">
        <input type="password" data-recovery-password autocomplete="new-password" placeholder="Nieuw wachtwoord">
        <input type="password" data-recovery-password-confirm autocomplete="new-password" placeholder="Herhaal nieuw wachtwoord">
      </div>
      <div class="password-recovery-actions">
        <button type="button" data-save-recovery-password>Nieuw wachtwoord opslaan</button>
      </div>
      <p class="password-recovery-message" data-recovery-message></p>
    </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    const message = overlay.querySelector('[data-recovery-message]');
    const password = overlay.querySelector('[data-recovery-password]');
    const confirm = overlay.querySelector('[data-recovery-password-confirm]');
    const saveButton = overlay.querySelector('[data-save-recovery-password]');

    overlay.querySelector('.password-recovery-close')?.addEventListener('click', close);
    saveButton?.addEventListener('click', async () => {
      const next = password?.value || '';
      const repeated = confirm?.value || '';
      if(next.length < 8){
        message.textContent = 'Het nieuwe wachtwoord moet minimaal 8 tekens bevatten.';
        password?.focus();
        return;
      }
      if(next !== repeated){
        message.textContent = 'De twee wachtwoorden komen niet overeen.';
        confirm?.focus();
        return;
      }

      saveButton.disabled = true;
      saveButton.textContent = 'Wachtwoord opslaan…';
      message.textContent = 'Nieuw wachtwoord opslaan…';
      const { error } = await client.auth.updateUser({ password: next });
      saveButton.disabled = false;
      saveButton.textContent = 'Nieuw wachtwoord opslaan';

      if(error){
        message.textContent = 'Wachtwoord wijzigen mislukt: ' + error.message;
        return;
      }

      message.textContent = 'Je wachtwoord is gewijzigd. Je kunt voortaan met het nieuwe wachtwoord inloggen.';
      try{ history.replaceState({}, document.title, SITE_URL); }catch(_err){}
      setTimeout(close, 1400);
    });
    confirm?.addEventListener('keydown', event => {
      if(event.key === 'Enter'){
        event.preventDefault();
        saveButton?.click();
      }
    });
    setTimeout(() => password?.focus(), 0);
  }

  function enhanceLoginCard(root=document){
    root.querySelectorAll?.('.auth-card').forEach(card => {
      const loginButton = card.querySelector('[data-auth-login]');
      if(!loginButton || card.querySelector('[data-password-forgot]')) return;

      const emailInput = card.querySelector('[data-auth-email]');
      const row = document.createElement('p');
      row.className = 'auth-switch password-forgot-row';
      row.innerHTML = '<button type="button" class="auth-link password-forgot-link" data-password-forgot>Wachtwoord vergeten?</button>';

      const switchRow = card.querySelector('.auth-switch');
      if(switchRow) card.insertBefore(row, switchRow);
      else card.appendChild(row);

      row.querySelector('[data-password-forgot]')?.addEventListener('click', () => {
        openForgotPassword(emailInput?.value || '');
      });
    });
  }

  function enhanceSettings(root=document){
    root.querySelectorAll?.('.settings-card').forEach(card => {
      const heading = card.querySelector('h4');
      if(heading?.textContent?.trim() !== 'Wachtwoord wijzigen' || card.querySelector('[data-settings-forgot]')) return;
      const actions = card.querySelector('.settings-actions');
      const message = card.querySelector('[data-password-message]');
      if(!actions) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'settings-btn secondary';
      button.dataset.settingsForgot = '';
      button.textContent = 'Wachtwoord vergeten?';
      actions.appendChild(button);

      button.addEventListener('click', async () => {
        const { data } = await client.auth.getSession();
        const email = data?.session?.user?.email || '';
        if(!email){
          if(message) message.textContent = 'Er is geen ingelogd e-mailadres gevonden.';
          return;
        }
        await sendRecoveryEmail(email, message, button);
      });
    });
  }

  const observer = new MutationObserver(records => {
    for(const record of records){
      for(const node of record.addedNodes){
        if(!(node instanceof Element)) continue;
        enhanceLoginCard(node.matches('.auth-card') ? node.parentElement || node : node);
        enhanceSettings(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
  enhanceLoginCard();
  enhanceSettings();

  let recoveryOpened = false;
  const showRecoveryOnce = () => {
    if(recoveryOpened) return;
    recoveryOpened = true;
    setTimeout(openNewPassword, 0);
  };

  client.auth.onAuthStateChange((event) => {
    if(event === 'PASSWORD_RECOVERY') showRecoveryOnce();
  });

  const hashParams = new URLSearchParams(location.hash.replace(/^#/,''));
  const queryParams = new URLSearchParams(location.search);
  if(hashParams.get('type') === 'recovery' || queryParams.get('type') === 'recovery'){
    client.auth.getSession().then(({data}) => {
      if(data?.session) showRecoveryOnce();
    });
  }

  window.portfolioPasswordRecovery = {
    openForgotPassword,
    openNewPassword
  };
})();