(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  let currentUser=null;
  let currentName='Beheerder';
  let currentEmail='';
  let messages=new Map();
  let receiptsByMessage=new Map();
  let ownReadSet=new Set();
  let realtime=null;
  let refreshTimer=null;
  let visibilityObserver=null;
  let mutationScheduled=false;

  const style=document.createElement('style');
  style.textContent=`
    .admin-unread-badge{
      display:inline-flex;align-items:center;justify-content:center;
      min-height:20px;padding:2px 7px;border-radius:999px;
      background:#b24b45;color:#fff;font-size:.62rem;font-weight:900;line-height:1.15;
      white-space:nowrap;box-shadow:0 0 0 2px rgba(178,75,69,.08)
    }
    .admin-unread-badge[hidden]{display:none!important}
    .admin-chat-count.has-unread{color:#9a403b!important;font-weight:900!important}
    .admin-chat-readby{
      margin:3px 0 0;color:#6e8077;font-size:.58rem;line-height:1.25;font-weight:700
    }
    .admin-ribbon-notes .admin-chat-readby{color:#6e8077!important}
  `;
  document.head.appendChild(style);

  const setText=(el,text)=>{
    if(el && el.textContent!==text) el.textContent=text;
  };

  function canUse(){
    return document.body.classList.contains('can-edit') && !!currentUser;
  }

  function ownMessage(row){
    return !!(currentUser && row?.created_by===currentUser.id);
  }

  function receiptNames(messageId){
    const rows=receiptsByMessage.get(String(messageId))||[];
    const unique=[];
    const seen=new Set();
    rows.forEach(row=>{
      const name=String(row.reader_name||'').trim() || String(row.reader_email||'').split('@')[0] || 'Beheerder';
      const key=name.toLocaleLowerCase('nl-NL');
      if(!seen.has(key)){seen.add(key);unique.push(name);}
    });
    return unique;
  }

  function joinNames(names){
    if(names.length<=1) return names[0]||'';
    if(names.length===2) return `${names[0]} en ${names[1]}`;
    return `${names.slice(0,-1).join(', ')} en ${names[names.length-1]}`;
  }

  function unreadRows(){
    if(!currentUser) return [];
    return [...messages.values()].filter(row=>!ownMessage(row) && !ownReadSet.has(String(row.id)));
  }

  function unreadByTopic(){
    const map=new Map();
    unreadRows().forEach(row=>map.set(row.topic_key,(map.get(row.topic_key)||0)+1));
    return map;
  }

  function ensureGlobalBadge(){
    const toggle=document.querySelector('.admin-notes-toggle');
    if(!toggle) return null;
    let badge=toggle.querySelector('.admin-unread-badge');
    if(!badge){
      badge=document.createElement('span');
      badge.className='admin-unread-badge';
      badge.setAttribute('aria-live','polite');
      toggle.appendChild(badge);
    }
    return badge;
  }

  function renderUnreadBadges(){
    const count=unreadRows().length;
    const badge=ensureGlobalBadge();
    if(badge){
      badge.hidden=count===0;
      const badgeText=count===1?'1 nieuw bericht':`${count} nieuwe berichten`;
      setText(badge,badgeText);
      if(badge.getAttribute('aria-label')!==badgeText) badge.setAttribute('aria-label',badgeText);
    }

    const perTopic=unreadByTopic();
    document.querySelectorAll('.admin-chat-panel[data-admin-chat-key]').forEach(panel=>{
      const key=panel.dataset.adminChatKey;
      const topicUnread=perTopic.get(key)||0;
      const countEl=panel.querySelector('.admin-chat-count');
      if(!countEl) return;
      countEl.classList.toggle('has-unread',topicUnread>0);
      let wanted='';
      if(topicUnread>0){
        wanted=`${topicUnread} nieuw`;
      }else{
        const total=[...messages.values()].filter(row=>row.topic_key===key).length;
        wanted=total ? `${total} bericht${total===1?'':'en'}` : '';
      }
      setText(countEl,wanted);
    });
  }

  function renderReadReceipts(){
    document.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(el=>{
      const id=String(el.dataset.adminMessageId||'');
      const row=messages.get(id);
      let receipt=el.querySelector(':scope > .admin-chat-readby');
      if(!row || !ownMessage(row)){
        receipt?.remove();
        return;
      }
      const names=receiptNames(id);
      if(!names.length){
        receipt?.remove();
        return;
      }
      if(!receipt){
        receipt=document.createElement('p');
        receipt.className='admin-chat-readby';
        const meta=el.querySelector(':scope > .admin-chat-meta');
        if(meta) meta.insertAdjacentElement('afterend',receipt);
        else el.appendChild(receipt);
      }
      setText(receipt,`✓ Gelezen door ${joinNames(names)}`);
    });
  }

  function syncUi(){
    if(!canUse()) return;
    renderUnreadBadges();
    renderReadReceipts();
    observeVisibleMessages();
  }

  async function loadState(){
    if(!document.body.classList.contains('can-edit')) return;
    const {data:sessionData}=await client.auth.getSession();
    const session=sessionData?.session;
    if(!session){
      currentUser=null;
      messages.clear();
      receiptsByMessage.clear();
      ownReadSet.clear();
      renderUnreadBadges();
      return;
    }
    currentUser=session.user;
    currentEmail=String(session.user.email||'').trim();

    const [editorResult,messageResult,receiptResult]=await Promise.all([
      client.from('portfolio_editors').select('display_name').eq('email',currentEmail).maybeSingle(),
      client.from('portfolio_admin_messages').select('id,topic_key,created_by,author_name,author_email,created_at').order('created_at',{ascending:true}),
      client.from('portfolio_admin_message_reads').select('message_id,reader_user_id,reader_email,reader_name,read_at')
    ]);

    if(editorResult.error) console.error('Beheerdernaam voor leesstatus laden mislukt:',editorResult.error);
    if(messageResult.error){console.error('Berichten voor leesstatus laden mislukt:',messageResult.error);return;}
    if(receiptResult.error){console.error('Leesbevestigingen laden mislukt:',receiptResult.error);return;}

    currentName=String(editorResult.data?.display_name||'').trim() || 'Beheerder';
    messages=new Map((messageResult.data||[]).map(row=>[String(row.id),row]));
    receiptsByMessage=new Map();
    ownReadSet=new Set();

    (receiptResult.data||[]).forEach(row=>{
      const id=String(row.message_id);
      const list=receiptsByMessage.get(id)||[];
      list.push(row);
      receiptsByMessage.set(id,list);
      if(row.reader_user_id===currentUser.id) ownReadSet.add(id);
    });

    syncUi();
    subscribeRealtime();
  }

  function scheduleLoad(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(loadState,100);
  }

  function panelIsActuallyVisible(messageEl){
    if(document.visibilityState!=='visible') return false;
    if(!document.body.classList.contains('admin-notes-visible')) return false;
    const panel=messageEl.closest('.admin-chat-panel');
    if(!panel) return false;
    const panelStyle=getComputedStyle(panel);
    if(panelStyle.display==='none' || panelStyle.visibility==='hidden') return false;
    const rect=messageEl.getBoundingClientRect();
    return rect.bottom>0 && rect.top<window.innerHeight && rect.right>0 && rect.left<window.innerWidth;
  }

  async function markRead(id){
    id=String(id||'');
    if(!id || !currentUser || ownReadSet.has(id)) return;
    const row=messages.get(id);
    if(!row || ownMessage(row)) return;

    ownReadSet.add(id);
    renderUnreadBadges();

    const receipt={
      message_id:id,
      reader_user_id:currentUser.id,
      reader_email:currentEmail,
      reader_name:currentName,
      read_at:new Date().toISOString()
    };

    const {error}=await client.from('portfolio_admin_message_reads')
      .upsert(receipt,{onConflict:'message_id,reader_user_id',ignoreDuplicates:true});

    if(error){
      ownReadSet.delete(id);
      renderUnreadBadges();
      console.error('Bericht als gelezen markeren mislukt:',error);
      return;
    }

    const list=receiptsByMessage.get(id)||[];
    if(!list.some(item=>item.reader_user_id===currentUser.id)) list.push(receipt);
    receiptsByMessage.set(id,list);
    renderReadReceipts();
  }

  function ensureVisibilityObserver(){
    if(visibilityObserver) return visibilityObserver;
    visibilityObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting || entry.intersectionRatio<0.6) return;
        const el=entry.target;
        const id=String(el.dataset.adminMessageId||'');
        const row=messages.get(id);
        if(!row || ownMessage(row) || ownReadSet.has(id) || !panelIsActuallyVisible(el)) return;
        markRead(id);
      });
    },{root:null,threshold:[0.6]});
    return visibilityObserver;
  }

  function observeVisibleMessages(){
    if(!canUse()) return;
    const observer=ensureVisibilityObserver();
    document.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(el=>{
      const id=String(el.dataset.adminMessageId||'');
      const row=messages.get(id);
      if(!row || ownMessage(row) || ownReadSet.has(id)) return;
      if(el.dataset.readStateObserved==='1') return;
      el.dataset.readStateObserved='1';
      observer.observe(el);
    });
  }

  function subscribeRealtime(){
    if(realtime || !currentUser) return;
    realtime=client.channel('portfolio-admin-read-state')
      .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_messages'},scheduleLoad)
      .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_message_reads'},scheduleLoad)
      .subscribe();
  }

  function scheduleMutationSync(){
    if(mutationScheduled) return;
    mutationScheduled=true;
    requestAnimationFrame(()=>{
      mutationScheduled=false;
      syncUi();
    });
  }

  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList' || (record.type==='attributes'&&record.target===document.body))){
      scheduleMutationSync();
    }
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      scheduleLoad();
      setTimeout(syncUi,140);
    }
  });
  window.addEventListener('focus',()=>{
    scheduleLoad();
    setTimeout(syncUi,140);
  });
  window.addEventListener('pageshow',scheduleLoad);
  window.addEventListener('portfolio-admin-display-name-changed',scheduleLoad);
  client.auth.onAuthStateChange(()=>{
    if(realtime){client.removeChannel(realtime);realtime=null;}
    setTimeout(loadState,0);
  });

  loadState();
})();