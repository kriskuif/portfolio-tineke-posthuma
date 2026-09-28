(() => {
  const style = document.createElement('style');
  style.textContent = `
    .portfolio-file-list{
      align-content:start !important;
      grid-auto-rows:max-content !important;
    }
    .portfolio-file-row{
      align-self:start !important;
      height:max-content !important;
    }
    body.can-edit .portfolio-file-link{
      padding-right:92px !important;
    }
    body.can-edit .portfolio-file-edit{
      right:46px !important;
    }
    .portfolio-file-delete{
      position:absolute;
      right:6px;
      top:0;
      bottom:0;
      margin-block:auto;
      width:34px;
      height:34px;
      padding:0;
      border:1px solid #d7dfda;
      border-radius:9px;
      background:#fff;
      color:#75635d;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      opacity:.76;
      transition:opacity .14s ease,background .14s ease,border-color .14s ease,color .14s ease,transform .14s ease;
    }
    .portfolio-file-delete svg{width:16px;height:16px;pointer-events:none}
    .portfolio-file-delete:hover,.portfolio-file-delete:focus-visible{
      opacity:1;
      background:#f8eeec;
      border-color:#d9b6b0;
      color:#93453d;
      outline:none;
      transform:translateY(-1px);
    }
    body:not(.can-edit) .portfolio-file-delete{display:none!important}
  `;
  document.head.appendChild(style);

  function openDeleteFlow(row,editButton){
    const observer=new MutationObserver(()=>{
      const editor=document.querySelector('.file-title-overlay');
      const deleteAction=editor?.querySelector('[data-title-delete]');
      if(!editor||!deleteAction) return;
      observer.disconnect();
      deleteAction.click();
      const confirm=document.querySelector('.file-delete-confirm-overlay');
      confirm?.querySelector('[data-delete-cancel]')?.addEventListener('click',()=>{
        setTimeout(()=>editor.remove(),0);
      },{once:true});
    });
    observer.observe(document.body,{childList:true,subtree:true});
    editButton.click();
    setTimeout(()=>observer.disconnect(),2500);
  }

  function enhance(){
    document.querySelectorAll('.portfolio-file-row').forEach(row=>{
      if(row.querySelector('.portfolio-file-delete')) return;
      const editButton=row.querySelector('.portfolio-file-edit');
      if(!editButton) return;
      const button=document.createElement('button');
      button.type='button';
      button.className='portfolio-file-delete';
      button.setAttribute('aria-label','Bestand verwijderen');
      button.title='Bestand verwijderen';
      button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6m-9 3h12m-10 0 .7 12h6.6L16 7M10 10v6m4-6v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      button.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        if(!document.body.classList.contains('can-edit')) return;
        openDeleteFlow(row,editButton);
      });
      row.appendChild(button);
    });
  }

  enhance();
  new MutationObserver(()=>enhance()).observe(document.body,{childList:true,subtree:true});
})();
