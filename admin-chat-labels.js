(() => {
  const SECTION_LABEL='Vragen / opmerkingen over dit onderdeel';
  const RIBBON_LABEL='Vragen / opmerkingen over het lint';

  function applyLabels(root=document){
    root.querySelectorAll?.('.admin-section-chat .admin-chat-head strong').forEach(el=>{
      if(el.textContent!==SECTION_LABEL) el.textContent=SECTION_LABEL;
    });
    root.querySelectorAll?.('.admin-ribbon-notes .admin-chat-head strong').forEach(el=>{
      if(el.textContent!==RIBBON_LABEL) el.textContent=RIBBON_LABEL;
    });
  }

  applyLabels();
  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList')) applyLabels();
  }).observe(document.body,{childList:true,subtree:true});
})();