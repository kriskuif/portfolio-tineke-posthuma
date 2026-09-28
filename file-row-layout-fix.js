(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);

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

    .office-aware-viewer{z-index:4060}
    .office-aware-viewer .file-paper.office-online-paper{
      width:min(100%,900px);
      height:100%;
      min-height:100%;
      aspect-ratio:auto;
      overflow:hidden;
      background:#fff;
    }
    .office-aware-viewer .office-online-frame{
      display:block;
      width:100%;
      height:100%;
      min-height:100%;
      border:0;
      background:#fff;
    }
    .office-aware-viewer.single-file .file-nav-arrow,
    .office-aware-viewer.single-file .file-viewer-count{display:none!important}
    .office-aware-viewer .office-viewer-error{
      min-height:420px;
      display:grid;
      place-items:center;
      padding:28px;
      text-align:center;
      color:#536159;
      background:#fff;
    }
    .office-aware-viewer .office-viewer-error a{color:#1f5e4a;font-weight:850}
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>c==='&'?'&amp;':c==='<'?'&lt;':c==='>'?'&gt;':c==='"'?'&quot;':'&#39;');
  const ext=item=>{
    const name=String(item?.file_name||item?.storage_path||'');
    return (name.split('.').pop()||'').toLowerCase();
  };
  const publicUrl=item=>client?.storage.from(BUCKET).getPublicUrl(item.storage_path).data.publicUrl||'';
  const isOffice=item=>['doc','docx','xls','xlsx','ppt','pptx'].includes(ext(item));
  const isImage=item=>String(item?.mime_type||'').toLowerCase().startsWith('image/')||['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext(item));
  const isPdf=item=>String(item?.mime_type||'').toLowerCase()==='application/pdf'||ext(item)==='pdf';
  const isText=item=>String(item?.mime_type||'').toLowerCase().startsWith('text/')||['txt','html','htm'].includes(ext(item));

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

  function renderItem(item,paper){
    const url=publicUrl(item);
    paper.className='file-paper';
    if(isOffice(item)){
      const officeUrl=`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      paper.classList.add('office-online-paper');
      paper.innerHTML=`<iframe class="office-online-frame" src="${esc(officeUrl)}" title="${esc(item.title||item.file_name||'Document')}"></iframe>`;
      return;
    }
    if(isImage(item)){
      paper.innerHTML=`<img src="${esc(url)}" alt="${esc(item.title||item.file_name||'Afbeelding')}">`;
      return;
    }
    if(isPdf(item)){
      paper.innerHTML=`<iframe src="${esc(url)}#view=FitH" title="${esc(item.title||item.file_name||'PDF')}"></iframe>`;
      return;
    }
    if(isText(item)){
      paper.innerHTML=`<iframe src="${esc(url)}" title="${esc(item.title||item.file_name||'Document')}"></iframe>`;
      return;
    }
    paper.innerHTML=`<div class="office-viewer-error"><div><p>Dit bestandstype kan niet rechtstreeks in het portfolio worden weergegeven.</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Bestand openen</a></p></div></div>`;
  }

  function openViewer(items,startIndex=0){
    if(!items.length) return;
    document.querySelectorAll('.office-aware-viewer,.linked-file-viewer,.file-viewer-overlay').forEach(node=>node.remove());
    let current=((startIndex%items.length)+items.length)%items.length;
    const overlay=document.createElement('div');
    overlay.className=`file-viewer-overlay office-aware-viewer${items.length===1?' single-file':''}`;
    overlay.innerHTML=`
      <button class="file-nav-arrow prev" type="button" aria-label="Vorig bestand">‹</button>
      <section class="file-viewer-card" role="dialog" aria-modal="true">
        <header class="file-viewer-head"><strong data-office-title></strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header>
        <div class="file-viewer-stage"><div class="file-paper" data-office-paper></div></div>
        <span class="file-viewer-count" data-office-count></span>
      </section>
      <button class="file-nav-arrow next" type="button" aria-label="Volgend bestand">›</button>`;
    document.body.appendChild(overlay);

    const render=()=>{
      const item=items[current];
      overlay.querySelector('[data-office-title]').textContent=item.title||item.file_name||'Document';
      overlay.querySelector('[data-office-count]').textContent=`${current+1} / ${items.length}`;
      renderItem(item,overlay.querySelector('[data-office-paper]'));
      const stage=overlay.querySelector('.file-viewer-stage');
      if(stage) stage.scrollTop=0;
    };
    const move=delta=>{current=(current+delta+items.length)%items.length;render();};
    const close=()=>{document.removeEventListener('keydown',keyHandler);overlay.remove();};
    const keyHandler=e=>{
      if(e.key==='Escape') close();
      else if(items.length>1&&e.key==='ArrowLeft') move(-1);
      else if(items.length>1&&e.key==='ArrowRight') move(1);
    };
    overlay.querySelector('.prev')?.addEventListener('click',()=>move(-1));
    overlay.querySelector('.next')?.addEventListener('click',()=>move(1));
    overlay.querySelector('.file-viewer-close')?.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    document.addEventListener('keydown',keyHandler);
    render();
  }

  async function rowsForCategory(category){
    if(!client) return [];
    const {data,error}=await client.from('portfolio_files')
      .select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at')
      .eq('category',category)
      .order('sort_order',{ascending:true})
      .order('created_at',{ascending:true});
    if(error) throw error;
    return data||[];
  }

  async function rowsForIds(ids){
    if(!client||!ids.length) return [];
    const {data,error}=await client.from('portfolio_files')
      .select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at')
      .in('id',ids);
    if(error) throw error;
    const byId=new Map((data||[]).map(row=>[String(row.id).toLowerCase(),row]));
    return ids.map(id=>byId.get(id)).filter(Boolean);
  }

  function showLoadError(message){
    const overlay=document.createElement('div');
    overlay.className='file-viewer-overlay office-aware-viewer single-file';
    overlay.innerHTML=`<section class="file-viewer-card" role="dialog" aria-modal="true"><header class="file-viewer-head"><strong>Document openen</strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header><div class="file-viewer-stage"><div class="file-paper"><div class="office-viewer-error"><p>${esc(message)}</p></div></div></div></section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.file-viewer-close')?.addEventListener('click',()=>overlay.remove());
  }

  document.addEventListener('click',event=>{
    const linked=event.target.closest?.('a[data-portfolio-file-id],a[data-portfolio-file-ids]');
    const fileButton=event.target.closest?.('.portfolio-file-link[data-view-file]');
    if(linked&&linked.closest('.rich-editor')) return;
    if(!linked&&!fileButton) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    (async()=>{
      try{
        if(linked){
          const raw=linked.dataset.portfolioFileIds||linked.dataset.portfolioFileId||'';
          const ids=raw.split(',').map(id=>id.trim().toLowerCase()).filter(Boolean);
          const items=await rowsForIds(ids);
          if(!items.length) throw new Error('Het gekoppelde bestand bestaat niet meer.');
          openViewer(items,0);
          return;
        }
        const category=fileButton.dataset.viewFile;
        const index=Number(fileButton.dataset.fileIndex)||0;
        const items=await rowsForCategory(category);
        if(!items.length) throw new Error('Het bestand kon niet worden gevonden.');
        openViewer(items,index);
      }catch(err){
        console.error('Portfolio-document openen mislukt:',err);
        showLoadError(err?.message||'Het document kon niet worden geladen.');
      }
    })();
  },true);

  enhance();
  new MutationObserver(()=>enhance()).observe(document.body,{childList:true,subtree:true});
})();
