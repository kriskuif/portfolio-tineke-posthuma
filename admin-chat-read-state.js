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

  const style=document.createElement('style');
  style.textContent=`
    .admin-unread-badge{display:inline-flex;align-items:center;justify-content:center;min-height:20px;padding:2px 7px;border-radius:999px;background:#b24b45;color:#fff;font-size:.62rem;font-weight:900;line-height:1.15;white-space:nowrap;box-shadow:0 0 0 2px rgba(178,75,69,.08)}
    .admin-unread-badge[hidden]{display:none!important}
    .admin-chat-count.has-unread{color:#9a403b!important;font-weight:900!important}
    .admin-chat-readby{margin:3px 0 0;color:#6e8077;font-size:.58rem;line-height:1.25;font-weight:700}
    .admin-ribbon-notes .admin-chat-readby{color:#6e8077!important}
  `;
  document.head.appendChild(style);

  const setText=(el,text)=>{ if(el && el.textContent!==text) el.textContent=text; };
  const canUse=()=>document.body.classList.contains('can-edit') && !!currentUser;
  const ownMessage=row=>!!(currentUser && row?.created_by===currentUser.id);

  function receiptNames(messageId){
    const rows=receiptsByMessage.get(String(messageId))||[];
    const names=[];
    const seen=new Set();
    rows.forEach(row=>{
      const name=String(row.reader_name||'').trim() || String(row.reader_email||'').split('@')[0] || 'Beheerder';
      const key=name.toLocaleLowerCase('nl-NL');
      if(!seen.has(key)){seen.add(key);names.push(name);}
    });
    return names;
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
    if(!currentUser) return;
    const unread=unreadRows();
    const badge=ensureGlobalBadge();
    if(badge){
      const text=unread.length===1?'1 nieuw bericht':`${unread.length} nieuwe berichten`;
      if(badge.hidden!==(unread.length===0)) badge.hidden=unread.length===0;
      setText(badge,text);
      if(badge.getAttribute('aria-label')!==text) badge.setAttribute('aria-label',text);
    }

    const perTopic=new Map();
    unread.forEach(row=>perTopic.set(row.topic_key,(perTopic.get(row.topic_key)||0)+1));
    document.querySelectorAll('.admin-chat-panel[data-admin-chat-key]').forEach(panel=>{
      const countEl=panel.querySelector('.admin-chat-count');
      if(!countEl) return;
      const key=panel.dataset.adminChatKey;
      const unreadCount=perTopic.get(key)||0;
      countEl.classList.toggle('has-unread',unreadCount>0);
      if(unreadCount){
        setText(countEl,`${unreadCount} nieuw`);
      }else{
        const total=[...messages.values()].filter(row=>row.topic_key===key).length;
        setText(countEl,total?`${total} bericht${total===1?'':'en'}`:'');
      }
    });
  }

  function renderReadReceipts(){
    if(!currentUser) return;
    document.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(el=>{
      const id=String(el.dataset.adminMessageId||'');
      const row=messages.get(id);
      let receipt=el.querySelector(':scope > .admin-chat-readby');
      if(!row || !ownMessage(row)){
        if(receipt) receipt.remove();
        return;
      }
      const names=receiptNames(id);
      if(!names.length){
        if(receipt) receipt.remove();
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

  function panelIsActuallyVisible(messageEl){
    if(document.visibilityState!=='visible' || !document.body.classList.contains('admin-notes-visible')) return false;
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
    const receipt={message_id:id,reader_user_id:currentUser.id,reader_email:currentEmail,reader_name:currentName,read_at:new Date().toISOString()};
    const {error}=await client.from('portfolio_admin_message_reads').upsert(receipt,{onConflict:'message_id,reader_user_id',ignoreDuplicates:true});
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
    },{threshold:[0.6]});
    return visibilityObserver;
  }

  function observeVisibleMessages(){
    if(!canUse()) return;
    const observer=ensureVisibilityObserver();
    document.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(el=>{
      const id=String(el.dataset.adminMessageId||'');
      const row=messages.get(id);
      if(!row || ownMessage(row) || ownReadSet.has(id) || el.dataset.readStateObserved==='1') return;
      el.dataset.readStateObserved='1';
      observer.observe(el);
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
    if(!session){currentUser=null;return;}
    currentUser=session.user;
    currentEmail=String(session.user.email||'').trim();

    const [editorResult,messageResult,receiptResult]=await Promise.all([
      client.from('portfolio_editors').select('display_name').eq('email',currentEmail).maybeSingle(),
      client.from('portfolio_admin_messages').select('id,topic_key,created_by,author_name,author_email,created_at').order('created_at',{ascending:true}),
      client.from('portfolio_admin_message_reads').select('message_id,reader_user_id,reader_email,reader_name,read_at')
    ]);
    if(messageResult.error){console.error('Berichten voor leesstatus laden mislukt:',messageResult.error);return;}
    if(receiptResult.error){console.error('Leesbevestigingen laden mislukt:',receiptResult.error);return;}
    if(editorResult.error) console.error('Beheerdernaam voor leesstatus laden mislukt:',editorResult.error);

    currentName=String(editorResult.data?.display_name||'').trim()||'Beheerder';
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
    refreshTimer=setTimeout(loadState,120);
  }

  function subscribeRealtime(){
    if(realtime || !currentUser) return;
    realtime=client.channel('portfolio-admin-read-state')
      .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_messages'},scheduleLoad)
      .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_message_reads'},scheduleLoad)
      .subscribe();
  }

  // Geen brede MutationObserver: die veroorzaakte een renderlus. Een lichte, passieve
  // controle is voldoende om nieuw aangemaakte chat-DOM te koppelen aan de bestaande status.
  const uiTimer=setInterval(()=>{
    if(document.visibilityState==='visible' && canUse()) syncUi();
  },900);

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){scheduleLoad();setTimeout(syncUi,160);}
  });
  window.addEventListener('focus',()=>{scheduleLoad();setTimeout(syncUi,160);});
  window.addEventListener('pageshow',scheduleLoad);
  window.addEventListener('portfolio-admin-display-name-changed',scheduleLoad);
  window.addEventListener('beforeunload',()=>clearInterval(uiTimer),{once:true});
  client.auth.onAuthStateChange(()=>{
    if(realtime){client.removeChannel(realtime);realtime=null;}
    setTimeout(loadState,0);
  });

  loadState();
})();