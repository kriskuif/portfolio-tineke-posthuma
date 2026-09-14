(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const names=new Map();
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
      gap:1px 6px!important;
      padding:5px 2px!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:#35473e!important;
    }
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
      font-size:.61rem!important;
      line-height:1.2!important;
    }
    .admin-chat-meta>span{display:none!important}
    .admin-chat-meta>time{display:inline!important}
    .admin-chat-delete{margin-left:auto!important;padding:0 3px!important;line-height:1.2!important}
  `;
  document.head.appendChild(style);

  async function refreshNames(){
    if(refreshing || !document.body.classList.contains('can-edit')) return;
    refreshing=true;
    try{
      const {data,error}=await client.from('portfolio_admin_messages').select('id,author_name');
      if(error) throw error;
      names.clear();
      (data||[]).forEach(row=>names.set(String(row.id),String(row.author_name||'Beheerder').trim()||'Beheerder'));
      decorate();
    }catch(err){
      console.error('Namen van beheerdernotities laden mislukt:',err);
    }finally{
      refreshing=false;
    }
  }

  function decorate(){
    document.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(message=>{
      const id=message.dataset.adminMessageId;
      const name=names.get(id);
      const p=message.querySelector(':scope > p');
      if(!p || !name) return;
      let author=p.querySelector(':scope > .admin-chat-author');
      if(!author){
        author=document.createElement('strong');
        author.className='admin-chat-author';
        p.prepend(author);
      }
      author.textContent=`${name}: `;
    });
  }

  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{
      const unknown=[...document.querySelectorAll('.admin-chat-message[data-admin-message-id]')]
        .some(el=>!names.has(el.dataset.adminMessageId));
      if(unknown) refreshNames();
      else decorate();
    },80);
  }

  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList')) scheduleRefresh();
    if(records.some(record=>record.type==='attributes'&&record.target===document.body)){
      if(document.body.classList.contains('can-edit')) refreshNames();
    }
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  client.auth.onAuthStateChange(()=>setTimeout(refreshNames,0));
  refreshNames();
})();