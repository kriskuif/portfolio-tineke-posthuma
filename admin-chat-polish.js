(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);

  const messageInfo=new Map();
  let refreshPromise=null;
  let healTimer=null;

  const style=document.createElement('style');
  style.textContent=`
    body.can-edit.admin-notes-visible main{
      width:calc(100% - 4px)!important;
      max-width:none!important;
      margin-left:4px!important;
      margin-right:0!important;
    }
    body.can-edit.admin-notes-visible .admin-chat-host{
      padding-right:calc(var(--admin-chat-width) + var(--admin-chat-gap) + 8px)!important;
    }
    body.can-edit.admin-notes-visible .admin-section-chat{
      right:8px!important;
    }
    .admin-chat-host{--admin-chat-gap:10px!important}
    .admin-chat-head strong{
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      line-height:1.2!important;
    }
    .admin-chat-count:empty{display:none!important}

    .admin-ribbon-notes .admin-chat-messages{
      background:#e7f1ea!important;
      color:#35473e!important;
    }
    .admin-ribbon-notes .admin-chat-empty{color:#6f7f77!important}
    .admin-ribbon-notes .admin-chat-message,
    .admin-ribbon-notes .admin-chat-message.own{
      color:#35473e!important;
      background:transparent!important;
      border-color:transparent!important;
    }
    .admin-chat-author{font-weight:900;color:#24513f}
    .admin-ribbon-notes .admin-chat-author{color:#174838!important}
    .admin-ribbon-notes .admin-chat-meta{color:#7c8982!important}

    @media(max-width:930px){
      body.can-edit.admin-notes-visible main{
        width:min(100% - 24px,1180px)!important;
        margin:0 auto!important;
      }
      body.can-edit.admin-notes-visible .admin-chat-host{
        padding-right:var(--admin-host-pad)!important;
      }
      body.can-edit.admin-notes-visible .admin-section-chat{right:auto!important}
    }
  `;
  document.head.appendChild(style);

  function formatTime(value){
    const date=new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('nl-NL',{
      day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'
    });
  }

  function decorateMessages(){
    let missingInfo=false;
    document.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(message=>{
      const id=String(message.dataset.adminMessageId||'');
      const info=messageInfo.get(id);
      if(!info){
        missingInfo=true;
        return;
      }

      const p=message.querySelector(':scope > p');
      if(p){
        let author=p.querySelector(':scope > .admin-chat-author');
        if(!author){
          author=document.createElement('strong');
          author.className='admin-chat-author';
          p.prepend(author);
        }
        const wanted=`${info.name}: `;
        if(author.textContent!==wanted) author.textContent=wanted;
      }

      const time=message.querySelector('.admin-chat-meta time');
      if(time){
        const wanted=formatTime(info.createdAt);
        if(wanted && time.textContent!==wanted) time.textContent=wanted;
      }
    });
    return missingInfo;
  }

  function polish(){
    document.querySelectorAll('.admin-chat-panel').forEach(panel=>{
      const title=panel.querySelector('.admin-chat-head strong');
      if(title && title.textContent!=='Vragen / opmerkingen / notities'){
        title.textContent='Vragen / opmerkingen / notities';
      }
      const count=panel.querySelector('.admin-chat-count');
      if(count && count.textContent.trim().toLowerCase()==='nog leeg'){
        count.textContent='';
      }
    });
    return decorateMessages();
  }

  async function refreshInfo(){
    if(!client || !document.body.classList.contains('can-edit')) return;
    if(refreshPromise) return refreshPromise;
    refreshPromise=(async()=>{
      try{
        const {data,error}=await client.from('portfolio_admin_messages')
          .select('id,author_name,created_at');
        if(error) throw error;
        messageInfo.clear();
        (data||[]).forEach(row=>{
          const name=String(row.author_name||'Beheerder').trim()||'Beheerder';
          messageInfo.set(String(row.id),{name,createdAt:row.created_at});
        });
        polish();
      }catch(error){
        console.error('Beheerdernamen laden mislukt:',error);
      }finally{
        refreshPromise=null;
      }
    })();
    return refreshPromise;
  }

  function heal(){
    const missing=polish();
    if(missing) refreshInfo();

    requestAnimationFrame(()=>{
      const stillMissing=polish();
      if(stillMissing) refreshInfo();
    });

    clearTimeout(healTimer);
    healTimer=setTimeout(()=>{
      const stillMissing=polish();
      if(stillMissing) refreshInfo();
    },90);
  }

  const observer=new MutationObserver(records=>{
    const relevant=records.some(record=>
      record.type==='childList' ||
      (record.type==='attributes' && record.target===document.body)
    );
    if(relevant) heal();
  });
  observer.observe(document.body,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class']
  });

  window.addEventListener('focus',()=>{
    heal();
    setTimeout(refreshInfo,40);
  });
  window.addEventListener('pageshow',()=>{
    heal();
    setTimeout(refreshInfo,40);
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'){
      heal();
      setTimeout(refreshInfo,40);
      setTimeout(heal,180);
    }
  });
  window.addEventListener('portfolio-admin-display-name-changed',()=>{
    refreshInfo();
    setTimeout(heal,50);
  });

  if(client){
    client.auth.onAuthStateChange(()=>{
      setTimeout(refreshInfo,0);
      setTimeout(heal,80);
    });
  }

  heal();
  refreshInfo();
})();