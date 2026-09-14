(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const VISIBILITY_KEY='portfolio-admin-notes-visible-v1';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  let visible=localStorage.getItem(VISIBILITY_KEY)==='1';
  let currentUser=null;
  let messagesByTopic=new Map();
  let realtimeChannel=null;
  let loadTimer=null;
  let enhanceScheduled=false;

  const style=document.createElement('style');
  style.textContent=`
    .admin-notes-toggle{margin-left:auto;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #d6e0da;border-radius:10px;background:#fff;color:#315546;font-size:.78rem;font-weight:800;white-space:nowrap;cursor:pointer;user-select:none}
    .admin-notes-toggle input{width:16px;height:16px;margin:0;accent-color:#1f5e4a;cursor:pointer}
    body:not(.can-edit) .admin-notes-toggle{display:none!important}
    .admin-chat-panel{display:none;min-width:0;border:1px solid #d7e2db;border-radius:13px;background:#f7faf8;overflow:hidden;align-self:stretch}
    body.can-edit.admin-notes-visible .topic-card{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(270px,38%);column-gap:14px;align-items:start}
    body.can-edit.admin-notes-visible .topic-card>.topic-card-head,
    body.can-edit.admin-notes-visible .topic-card>.topic-content,
    body.can-edit.admin-notes-visible .topic-card>.topic-edit-btn{grid-column:1}
    body.can-edit.admin-notes-visible .topic-card>.admin-chat-panel{display:flex;flex-direction:column;grid-column:2;grid-row:1 / span 8;min-height:100%}
    .admin-chat-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;border-bottom:1px solid #dce6df;background:#edf4ef;color:#285341}
    .admin-chat-head strong{font-size:.76rem;text-transform:uppercase;letter-spacing:.05em}
    .admin-chat-count{font-size:.68rem;font-weight:800;color:#6d7e75}
    .admin-chat-messages{display:flex;flex-direction:column;gap:7px;min-height:96px;max-height:245px;overflow:auto;padding:10px;overscroll-behavior:contain}
    .admin-chat-empty{margin:auto 0;color:#89968f;font-size:.77rem;font-style:italic;text-align:center;padding:12px 6px}
    .admin-chat-message{position:relative;align-self:flex-start;max-width:92%;padding:8px 10px;border:1px solid #dce5df;border-radius:11px 11px 11px 4px;background:#fff;color:#35473e;box-shadow:0 1px 2px rgba(18,44,34,.04)}
    .admin-chat-message.own{align-self:flex-end;border-color:#bdd2c5;border-radius:11px 11px 4px 11px;background:#e7f1ea}
    .admin-chat-message p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.78rem;line-height:1.42}
    .admin-chat-meta{display:flex;align-items:center;gap:6px;margin-top:5px;color:#7c8982;font-size:.62rem;font-weight:700}
    .admin-chat-delete{margin-left:auto;border:0;background:transparent;color:#9a5b54;padding:0 2px;cursor:pointer;font:inherit;font-size:.68rem;opacity:0;transition:opacity .12s ease}
    .admin-chat-message:hover .admin-chat-delete,.admin-chat-delete:focus-visible{opacity:1;outline:none}
    .admin-chat-compose{display:grid;grid-template-columns:1fr auto;gap:7px;padding:9px;border-top:1px solid #dce6df;background:#fff}
    .admin-chat-compose textarea{width:100%;min-height:38px;max-height:110px;resize:vertical;padding:8px 9px;border:1px solid #cddbd2;border-radius:9px;background:#fff;color:#30443a;font:inherit;font-size:.76rem;line-height:1.35}
    .admin-chat-compose textarea:focus{outline:2px solid rgba(31,94,74,.14);border-color:#85aa97}
    .admin-chat-send{align-self:end;min-height:38px;border:0;border-radius:9px;background:#1f5e4a;color:#fff;padding:0 11px;font:inherit;font-size:.73rem;font-weight:850;cursor:pointer}
    .admin-chat-send:disabled{opacity:.5;cursor:not-allowed}
    .admin-chat-error{grid-column:1/-1;margin:0;color:#a0443b;font-size:.67rem;min-height:0}
    @media(max-width:1050px){
      body.can-edit.admin-notes-visible .topic-card{grid-template-columns:1fr!important}
      body.can-edit.admin-notes-visible .topic-card>.topic-card-head,
      body.can-edit.admin-notes-visible .topic-card>.topic-content,
      body.can-edit.admin-notes-visible .topic-card>.topic-edit-btn,
      body.can-edit.admin-notes-visible .topic-card>.admin-chat-panel{grid-column:1}
      body.can-edit.admin-notes-visible .topic-card>.admin-chat-panel{grid-row:auto;margin-top:10px;min-height:0}
      .admin-chat-messages{max-height:210px}
    }
    @media(max-width:700px){.admin-notes-toggle{font-size:.7rem;padding:6px 8px}.admin-chat-compose{grid-template-columns:1fr}.admin-chat-send{justify-self:end;padding:8px 12px}}
  `;
  document.head.appendChild(style);

  const esc=(value='')=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function stableTopicKey(card){
    const raw=card?.dataset?.topicCard||'';
    const [groupIndex,topicIndex]=raw.split('-').map(Number);
    try{
      const fieldId=groups?.[groupIndex]?.topics?.[topicIndex]?.fields?.[0]?.[0];
      if(fieldId) return `topic:${fieldId}`;
    }catch(_err){}
    const chapter=card?.closest('.portfolio-group')?.id||'portfolio';
    const title=(card?.querySelector('.topic-card-title h4')?.textContent||raw||'onderdeel')
      .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    return `${chapter}:${title}`;
  }

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

  function syncVisibility(){
    const show=document.body.classList.contains('can-edit') && visible;
    document.body.classList.toggle('admin-notes-visible',show);
    if(show){
      scheduleEnhance();
      document.querySelectorAll('.admin-chat-panel').forEach(panel=>renderPanel(panel));
    }
  }

  function renderPanel(panel){
    const key=panel.dataset.topicKey;
    const list=messagesByTopic.get(key)||[];
    const messages=panel.querySelector('.admin-chat-messages');
    const count=panel.querySelector('.admin-chat-count');
    if(count) count.textContent=list.length ? `${list.length} bericht${list.length===1?'':'en'}` : 'Nog leeg';
    if(!messages) return;
    if(!list.length){
      messages.innerHTML='<p class="admin-chat-empty">Nog geen beheerdernotities voor dit onderdeel.</p>';
      return;
    }
    messages.innerHTML=list.map(row=>{
      const own=currentUser && row.created_by===currentUser.id;
      return `<article class="admin-chat-message${own?' own':''}" data-admin-message-id="${esc(row.id)}">
        <p>${esc(row.message)}</p>
        <div class="admin-chat-meta"><span>${esc(authorLabel(row))}</span><span>·</span><time>${esc(formatTime(row.created_at))}</time>${own?'<button class="admin-chat-delete" type="button" title="Bericht verwijderen" aria-label="Bericht verwijderen">×</button>':''}</div>
      </article>`;
    }).join('');
    messages.querySelectorAll('.admin-chat-delete').forEach(button=>button.addEventListener('click',async()=>{
      const messageEl=button.closest('[data-admin-message-id]');
      const id=messageEl?.dataset.adminMessageId;
      if(!id) return;
      button.disabled=true;
      const {error}=await client.from('portfolio_admin_messages').delete().eq('id',id);
      if(error){button.disabled=false;console.error('Beheerbericht verwijderen mislukt:',error);return;}
      const next=(messagesByTopic.get(key)||[]).filter(row=>row.id!==id);
      messagesByTopic.set(key,next);
      renderPanel(panel);
    }));
    requestAnimationFrame(()=>{messages.scrollTop=messages.scrollHeight});
  }

  async function sendMessage(panel){
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
    const payload={
      topic_key:panel.dataset.topicKey,
      message,
      created_by:session.user.id,
      author_email:session.user.email||''
    };
    const {data,error}=await client.from('portfolio_admin_messages').insert(payload).select('id,topic_key,message,created_at,created_by,author_email').single();
    if(send) send.disabled=false;
    if(error){if(errorEl) errorEl.textContent='Bericht opslaan is mislukt.';console.error(error);return;}
    textarea.value='';
    const list=messagesByTopic.get(data.topic_key)||[];
    if(!list.some(row=>row.id===data.id)) list.push(data);
    list.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    messagesByTopic.set(data.topic_key,list);
    renderPanel(panel);
  }

  function enhanceCards(){
    if(!document.body.classList.contains('can-edit')) return;
    document.querySelectorAll('.topic-card[data-topic-card]').forEach(card=>{
      let panel=card.querySelector(':scope > .admin-chat-panel');
      const key=stableTopicKey(card);
      if(!panel){
        panel=document.createElement('aside');
        panel.className='admin-chat-panel';
        panel.dataset.topicKey=key;
        panel.setAttribute('aria-label','Beheerdernotities');
        panel.innerHTML=`<div class="admin-chat-head"><strong>Beheerdernotities</strong><span class="admin-chat-count">Nog leeg</span></div>
          <div class="admin-chat-messages"><p class="admin-chat-empty">Nog geen beheerdernotities voor dit onderdeel.</p></div>
          <div class="admin-chat-compose">
            <textarea rows="2" maxlength="4000" data-admin-chat-input placeholder="Typ een opmerking of verbetersuggestie…" aria-label="Nieuwe beheerdernotitie"></textarea>
            <button class="admin-chat-send" data-admin-chat-send type="button">Versturen</button>
            <p class="admin-chat-error" aria-live="polite"></p>
          </div>`;
        card.appendChild(panel);
        panel.querySelector('[data-admin-chat-send]')?.addEventListener('click',()=>sendMessage(panel));
        panel.querySelector('[data-admin-chat-input]')?.addEventListener('keydown',event=>{
          if(event.key==='Enter'&&!event.shiftKey){
            event.preventDefault();
            sendMessage(panel);
          }
        });
      }else if(panel.dataset.topicKey!==key){
        panel.dataset.topicKey=key;
      }
      renderPanel(panel);
    });
  }

  function scheduleEnhance(){
    if(enhanceScheduled) return;
    enhanceScheduled=true;
    requestAnimationFrame(()=>{
      enhanceScheduled=false;
      ensureToggle();
      enhanceCards();
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
      .order('created_at',{ascending:true});
    if(error){console.error('Beheerdernotities laden mislukt:',error);return;}
    const next=new Map();
    (data||[]).forEach(row=>{
      const list=next.get(row.topic_key)||[];
      list.push(row);
      next.set(row.topic_key,list);
    });
    messagesByTopic=next;
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
      messagesByTopic=new Map();
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