(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const style=document.createElement('style');
  style.textContent=`
    .admin-name-card{position:relative}
    .admin-name-card .admin-name-field{display:grid;gap:6px;margin-top:12px}
    .admin-name-card .admin-name-field label{font-size:.8rem;font-weight:850;color:#31473d}
    .admin-name-card .admin-name-input{width:100%;padding:10px 11px;border:1px solid #cddbd2;border-radius:10px;background:#fff;color:#2f4038;font:inherit;font-size:.82rem}
    .admin-name-card .admin-name-input:focus{outline:2px solid rgba(31,94,74,.14);border-color:#86aa98}
    .admin-name-card .admin-name-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:11px}
    .admin-name-card .admin-name-save{border:0;border-radius:10px;background:#1f5e4a;color:#fff;padding:9px 12px;font:inherit;font-size:.78rem;font-weight:850;cursor:pointer}
    .admin-name-card .admin-name-save:disabled{opacity:.55;cursor:not-allowed}
    .admin-name-card .admin-name-message{margin:0;min-height:1.2em;color:#62736b;font-size:.72rem}
  `;
  document.head.appendChild(style);

  async function getSession(){
    const {data}=await client.auth.getSession();
    return data?.session||null;
  }

  async function loadName(card){
    const session=await getSession();
    if(!session) return;
    const input=card.querySelector('[data-admin-name-input]');
    const message=card.querySelector('[data-admin-name-message]');
    if(!input) return;
    if(message) message.textContent='Naam laden…';
    const {data,error}=await client.from('portfolio_editors')
      .select('display_name')
      .eq('email',session.user.email)
      .maybeSingle();
    if(error){
      if(message) message.textContent='Naam laden is mislukt.';
      console.error(error);
      return;
    }
    input.value=String(data?.display_name||'').trim();
    if(message) message.textContent='Deze naam wordt bij jouw vragen en opmerkingen getoond.';
  }

  async function saveName(card){
    const session=await getSession();
    if(!session) return;
    const input=card.querySelector('[data-admin-name-input]');
    const button=card.querySelector('[data-admin-name-save]');
    const message=card.querySelector('[data-admin-name-message]');
    const name=String(input?.value||'').trim();
    if(!name){ if(message) message.textContent='Vul een naam in.'; input?.focus(); return; }
    if(name.length>40){ if(message) message.textContent='Gebruik maximaal 40 tekens.'; input?.focus(); return; }

    if(button) button.disabled=true;
    if(message) message.textContent='Opslaan…';

    const {error}=await client.from('portfolio_editors')
      .update({display_name:name})
      .eq('email',session.user.email);
    if(error){
      if(button) button.disabled=false;
      if(message) message.textContent='Naam opslaan is mislukt.';
      console.error(error);
      return;
    }

    const {error:messageError}=await client.from('portfolio_admin_messages')
      .update({author_name:name})
      .eq('created_by',session.user.id);

    if(button) button.disabled=false;
    if(message) message.textContent=messageError
      ? 'Naam opgeslagen. Nieuwe berichten gebruiken deze naam.'
      : 'Naam opgeslagen. Bestaande en nieuwe berichten zijn bijgewerkt.';
    if(messageError) console.error('Bestaande beheerberichten bijwerken mislukt:',messageError);
    window.dispatchEvent(new CustomEvent('portfolio-admin-display-name-changed',{detail:{name}}));
  }

  function enhanceSettings(root=document){
    root.querySelectorAll('.settings-overlay').forEach(overlay=>{
      const grid=overlay.querySelector('.settings-grid');
      if(!grid || grid.querySelector('[data-admin-name-card]')) return;
      const card=document.createElement('article');
      card.className='settings-card admin-name-card';
      card.dataset.adminNameCard='1';
      card.innerHTML=`
        <h3>Beheerdernotities</h3>
        <p>Stel in onder welke naam jouw vragen en opmerkingen in de beheerchat verschijnen.</p>
        <div class="admin-name-field">
          <label for="admin-note-display-name">Naam voor beheerdernotities</label>
          <input id="admin-note-display-name" class="admin-name-input" data-admin-name-input type="text" maxlength="40" autocomplete="name" placeholder="Bijvoorbeeld Kris">
        </div>
        <div class="admin-name-actions">
          <button class="admin-name-save" data-admin-name-save type="button">Naam opslaan</button>
          <p class="admin-name-message" data-admin-name-message aria-live="polite"></p>
        </div>`;
      grid.appendChild(card);
      card.querySelector('[data-admin-name-save]')?.addEventListener('click',()=>saveName(card));
      card.querySelector('[data-admin-name-input]')?.addEventListener('keydown',event=>{
        if(event.key==='Enter'){
          event.preventDefault();
          saveName(card);
        }
      });
      loadName(card);
    });
  }

  enhanceSettings();
  new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1) enhanceSettings(node.matches?.('.settings-overlay')?node:node);
    }));
  }).observe(document.body,{childList:true,subtree:true});
})();