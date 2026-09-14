(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const VISIBILITY_KEY='portfolio-admin-notes-visible-v1';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const TARGETS=[
    {selector:'#start',key:'admin:start',label:'Start'},
    {selector:'#over',key:'admin:over',label:'Over dit portfolio'},
    {selector:'#overzicht',key:'admin:overview',label:'Portfolio-overzicht'},
    {selector:'#hoofdstuk-1',key:'admin:chapter:1',label:'Profiel & leerdoelen'},
    {selector:'#hoofdstuk-2',key:'admin:chapter:2',label:'Doelgroep & doelen'},
    {selector:'#hoofdstuk-3',key:'admin:chapter:3',label:'Planning & voorbereiding'},
    {selector:'#hoofdstuk-4',key:'admin:chapter:4',label:'Uitvoering & bewijs'},
    {selector:'#hoofdstuk-5',key:'admin:chapter:5',label:'Evaluatie & feedback'},
    {selector:'#hoofdstuk-6',key:'admin:chapter:6',label:'Ontwikkeling & reflectie'}
  ];
  const RIBBON={key:'admin:ribbon',label:'Lintnotities'};
  const allowedKeys=[...TARGETS.map(item=>item.key),RIBBON.key];

  let visible=localStorage.getItem(VISIBILITY_KEY)==='1';
  let currentUser=null;
  let messagesByKey=new Map();
  let realtimeChannel=null;
  let loadTimer=null;
  let enhanceScheduled=false;

  const style=document.createElement('style');
  style.textContent=`
    .admin-notes-toggle{margin-left:auto;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #d6e0da;border-radius:10px;background:#fff;color:#315546;font-size:.78rem;font-weight:800;white-space:nowrap;cursor:pointer;user-select:none}
    .admin-notes-toggle input{width:16px;height:16px;margin:0;accent-color:#1f5e4a;cursor:pointer}
    body:not(.can-edit) .admin-notes-toggle{display:none!important}

    body.can-edit.admin-notes-visible main{width:min(1440px,calc(100% - 16px));margin-left:16px;margin-right:0}
    .admin-chat-host{position:relative;--admin-chat-width:245px;--admin-chat-gap:15px}
    .section.admin-chat-host{--admin-host-pad:clamp(20px,3vw,34px)}
    .hero.admin-chat-host{--admin-host-pad:clamp(28px,5vw,60px)}
    body.can-edit.admin-notes-visible .admin-chat-host{padding-right:calc(var(--admin-host-pad) + var(--admin-chat-width) + var(--admin-chat-gap))}

    .admin-chat-panel{display:none;min-width:0;border:1px solid #d7e2db;border-radius:13px;background:#f7faf8;overflow:hidden}
    body.can-edit.admin-notes-visible .admin-section-chat{display:flex;position:absolute;z-index:5;top:var(--admin-host-pad);right:var(--admin-host-pad);bottom:var(--admin-host-pad);width:var(--admin-chat-width);min-height:0;flex-direction:column}
    .admin-chat-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex:0 0 auto;padding:9px 10px;border-bottom:1px solid #dce6df;background:#edf4ef;color:#285341}
    .admin-chat-head strong{min-width:0;font-size:.73rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .admin-chat-count{flex:0 0 auto;font-size:.64rem;font-weight:800;color:#6d7e75}
    .admin-chat-messages{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:7px;overflow:auto;padding:9px;overscroll-behavior:contain;scrollbar-gutter:stable}
    .admin-chat-empty{margin:auto 0;color:#89968f;font-size:.74rem;font-style:italic;text-align:center;padding:10px 5px}
    .admin-chat-message{position:relative;align-self:flex-start;max-width:94%;padding:7px 9px;border:1px solid #dce5df;border-radius:11px 11px 11px 4px;background:#fff;color:#35473e;box-shadow:0 1px 2px rgba(18,44,34,.04)}
    .admin-chat-message.own{align-self:flex-end;border-color:#bdd2c5;border-radius:11px 11px 4px 11px;background:#e7f1ea}
    .admin-chat-message p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.75rem;line-height:1.4}
    .admin-chat-meta{display:flex;align-items:center;gap:5px;margin-top:5px;color:#7c8982;font-size:.59rem;font-weight:700}
    .admin-chat-delete{margin-left:auto;border:0;background:transparent;color:#9a5b54;padding:0 2px;cursor:pointer;font:inherit;font-size:.68rem;opacity:0;transition:opacity .12s ease}
    .admin-chat-message:hover .admin-chat-delete,.admin-chat-delete:focus-visible{opacity:1;outline:none}
    .admin-chat-compose{display:grid;grid-template-columns:1fr auto;gap:6px;flex:0 0 auto;padding:8px;border-top:1px solid #dce6df;background:#fff}
    .admin-chat-compose textarea{width:100%;height:38px;min-height:38px;resize:none;padding:8px 9px;border:1px solid #cddbd2;border-radius:9px;background:#fff;color:#30443a;font:inherit;font-size:.73rem;line-height:1.3}
    .admin-chat-compose textarea:focus{outline:2px solid rgba(31,94,74,.14);border-color:#85aa97}
    .admin-chat-send{align-self:end;height:38px;border:0;border-radius:9px;background:#1f5e4a;color:#fff;padding:0 9px;font:inherit;font-size:.69rem;font-weight:850;cursor:pointer}
    .admin-chat-send:disabled{opacity:.5;cursor:not-allowed}
    .admin-chat-error{grid-column:1/-1;margin:0;color:#a0443b;font-size:.64rem;min-height:0}

    .admin-ribbon-notes{margin:0 0 12px;border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff}
    body.can-edit.admin-notes-visible .admin-ribbon-notes{display:flex;max-height:250px;flex-direction:column}
    .admin-ribbon-notes .admin-chat-head{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.12);color:#fff}
    .admin-ribbon-notes .admin-chat-count{color:rgba(255,255,255,.65)}
    .admin-ribbon-notes .admin-chat-messages{min-height:75px;background:rgba(4,27,20,.08)}
    .admin-ribbon-notes .admin-chat-empty{color:rgba(255,255,255,.58)}
    .admin-ribbon-notes .admin-chat-message{border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.10);color:#fff}
    .admin-ribbon-notes .admin-chat-message.own{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.2)}
    .admin-ribbon-notes .admin-chat-meta{color:rgba(255,255,255,.58)}
    .admin-ribbon-notes .admin-chat-compose{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12)}
    .admin-ribbon-notes .admin-chat-compose textarea{border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.95)}
    .admin-ribbon-notes .admin-chat-send{background:#f1ead8;color:#174838}

    @media(max-width:1180px){
      .admin-chat-host{--admin-chat-width:220px;--admin-chat-gap:12px}
      body.can-edit.admin-notes-visible main{width:calc(100% - 12px);margin-left:12px}
    }
    @media(max-width:930px){
      body.can-edit.admin-notes-visible main{width:min(100% - 24px,1180px);margin:0 auto}
      body.can-edit.admin-notes-visible .admin-chat-host{padding-right:var(--admin-host-pad)}
      body.can-edit.admin-notes-visible .admin-section-chat{position:relative;inset:auto;width:100%;max-height:300px;margin-top:16px}
      body.can-edit.admin-notes-visible .admin-section-chat .admin-chat-messages{min-height:100px;max-height:185px}
    }
    @media(max-width:700px){
      .admin-notes-toggle{font-size:.68rem;padding:6px 8px}
      .admin-notes-toggle span{max-width:120px;white-space:normal;line-height:1.2}
      .admin-chat-compose{grid-template-columns:1fr}
      .admin-chat-send{justify-self:end;padding:0 12px}
    }
  `;
  document.head.appendChild(style);

  const esc=(value='')=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function authorLabel(row){
    if(currentUser && row.created_by===currentUser.id) return 'Jij';
    const email=String(row.author_email||'');
    return email.includes('@') ? email.split('@')[0] : (email||'Beheerder');
  }

  function formatTime(value){
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('nl-NL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  }

  function panelMarkup(label){
    return `<div class="admin-chat-head"><strong>${esc(label)}</strong><span class="admin-chat-count">Nog leeg</span></div>
      <div class="admin-chat-messages"><p class="admin-chat-empty">Nog geen beheerdernotities.</p></div>
      <div class="admin-chat-compose">
        <textarea rows="2" maxlength="4000" data-admin-chat-input placeholder="Typ een notitie…" aria-label="Nieuwe beheerdernotitie"></textarea>
        <button class="admin-chat-send" data-admin-chat-send type="button">Versturen</button>
        <p class="admin-chat-error" aria-live="polite"></p>
      </div>`;
  }

  function bindPanel(panel){
    if(panel.dataset.chatBound) return;
    panel.dataset.chatBound='1';
    panel.querySelector('[data-admin-chat-send]')?.addEventListener('click',()=>sendMessage(panel));
    panel.querySelector('[data-admin-chat-input]')?.addEventListener('keydown',event=>{
      if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage(panel);}
    });
  }

  function ensureToggle(){
    const topbar=document.querySelector('.topbar');
    if(!topbar) return;
    let toggle=topbar.querySelector('.admin-notes-toggle');
    if(!document.body.classList.contains('can-edit')){
      document.body.classList.remove('admin-notes-visible');
      toggle?.remove();
      return;
    }
    if(!toggle){
      toggle=document.createElement('label');
      toggle.className='admin-notes-toggle';
      toggle.innerHTML='<input type="checkbox" data-admin-notes-toggle><span>Beheerdernotities weergeven</span>';
      topbar.appendChild(toggle);
      const input=toggle.querySelector('input');
      input.checked=visible;
      input.addEventListener('change',()=>{
        visible=input.checked;
        localStorage.setItem(VISIBILITY_KEY,visible?'1':'0');
        syncVisibility();
        if(visible) loadMessages(true);
      });
    }else if(toggle!==topbar.lastElementChild){
      topbar.appendChild(toggle);
    }
    const input=toggle.querySelector('input');
    if(input) input.checked=visible;
  }

  function ensureSectionPanels(){
    if(!document.body.classList.contains('can-edit')) return;
    TARGETS.forEach(item=>{
      const host=document.querySelector(item.selector);
      if(!host) return;
      host.classList.add('admin-chat-host');
      let panel=host.querySelector(':scope > .admin-section-chat');
      if(!panel){
        panel=document.createElement('aside');
        panel.className='admin-chat-panel admin-section-chat';
        panel.dataset.adminChatKey=item.key;
        panel.setAttribute('aria-label',`Beheerdernotities ${item.label}`);
        panel.innerHTML=panelMarkup(item.label);
        host.appendChild(panel);
      }
      bindPanel(panel);
      renderPanel(panel);
    });
  }

  function ensureRibbonPanel(){
    if(!document.body.classList.contains('can-edit')) return;
    const sidebar=document.querySelector('.sidebar');
    if(!sidebar) return;
    let panel=sidebar.querySelector(':scope > .admin-ribbon-notes');
    if(!panel){
      panel=document.createElement('aside');
      panel.className='admin-chat-panel admin-ribbon-notes';
      panel.dataset.adminChatKey=RIBBON.key;
      panel.setAttribute('aria-label','Lintnotities');
      panel.innerHTML=panelMarkup(RIBBON.label);
      const foot=sidebar.querySelector(':scope > .side-foot');
      sidebar.insertBefore(panel,foot||null);
    }
    bindPanel(panel);
    renderPanel(panel);
  }

  function syncVisibility(){
    const show=document.body.classList.contains('can-edit') && visible;
    document.body.classList.toggle('admin-notes-visible',show);
    if(show){
      ensureSectionPanels();
      ensureRibbonPanel();
      document.querySelectorAll('.admin-chat-panel').forEach(panel=>renderPanel(panel));
    }
  }

  function renderPanel(panel){
    const key=panel.dataset.adminChatKey;
    if(!key) return;
    const list=messagesByKey.get(key)||[];
    const messages=panel.querySelector('.admin-chat-messages');
    const count=panel.querySelector('.admin-chat-count');
    if(count) count.textContent=list.length ? `${list.length} bericht${list.length===1?'':'en'}` : 'Nog leeg';
    if(!messages) return;
    if(!list.length){
      messages.dataset.messageSignature='empty';
      messages.innerHTML='<p class="admin-chat-empty">Nog geen beheerdernotities.</p>';
      return;
    }
    const signature=list.map(row=>row.id).join('|');
    if(messages.dataset.messageSignature===signature) return;
    messages.dataset.messageSignature=signature;
    messages.innerHTML=list.map(row=>{
      const own=currentUser && row.created_by===currentUser.id;
      return `<article class="admin-chat-message${own?' own':''}" data-admin-message-id="${esc(row.id)}">
        <p>${esc(row.message)}</p>
        <div class="admin-chat-meta"><span>${esc(authorLabel(row))}</span><span>·</span><time>${esc(formatTime(row.created_at))}</time>${own?'<button class="admin-chat-delete" type="button" title="Bericht verwijderen" aria-label="Bericht verwijderen">×</button>':''}</div>
      </article>`;
    }).join('');
    messages.querySelectorAll('.admin-chat-delete').forEach(button=>button.addEventListener('click',async()=>{
      const id=button.closest('[data-admin-message-id]')?.dataset.adminMessageId;
      if(!id) return;
      button.disabled=true;
      const {error}=await client.from('portfolio_admin_messages').delete().eq('id',id);
      if(error){button.disabled=false;console.error('Beheerbericht verwijderen mislukt:',error);return;}
      messagesByKey.set(key,(messagesByKey.get(key)||[]).filter(row=>row.id!==id));
      messages.dataset.messageSignature='';
      renderPanel(panel);
    }));
    requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight});
  }

  async function sendMessage(panel){
    const key=panel.dataset.adminChatKey;
    if(!allowedKeys.includes(key)) return;
    const textarea=panel.querySelector('[data-admin-chat-input]');
    const send=panel.querySelector('[data-admin-chat-send]');
    const errorEl=panel.querySelector('.admin-chat-error');
    const message=textarea?.value.trim()||'';
    if(!message) return;
    if(message.length>4000){if(errorEl) errorEl.textContent='Een bericht mag maximaal 4000 tekens bevatten.';return;}
    const {data:sessionData}=await client.auth.getSession();
    const session=sessionData?.session;
    if(!session){if(errorEl) errorEl.textContent='Je bent niet meer ingelogd.';return;}
    currentUser=session.user;
    if(send) send.disabled=true;
    if(errorEl) errorEl.textContent='';
    const payload={topic_key:key,message,created_by:session.user.id,author_email:session.user.email||''};
    const {data,error}=await client.from('portfolio_admin_messages').insert(payload).select('id,topic_key,message,created_at,created_by,author_email').single();
    if(send) send.disabled=false;
    if(error){if(errorEl) errorEl.textContent='Bericht opslaan is mislukt.';console.error(error);return;}
    textarea.value='';
    const list=messagesByKey.get(key)||[];
    if(!list.some(row=>row.id===data.id)) list.push(data);
    list.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    messagesByKey.set(key,list);
    const messages=panel.querySelector('.admin-chat-messages');
    if(messages) messages.dataset.messageSignature='';
    renderPanel(panel);
  }

  function scheduleEnhance(){
    if(enhanceScheduled) return;
    enhanceScheduled=true;
    requestAnimationFrame(()=>{
      enhanceScheduled=false;
      ensureToggle();
      if(document.body.classList.contains('can-edit')){
        ensureSectionPanels();
        ensureRibbonPanel();
      }
      syncVisibility();
    });
  }

  async function loadMessages(force=false){
    if(!document.body.classList.contains('can-edit')) return;
    if(!visible&&!force) return;
    const {data:sessionData}=await client.auth.getSession();
    const session=sessionData?.session;
    if(!session) return;
    currentUser=session.user;
    const {data,error}=await client.from('portfolio_admin_messages')
      .select('id,topic_key,message,created_at,created_by,author_email')
      .in('topic_key',allowedKeys)
      .order('created_at',{ascending:true});
    if(error){console.error('Beheerdernotities laden mislukt:',error);return;}
    const next=new Map();
    (data||[]).forEach(row=>{
      const list=next.get(row.topic_key)||[];
      list.push(row);
      next.set(row.topic_key,list);
    });
    messagesByKey=next;
    document.querySelectorAll('.admin-chat-messages').forEach(el=>{el.dataset.messageSignature=''});
    document.querySelectorAll('.admin-chat-panel').forEach(panel=>renderPanel(panel));
    subscribeRealtime();
  }

  function subscribeRealtime(){
    if(realtimeChannel||!currentUser) return;
    realtimeChannel=client.channel('portfolio-admin-notes-chat')
      .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_messages'},()=>{
        clearTimeout(loadTimer);
        loadTimer=setTimeout(()=>loadMessages(true),120);
      })
      .subscribe();
  }

  function syncAuthState(){
    ensureToggle();
    if(document.body.classList.contains('can-edit')){
      scheduleEnhance();
      if(visible) loadMessages(true);
    }else{
      currentUser=null;
      messagesByKey=new Map();
      document.body.classList.remove('admin-notes-visible');
      if(realtimeChannel){client.removeChannel(realtimeChannel);realtimeChannel=null;}
    }
  }

  new MutationObserver(records=>{
    if(records.some(record=>record.type==='attributes'&&record.target===document.body)) syncAuthState();
    if(records.some(record=>record.type==='childList')) scheduleEnhance();
  }).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});

  client.auth.onAuthStateChange(()=>setTimeout(syncAuthState,0));
  syncAuthState();
})();