(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const DWELL_MS=3000;
  const VISIBILITY_KEY='portfolio-admin-notes-visible-v2';
  const LOGIN_MARKER_KEY='portfolio-admin-notes-login-user-v1';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const seenSince=new Map();
  let dueTimer=null;
  let scanQueued=false;
  let session=null;
  let editor=null;
  let channel=null;
  let marking=false;

  function clearDueTimer(){
    if(dueTimer){clearTimeout(dueTimer);dueTimer=null;}
  }

  function resetSeen(){
    clearDueTimer();
    seenSince.clear();
  }

  function notesVisible(){
    return document.body.classList.contains('admin-notes-visible') && document.visibilityState==='visible';
  }

  function currentUserId(){
    return session?.user?.id||'';
  }

  function currentEmail(){
    return String(session?.user?.email||'').trim().toLowerCase();
  }

  function forceNotesOff(attempt=0){
    try{localStorage.setItem(VISIBILITY_KEY,'0');}catch(_err){}
    document.body.classList.remove('admin-notes-visible');
    const input=document.querySelector('[data-admin-notes-toggle]');
    if(input){
      if(input.checked){
        input.checked=false;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }
      return;
    }
    if(attempt<24) setTimeout(()=>forceNotesOff(attempt+1),50);
  }

  function handleAuthStateChange(event,newSession){
    const uid=String(newSession?.user?.id||'');
    if(event==='SIGNED_OUT'){
      try{sessionStorage.removeItem(LOGIN_MARKER_KEY);}catch(_err){}
      forceNotesOff();
    }else if(event==='SIGNED_IN'&&uid){
      let previous='';
      try{previous=sessionStorage.getItem(LOGIN_MARKER_KEY)||'';}catch(_err){}
      if(previous!==uid){
        try{sessionStorage.setItem(LOGIN_MARKER_KEY,uid);}catch(_err){}
        forceNotesOff();
      }
    }
    setTimeout(refreshIdentity,0);
  }

  function elementVisible(el){
    if(!notesVisible()||!el?.isConnected) return false;
    const panel=el.closest('.admin-chat-panel');
    const container=el.closest('.admin-chat-messages');
    if(!panel||!container||getComputedStyle(panel).display==='none') return false;
    const er=el.getBoundingClientRect();
    const cr=container.getBoundingClientRect();
    const top=Math.max(er.top,cr.top,0);
    const bottom=Math.min(er.bottom,cr.bottom,window.innerHeight);
    const visible=Math.max(0,bottom-top);
    return er.height>0 && visible/er.height>=0.6;
  }

  function visibleUnreadIds(){
    const ids=[];
    document.querySelectorAll('.admin-chat-message.is-unread[data-admin-message-id]').forEach(el=>{
      if(elementVisible(el)) ids.push(String(el.dataset.adminMessageId||''));
    });
    return [...new Set(ids.filter(Boolean))];
  }

  async function markRead(ids){
    if(marking||!session?.user||!editor) return;
    const unique=[...new Set(ids.map(String).filter(Boolean))];
    if(!unique.length) return;
    marking=true;
    try{
      const rows=unique.map(id=>({
        message_id:id,
        reader_user_id:currentUserId(),
        reader_email:currentEmail(),
        reader_name:String(editor.display_name||'').trim()||'Beheerder',
        read_at:new Date().toISOString()
      }));
      const {error}=await client.from('portfolio_admin_message_reads').upsert(rows,{
        onConflict:'message_id,reader_user_id',
        ignoreDuplicates:true
      });
      if(error && error.code!=='23505') throw error;
      unique.forEach(id=>seenSince.delete(id));
    }catch(err){
      console.error('Leesstatus bijwerken mislukt:',err);
    }finally{
      marking=false;
      queueScan(100);
    }
  }

  function scheduleDue(){
    clearDueTimer();
    if(!seenSince.size) return;
    const now=Date.now();
    let wait=DWELL_MS;
    seenSince.forEach(start=>{wait=Math.min(wait,Math.max(0,DWELL_MS-(now-start)));});
    dueTimer=setTimeout(()=>{
      dueTimer=null;
      scan();
    },Math.max(20,wait));
  }

  function scan(){
    scanQueued=false;
    if(!session?.user||!editor||!notesVisible()){
      resetSeen();
      return;
    }

    const visible=new Set(visibleUnreadIds());
    const now=Date.now();

    [...seenSince.keys()].forEach(id=>{
      if(!visible.has(id)) seenSince.delete(id);
    });
    visible.forEach(id=>{
      if(!seenSince.has(id)) seenSince.set(id,now);
    });

    const due=[];
    seenSince.forEach((start,id)=>{
      if(visible.has(id) && now-start>=DWELL_MS) due.push(id);
    });

    if(due.length){
      markRead(due);
      return;
    }
    scheduleDue();
  }

  function queueScan(delay=0){
    if(scanQueued) return;
    scanQueued=true;
    if(delay){setTimeout(scan,delay);return;}
    requestAnimationFrame(scan);
  }

  async function refreshIdentity(){
    const {data}=await client.auth.getSession();
    session=data?.session||null;
    editor=null;
    resetSeen();

    if(session?.user?.email){
      const {data:row}=await client.from('portfolio_editors')
        .select('display_name,is_active,read_receipts_enabled')
        .ilike('email',currentEmail())
        .maybeSingle();
      if(row?.is_active!==false) editor=row||null;
    }
    queueScan(80);
  }

  document.addEventListener('click',event=>{
    const message=event.target.closest?.('.admin-chat-message.is-unread[data-admin-message-id]');
    if(!message) return;
    if(event.target.closest?.('button,a,input,textarea,select,label')) return;
    const id=String(message.dataset.adminMessageId||'');
    if(id) markRead([id]);
  },true);

  document.addEventListener('scroll',()=>queueScan(),true);
  window.addEventListener('resize',()=>queueScan(),{passive:true});
  window.addEventListener('focus',()=>queueScan(80));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible') queueScan(80);
    else resetSeen();
  });

  client.auth.onAuthStateChange(handleAuthStateChange);
  refreshIdentity();

  channel=client.channel('portfolio-admin-read-enhancements')
    .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_messages'},()=>queueScan(100))
    .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_message_reads'},()=>queueScan(100))
    .subscribe();
})();
