(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const messageInfo=new Map();
  let refreshTimer=null;
  let refreshing=false;

  const style=document.createElement('style');
  style.textContent=`
    .admin-chat-message,
    .admin-chat-message.own{
      align-self:stretch!important;
      max-width:none!important;
      display:grid!important;
      grid-template-columns:minmax(0,1fr) auto!important;
      gap:2px 6px!important;
      padding:6px 2px!important;
      border:0!important;
      border-bottom:1px solid rgba(85,110,98,.09)!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:#35473e!important;
    }
    .admin-chat-message:last-child{border-bottom:0!important}
    .admin-chat-message p{
      grid-column:1/-1;
      margin:0!important;
      white-space:pre-wrap!important;
      overflow-wrap:anywhere;
      font-size:.78rem!important;
      line-height:1.45!important;
    }
    .admin-chat-author{font-weight:900;color:#24513f}
    .admin-chat-meta{
      grid-column:1/-1;
      margin:0!important;
      display:flex!important;
      align-items:center!important;
      min-height:1.15em;
      color:#87938d!important;
      font-size:.6rem!important;
      line-height:1.2!important;
      font-weight:650!important;
    }
    .admin-chat-meta>span{display:none!important}
    .admin-chat-meta>time{display:inline!important}
    .admin-chat-delete{margin-left:auto!important;padding:0 3px!important;line-height:1.2!important}
    .admin-ribbon-notes .admin-chat-author{color:#fff}
    .admin-ribbon-notes .admin-chat-meta{color:rgba(255,255,255,.58)!important}
    .admin-ribbon-notes .admin-chat-message{border-bottom-color:rgba(255,255,255,.09)!important}
  `;
  document.head.appendChild(style);

  async function refreshInfo(){
    if(refreshing || !document.body.classList.contains('can-edit')) return;
    refreshing=true;
    try{
      const {data,error}=await client.from('portfolio_admin_messages').select('id,author_name,created_at');
      if(error) throw error;
      messageInfo.clear();
      (data||[]).forEach(row=>messageInfo.set(String(row.id),{
        name:String(row.author_name||'Beheerder').trim()||'Beheerder',
        createdAt:row.created_at
      }));
      decorate();
    }catch(err){
      console.error('Beheerdernamen laden mislukt:',err);
    }finally{
      refreshing=false;
    }
  }

  function formatTime(value){
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('nl-NL',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  }

  function decorate(){
    document.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(message=>{
      const info=messageInfo.get(message.dataset.adminMessageId);
      const p=message.querySelector(':scope > p');
      if(!p || !info) return;

      let author=p.querySelector(':scope > .admin-chat-author');
      if(!author){
        author=document.createElement('strong');
        author.className='admin-chat-author';
        p.prepend(author);
      }
      author.textContent=`${info.name}: `;

      const time=message.querySelector('.admin-chat-meta time');
      if(time){
        const formatted=formatTime(info.createdAt);
        if(formatted) time.textContent=formatted;
      }
    });
  }

  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{
      const unknown=[...document.querySelectorAll('.admin-chat-message[data-admin-message-id]')]
        .some(el=>!messageInfo.has(el.dataset.adminMessageId));
      if(unknown) refreshInfo();
      else decorate();
    },60);
  }

  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList')) scheduleRefresh();
    if(records.some(record=>record.type==='attributes'&&record.target===document.body) && document.body.classList.contains('can-edit')) refreshInfo();
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  window.addEventListener('portfolio-admin-display-name-changed',()=>refreshInfo());
  client.auth.onAuthStateChange(()=>setTimeout(refreshInfo,0));
  refreshInfo();
})();