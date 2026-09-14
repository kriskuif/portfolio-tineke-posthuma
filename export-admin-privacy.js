(() => {
  window.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-export-html],[data-export-word],[data-export-pdf]');
    if(!trigger) return;

    const records=[];
    document.querySelectorAll('.admin-chat-panel,.admin-notes-toggle').forEach(node=>{
      const marker=document.createComment('beheerinhoud niet exporteren');
      records.push({node,marker,parent:node.parentNode});
      node.replaceWith(marker);
    });

    setTimeout(()=>{
      records.forEach(({node,marker,parent})=>{
        if(!marker.isConnected) return;
        if(node.classList?.contains('admin-section-chat')){
          const key=node.dataset.adminChatKey;
          parent?.querySelectorAll?.(':scope > .admin-section-chat').forEach(other=>{
            if(other!==node && other.dataset.adminChatKey===key) other.remove();
          });
        }else if(node.classList?.contains('admin-ribbon-notes')){
          parent?.querySelectorAll?.(':scope > .admin-ribbon-notes').forEach(other=>{if(other!==node) other.remove();});
        }else if(node.classList?.contains('admin-notes-toggle')){
          parent?.querySelectorAll?.(':scope > .admin-notes-toggle').forEach(other=>{if(other!==node) other.remove();});
        }
        marker.replaceWith(node);
      });
    },0);
  },true);
})();