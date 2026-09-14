(() => {
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
    .admin-chat-host{
      --admin-chat-gap:10px!important;
    }
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
    .admin-ribbon-notes .admin-chat-empty{
      color:#6f7f77!important;
    }
    .admin-ribbon-notes .admin-chat-message,
    .admin-ribbon-notes .admin-chat-message.own{
      color:#35473e!important;
      background:transparent!important;
      border-color:transparent!important;
    }
    .admin-ribbon-notes .admin-chat-author{
      color:#174838!important;
    }
    .admin-ribbon-notes .admin-chat-meta{
      color:#7c8982!important;
    }

    @media(max-width:930px){
      body.can-edit.admin-notes-visible main{
        width:min(100% - 24px,1180px)!important;
        margin:0 auto!important;
      }
      body.can-edit.admin-notes-visible .admin-chat-host{
        padding-right:var(--admin-host-pad)!important;
      }
      body.can-edit.admin-notes-visible .admin-section-chat{
        right:auto!important;
      }
    }
  `;
  document.head.appendChild(style);

  function polish(){
    document.querySelectorAll('.admin-chat-panel').forEach(panel=>{
      const title=panel.querySelector('.admin-chat-head strong');
      if(title) title.textContent='Vragen / opmerkingen / notities';
      const count=panel.querySelector('.admin-chat-count');
      if(count && count.textContent.trim().toLowerCase()==='nog leeg') count.textContent='';
    });
  }

  polish();
  new MutationObserver(()=>polish()).observe(document.body,{childList:true,subtree:true,characterData:true});
})();