(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const style=document.createElement('style');
  style.textContent=`
    .owner-management{grid-column:1/-1;border:1px solid #c9d9cf;background:linear-gradient(180deg,#f7fbf8,#f1f7f3);padding:18px;border-radius:17px}
    .owner-management-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding-bottom:13px;margin-bottom:14px;border-bottom:1px solid #dbe6df}
    .owner-management-head h4{margin:0 0 4px;color:#234f42;font-size:1.02rem}.owner-management-head p{margin:0;color:#66746e;font-size:.82rem}
    .owner-badge{white-space:nowrap;border-radius:999px;padding:5px 9px;background:#dcece3;color:#255744;font-size:.7rem;font-weight:900;letter-spacing:.03em;text-transform:uppercase}
    .owner-management .settings-card{background:#fff}.owner-user-list{display:grid;gap:10px;margin-top:12px}
    .owner-user-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start;padding:12px;border:1px solid #dbe5df;border-radius:13px;background:#fbfdfb}
    .owner-user-row.is-disabled{background:#f4f6f4;border-color:#dde1de}.owner-user-main{min-width:0}
    .owner-user-name{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-weight:900;color:#294f41}.owner-user-row.is-disabled .owner-user-name{color:#69736e}
    .owner-user-email{margin-top:2px;color:#748079;font-size:.72rem;overflow-wrap:anywhere}
    .owner-role{display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;background:#e7efe9;color:#3e6656;font-size:.62rem;font-weight:900;text-transform:uppercase;letter-spacing:.03em}.owner-role.owner{background:#dbe9df;color:#214f3e}
    .owner-user-controls{display:grid;gap:8px;min-width:205px}.owner-switch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.71rem;font-weight:800;color:#52655b}.owner-switch-row.is-disabled{opacity:.5}
    .owner-switch{position:relative;display:inline-flex;align-items:center;flex:0 0 auto;width:42px;height:24px;cursor:pointer}.owner-switch input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
    .owner-switch-track{position:absolute;inset:0;border-radius:999px;background:#b8c1bc;box-shadow:inset 0 0 0 1px rgba(37,74,59,.12);transition:background .18s ease,box-shadow .18s ease}
    .owner-switch-thumb{position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(29,52,43,.28);transition:transform .18s ease}
    .owner-switch input:checked~.owner-switch-track{background:#2e7258;box-shadow:inset 0 0 0 1px rgba(24,81,59,.22)}.owner-switch input:checked~.owner-switch-thumb{transform:translateX(18px)}
    .owner-switch input:focus-visible~.owner-switch-track{outline:3px solid rgba(46,114,88,.2);outline-offset:2px}.owner-switch.is-disabled{cursor:not-allowed;opacity:.45}
    .owner-user-status{font-size:.65rem;color:#78857e;font-weight:750;text-align:right}.owner-user-status.on{color:#2f6e56}.owner-user-status.off{color:#8a6762}
    .owner-user-actions{display:flex;justify-content:flex-end;margin-top:2px}.owner-user-remove{border:1px solid #d8a9a5;background:#fff7f6;color:#9b3e38;border-radius:9px;padding:7px 9px;font:inherit;font-size:.69rem;font-weight:850;cursor:pointer}.owner-user-remove:hover,.owner-user-remove:focus-visible{background:#fbe9e7;outline:none}
    .owner-user-protected{font-size:.66rem;color:#75827b;font-weight:800;text-align:right}.owner-delete-box{grid-column:1/-1;margin-top:2px;padding:11px;border:1px solid #e6c7c3;border-radius:10px;background:#fff9f8}.owner-delete-box p{margin:0 0 8px;color:#704b47;font-size:.75rem;line-height:1.4}
    .owner-delete-choice{display:flex;align-items:flex-start;gap:7px;margin:8px 0 10px;color:#5f514e;font-size:.72rem}.owner-delete-choice input{margin-top:2px}.owner-delete-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap}.owner-delete-actions button{border-radius:9px;padding:7px 10px;font:inherit;font-size:.69rem;font-weight:850;cursor:pointer}
    .owner-delete-cancel{border:1px solid #d4ddd7;background:#fff;color:#52635a}.owner-delete-confirm{border:1px solid #a9473f;background:#a9473f;color:#fff}.owner-list-message{margin:9px 0 0;color:#64726b;font-size:.72rem;min-height:1em}
    @media(max-width:720px){.owner-user-row{grid-template-columns:1fr}.owner-user-controls{min-width:0}.owner-user-status,.owner-user-protected{text-align:left}.owner-user-actions{justify-content:flex-start}}
  `;
  document.head.appendChild(style);

  async function isOwner(){
    try{
      const {data:sessionData}=await client.auth.getSession();
      const email=sessionData?.session?.user?.email?.trim().toLowerCase();
      if(!email) return false;
      const {data,error}=await client.from('portfolio_editors').select('role').eq('email',email).maybeSingle();
      if(error) throw error;
      return data?.role==='owner';
    }catch(err){console.error('Eigenaarsrol controleren mislukt:',err);return false;}
  }

  async function invokeManager(body){
    const {data,error}=await client.functions.invoke('manage-portfolio-editor-accounts',{body});
    if(error){
      let detail=error.message||'Onbekende fout';
      try{if(error.context?.json){const parsed=await error.context.json();if(parsed?.error) detail=parsed.error;}}catch(_err){}
      throw new Error(detail);
    }
    if(data?.error) throw new Error(data.error);
    return data;
  }

  function makeSwitch({checked=false,disabled=false,label,onChange}){
    const wrapper=document.createElement('label');
    wrapper.className=`owner-switch${disabled?' is-disabled':''}`;wrapper.title=label;
    const input=document.createElement('input');input.type='checkbox';input.checked=!!checked;input.disabled=!!disabled;input.setAttribute('aria-label',label);
    const track=document.createElement('span');track.className='owner-switch-track';
    const thumb=document.createElement('span');thumb.className='owner-switch-thumb';wrapper.append(input,track,thumb);
    if(!disabled&&typeof onChange==='function') input.addEventListener('change',async()=>{
      const wanted=input.checked;input.disabled=true;wrapper.classList.add('is-disabled');
      try{await onChange(wanted);}catch(err){input.checked=!wanted;throw err;}finally{input.disabled=false;wrapper.classList.remove('is-disabled');}
    });
    return wrapper;
  }

  function renderUsers(section,users){
    const list=section.querySelector('[data-editor-list]');
    const listMessage=section.querySelector('[data-editor-list-message]');
    if(!list) return;
    list.replaceChildren();

    (users||[]).forEach(user=>{
      const active=user.is_active!==false;
      const receipts=user.read_receipts_enabled!==false;
      const row=document.createElement('div');row.className=`owner-user-row${active?'':' is-disabled'}`;row.dataset.userEmail=user.email||'';
      const main=document.createElement('div');main.className='owner-user-main';
      const name=document.createElement('div');name.className='owner-user-name';
      const nameText=document.createElement('span');nameText.textContent=user.display_name||user.email||'Beheerder';
      const role=document.createElement('span');role.className=`owner-role ${user.role==='owner'?'owner':''}`;role.textContent=user.role==='owner'?'Eigenaar':'Beheerder';
      name.append(nameText,role);
      const email=document.createElement('div');email.className='owner-user-email';email.textContent=user.email||'';main.append(name,email);row.appendChild(main);

      const controls=document.createElement('div');controls.className='owner-user-controls';
      const activeRow=document.createElement('div');activeRow.className='owner-switch-row';
      const activeLabel=document.createElement('span');activeLabel.textContent='Account actief';
      activeRow.append(activeLabel,makeSwitch({
        checked:active,disabled:user.role==='owner',label:user.role==='owner'?'Eigenaar-account is altijd actief':`Account ${active?'uitschakelen':'inschakelen'}`,
        onChange:async value=>{
          try{
            await invokeManager({action:'set_active',email:user.email,value});
            if(listMessage) listMessage.textContent=value?`${user.display_name||user.email} is ingeschakeld.`:`${user.display_name||user.email} is uitgeschakeld. Berichten en leesbevestigingen zijn tijdelijk verborgen.`;
            await loadUsers(section);
          }catch(err){console.error('Accountstatus aanpassen mislukt:',err);if(listMessage) listMessage.textContent='Accountstatus aanpassen mislukt: '+(err?.message||'Onbekende fout');throw err;}
        }
      }));
      controls.appendChild(activeRow);

      const receiptRow=document.createElement('div');receiptRow.className=`owner-switch-row${active?'':' is-disabled'}`;
      const receiptLabel=document.createElement('span');receiptLabel.textContent='Leesbevestigingen';
      receiptRow.append(receiptLabel,makeSwitch({
        checked:receipts,disabled:!active,label:active?`Leesbevestigingen ${receipts?'uitschakelen':'inschakelen'}`:'Schakel het account eerst in',
        onChange:async value=>{
          try{
            await invokeManager({action:'set_read_receipts',email:user.email,value});
            if(listMessage) listMessage.textContent=value?`Leesbevestigingen voor ${user.display_name||user.email} staan aan.`:`Leesbevestigingen voor ${user.display_name||user.email} staan uit.`;
            await loadUsers(section);
          }catch(err){console.error('Leesbevestigingen aanpassen mislukt:',err);if(listMessage) listMessage.textContent='Leesbevestigingen aanpassen mislukt: '+(err?.message||'Onbekende fout');throw err;}
        }
      }));
      controls.appendChild(receiptRow);

      const status=document.createElement('div');status.className=`owner-user-status ${active?'on':'off'}`;status.textContent=active?(receipts?'Actief · leesbevestigingen aan':'Actief · leesbevestigingen uit'):'Uitgeschakeld';controls.appendChild(status);
      if(user.role==='owner'){
        const protectedText=document.createElement('div');protectedText.className='owner-user-protected';protectedText.textContent='Eigenaar-account beschermd';controls.appendChild(protectedText);
      }else{
        const actions=document.createElement('div');actions.className='owner-user-actions';
        const remove=document.createElement('button');remove.type='button';remove.className='owner-user-remove';remove.textContent='Verwijderen';remove.addEventListener('click',()=>showDeleteBox(row,user,section));actions.appendChild(remove);controls.appendChild(actions);
      }
      row.appendChild(controls);list.appendChild(row);
    });
    if(listMessage&&!listMessage.textContent) listMessage.textContent=users?.length?`${users.length} beheeraccounts`:'Geen beheeraccounts gevonden.';
  }

  function showDeleteBox(row,user,section){
    section.querySelectorAll('.owner-delete-box').forEach(box=>box.remove());
    const listMessage=section.querySelector('[data-editor-list-message]');
    const box=document.createElement('div');box.className='owner-delete-box';
    const text=document.createElement('p');text.textContent=`${user.display_name||user.email} definitief verwijderen? Het account en de beheerrechten worden verwijderd. Leesbevestigingen van deze gebruiker worden altijd opgeruimd.`;
    const choice=document.createElement('label');choice.className='owner-delete-choice';
    const checkbox=document.createElement('input');checkbox.type='checkbox';
    const choiceText=document.createElement('span');choiceText.textContent='Ook alle beheerdernotities van deze gebruiker verwijderen.';choice.append(checkbox,choiceText);
    const actions=document.createElement('div');actions.className='owner-delete-actions';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='owner-delete-cancel';cancel.textContent='Annuleren';
    const confirm=document.createElement('button');confirm.type='button';confirm.className='owner-delete-confirm';confirm.textContent='Definitief verwijderen';actions.append(cancel,confirm);
    const status=document.createElement('p');status.className='owner-list-message';box.append(text,choice,actions,status);row.appendChild(box);
    cancel.addEventListener('click',()=>box.remove());
    confirm.addEventListener('click',async()=>{
      confirm.disabled=true;cancel.disabled=true;status.textContent='Gebruiker verwijderen…';
      try{
        const result=await invokeManager({action:'delete',email:user.email,delete_messages:checkbox.checked});
        if(listMessage) listMessage.textContent=checkbox.checked?`Gebruiker verwijderd. ${result.deleted_messages||0} bericht(en) zijn ook verwijderd.`:'Gebruiker verwijderd. Bestaande berichten zijn bewaard.';
        await loadUsers(section);
      }catch(err){console.error('Beheeraccount verwijderen mislukt:',err);status.textContent='Verwijderen mislukt: '+(err?.message||'Onbekende fout');confirm.disabled=false;cancel.disabled=false;}
    });
  }

  async function loadUsers(section){
    const message=section.querySelector('[data-editor-list-message]');if(message) message.textContent='Gebruikers laden…';
    try{const data=await invokeManager({action:'list'});if(message) message.textContent='';renderUsers(section,data?.users||[]);}
    catch(err){console.error('Beheeraccounts laden mislukt:',err);if(message) message.textContent='Gebruikers laden mislukt: '+(err?.message||'Onbekende fout');}
  }

  async function injectOwnerSection(overlay){
    if(!overlay||overlay.querySelector('[data-owner-management]')) return;
    const grid=overlay.querySelector('.settings-grid');if(!grid||!(await isOwner())) return;
    if(!document.body.contains(overlay)||overlay.querySelector('[data-owner-management]')) return;
    const section=document.createElement('section');section.className='owner-management';section.setAttribute('data-owner-management','');
    section.innerHTML=`
      <div class="owner-management-head"><div><h4>Eigenaar & gebruikersbeheer</h4><p>Alleen zichtbaar voor het eigenaar-account. Hier kun je beheeraccounts bekijken, tijdelijk uitschakelen, leesbevestigingen beheren, aanmaken en verwijderen.</p></div><span class="owner-badge">Alleen eigenaar</span></div>
      <article class="settings-card" data-editor-list-card><h4>Beheeraccounts</h4><p>Een uitgeschakelde beheerder blijft bewaard, maar heeft tijdelijk geen beheerrechten. Berichten en leesbevestigingen van die gebruiker worden verborgen tot het account weer wordt ingeschakeld.</p><div class="owner-user-list" data-editor-list></div><p class="owner-list-message" data-editor-list-message></p></article>
      <article class="settings-card" data-create-editor-card><h4>Beheeraccount aanmaken</h4><p>Maak een account aan voor een e-mailadres dat vooraf als beheerder is toegestaan. Het account wordt direct bevestigd; er is daarna geen bevestigingsmail nodig.</p><div class="settings-form"><label>E-mailadres<input type="email" autocomplete="email" data-editor-email placeholder="naam@voorbeeld.nl"></label><label>Wachtwoord<input type="password" autocomplete="new-password" data-editor-password></label><label>Herhaal wachtwoord<input type="password" autocomplete="new-password" data-editor-password-confirm></label></div><div class="settings-actions" style="margin-top:12px"><button class="settings-btn" type="button" data-create-editor>Account aanmaken</button></div><p class="settings-message" data-create-editor-message></p></article>`;
    grid.appendChild(section);

    const createMessage=section.querySelector('[data-create-editor-message]');
    section.querySelector('[data-create-editor]')?.addEventListener('click',async()=>{
      const email=section.querySelector('[data-editor-email]')?.value.trim().toLowerCase()||'';
      const password=section.querySelector('[data-editor-password]')?.value||'';
      const confirm=section.querySelector('[data-editor-password-confirm]')?.value||'';
      if(!email){createMessage.textContent='Vul een e-mailadres in.';return;}if(password.length<8){createMessage.textContent='Het wachtwoord moet minimaal 8 tekens bevatten.';return;}if(password!==confirm){createMessage.textContent='De twee wachtwoorden komen niet overeen.';return;}
      createMessage.textContent='Account aanmaken…';
      const {data,error}=await client.functions.invoke('create-portfolio-editor-account',{body:{email,password}});
      if(error){let detail=error.message||'Onbekende fout';try{if(error.context?.json){const body=await error.context.json();if(body?.error) detail=body.error;}}catch(_err){}createMessage.textContent='Account aanmaken mislukt: '+detail;return;}
      if(data?.error){createMessage.textContent='Account aanmaken mislukt: '+data.error;return;}
      section.querySelector('[data-editor-password]').value='';section.querySelector('[data-editor-password-confirm]').value='';createMessage.textContent='Account is aangemaakt en direct bevestigd. Er kan nu met dit e-mailadres en wachtwoord worden ingelogd.';await loadUsers(section);
    });
    await loadUsers(section);
  }

  function scan(){document.querySelectorAll('.settings-overlay').forEach(overlay=>injectOwnerSection(overlay));}
  scan();
  const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});
})();