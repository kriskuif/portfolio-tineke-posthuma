(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const style=document.createElement('style');
  style.textContent=`
    .admin-name-card{margin-top:14px;padding-top:14px;border-top:1px solid #dfe7e2}
    .admin-name-card h4{margin:0 0 5px;color:#294f40;font-size:.9rem}
    .admin-name-card>p{margin:0;color:#66746e;font-size:.76rem;line-height:1.45}
    .admin-name-card .admin-name-field{display:grid;gap:6px;margin-top:11px}
    .admin-name-card .admin-name-field label{font-size:.78rem;font-weight:850;color:#31473d}
    .admin-name-card .admin-name-input{width:100%;padding:9px 10px;border:1px solid #cddbd2;border-radius:10px;background:#fff;color:#2f4038;font:inherit;font-size:.82rem}
    .admin-name-card .admin-name-input:focus{outline:2px solid rgba(31,94,74,.14);border-color:#86aa98}
    .admin-name-card .admin-name-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:9px}
    .admin-name-card .admin-name-save{border:0;border-radius:9px;background:#1f5e4a;color:#fff;padding:8px 11px;font:inherit;font-size:.76rem;font-weight:850;cursor:pointer}
    .admin-name-card .admin-name-save:disabled{opacity:.55;cursor:not-allowed}
    .admin-name-card .admin-name-message{margin:0;min-height:1.2em;color:#62736b;font-size:.7rem}
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
      console.error('Naam voor beheerdernotities laden mislukt:',error);
      return;
    }
    input.value=String(data?.display_name||'').trim();
    if(message) message.textContent='Deze naam staat bij jouw vragen en opmerkingen.';
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
    if(button) button.disabled=false;
    if(error){
      if(message) message.textContent='Naam opslaan is mislukt.';
      console.error('Naam voor beheerdernotities opslaan mislukt:',error);
      return;
    }

    if(message) message.textContent='Naam opgeslagen. Bestaande en nieuwe berichten zijn bijgewerkt.';
    window.dispatchEvent(new CustomEvent('portfolio-admin-display-name-changed',{detail:{name}}));
  }

  function accountCard(grid){
    return [...grid.querySelectorAll(':scope > .settings-card')].find(card=>
      String(card.querySelector('h3')?.textContent||'').trim().toLowerCase()==='account'
    ) || grid.querySelector('.settings-card');
  }

  function enhanceSettings(root=document){
    const overlays=[];
    if(root.matches?.('.settings-overlay')) overlays.push(root);
    root.querySelectorAll?.('.settings-overlay').forEach(overlay=>overlays.push(overlay));
    overlays.forEach(overlay=>{
      const grid=overlay.querySelector('.settings-grid');
      if(!grid || overlay.querySelector('[data-admin-name-card]')) return;
      const host=accountCard(grid);
      if(!host) return;
      const card=document.createElement('div');
      card.className='admin-name-card';
      card.dataset.adminNameCard='1';
      const inputId=`admin-note-display-name-${Math.random().toString(36).slice(2,8)}`;
      card.innerHTML=`
        <h4>Naam voor beheerdernotities</h4>
        <p>Deze naam wordt gebruikt bij berichten in de beheerchat.</p>
        <div class="admin-name-field">
          <label for="${inputId}">Weergavenaam</label>
          <input id="${inputId}" class="admin-name-input" data-admin-name-input type="text" maxlength="40" autocomplete="name" placeholder="Bijvoorbeeld Kris">
        </div>
        <div class="admin-name-actions">
          <button class="admin-name-save" data-admin-name-save type="button">Naam opslaan</button>
          <p class="admin-name-message" data-admin-name-message aria-live="polite"></p>
        </div>`;
      host.appendChild(card);
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
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===1) enhanceSettings(node);
      }
    }
  }).observe(document.body,{childList:true,subtree:true});
})();