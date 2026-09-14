(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const FILE_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const style=document.createElement('style');
  style.textContent=`
    .portfolio-file-row{position:relative;display:block}
    body.can-edit .portfolio-file-link{padding-right:52px}
    .portfolio-file-row:hover .portfolio-file-link,
    .portfolio-file-row:focus-within .portfolio-file-link{background:#f0f5f1;border-color:#b9cbbf}
    .portfolio-file-edit{position:absolute;right:6px;top:0;bottom:0;margin-block:auto;transform:translateX(4px);width:34px;height:34px;padding:0;border:1px solid #c8d8ce;border-radius:9px;background:#fff;color:#24513f;cursor:pointer;font-size:.95rem;line-height:1;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .14s ease,transform .14s ease,background .14s ease,border-color .14s ease}
    body.can-edit .portfolio-file-row:hover .portfolio-file-edit,
    body.can-edit .portfolio-file-row:focus-within .portfolio-file-edit{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(0)}
    .portfolio-file-edit:hover,.portfolio-file-edit:focus-visible{background:#e2ede6;border-color:#9fb8a8;outline:none}
    body:not(.can-edit) .portfolio-file-edit{display:none!important}
    .file-title-overlay,.file-delete-confirm-overlay{position:fixed;inset:0;z-index:3950;background:rgba(16,31,25,.58);display:grid;place-items:center;padding:24px}
    .file-title-dialog{width:min(480px,calc(100vw - 30px));background:#fff;border:1px solid #dce4df;border-radius:19px;box-shadow:0 28px 90px rgba(13,35,27,.35);overflow:hidden}
    .file-title-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .file-title-head strong{font-family:Georgia,serif;font-size:1.08rem}
    .file-title-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;cursor:pointer}
    .file-title-body{padding:18px;display:grid;gap:13px}
    .file-title-body label{display:grid;gap:6px;font-size:.79rem;font-weight:850;color:#405047}
    .file-title-body input{width:100%;padding:10px 11px;border:1px solid #ced9d2;border-radius:11px;background:#fff;font:inherit}
    .file-title-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
    .file-title-btn{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 13px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .file-title-btn.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .file-title-btn.danger{background:#a64037;color:#fff}
    .file-title-btn.danger:hover,.file-title-btn.danger:focus-visible{background:#8f332c;outline:none}
    .file-title-btn:disabled{opacity:.55;cursor:not-allowed}
    .file-title-message{min-height:1.3em;margin:0;color:#59665f;font-size:.78rem}
    .file-delete-confirm-overlay{z-index:3975;background:rgba(16,31,25,.66)}
    .file-delete-confirm{width:min(500px,calc(100vw - 34px));background:#fff;border:1px solid #ecd0cc;border-radius:19px;box-shadow:0 28px 90px rgba(13,35,27,.4);overflow:hidden}
    .file-delete-confirm-head{padding:16px 18px;background:#973c34;color:#fff;font-family:Georgia,serif;font-size:1.08rem;font-weight:800}
    .file-delete-confirm-body{padding:19px;display:grid;gap:15px}
    .file-delete-confirm-body p{margin:0;color:#4e5953;line-height:1.55;font-size:.88rem}
    .file-delete-confirm-body strong{color:#8e332c}
    .file-delete-confirm-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
  `;
  document.head.appendChild(style);

  const normalizeIds=value=>String(value||'').split(',').map(id=>id.trim().toLowerCase()).filter((id,index,all)=>FILE_ID.test(id)&&all.indexOf(id)===index);

  async function rowForButton(button){
    const category=button.dataset.viewFile;
    const index=Number(button.dataset.fileIndex)||0;
    const {data,error}=await client.from('portfolio_files')
      .select('id,title,category,storage_path,file_name,mime_type,sort_order,created_at')
      .eq('category',category)
      .order('sort_order',{ascending:true})
      .order('created_at',{ascending:true});
    if(error) throw error;
    return (data||[])[index]||null;
  }

  function removeReferenceFromHtml(value,fileId){
    const source=String(value||'');
    if(!source.includes(fileId)) return {changed:false,value:source};
    const doc=new DOMParser().parseFromString(`<div>${source}</div>`,'text/html');
    const root=doc.body.firstElementChild;
    let changed=false;
    root.querySelectorAll('a[data-portfolio-file-id],a[data-portfolio-file-ids]').forEach(link=>{
      const ids=normalizeIds(link.getAttribute('data-portfolio-file-ids')||link.getAttribute('data-portfolio-file-id')||'');
      if(!ids.includes(fileId)) return;
      changed=true;
      const remaining=ids.filter(id=>id!==fileId);
      if(!remaining.length){
        link.replaceWith(...link.childNodes);
        return;
      }
      link.setAttribute('data-portfolio-file-ids',remaining.join(','));
      link.setAttribute('data-portfolio-file-id',remaining[0]);
      link.removeAttribute('data-portfolio-file-category');
    });
    return {changed,value:changed?root.innerHTML:source};
  }

  function removeReferenceFromOpenEditors(fileId){
    document.querySelectorAll('.rich-editor').forEach(editor=>{
      let changed=false;
      editor.querySelectorAll('a[data-portfolio-file-id],a[data-portfolio-file-ids]').forEach(link=>{
        const ids=normalizeIds(link.dataset.portfolioFileIds||link.dataset.portfolioFileId||'');
        if(!ids.includes(fileId)) return;
        changed=true;
        const remaining=ids.filter(id=>id!==fileId);
        if(!remaining.length){
          link.replaceWith(...link.childNodes);
          return;
        }
        link.dataset.portfolioFileIds=remaining.join(',');
        link.dataset.portfolioFileId=remaining[0];
        delete link.dataset.portfolioFileCategory;
      });
      if(changed) editor.dispatchEvent(new Event('input',{bubbles:true}));
    });
  }

  async function removeSavedReferences(fileId){
    const {data,error}=await client.from('portfolio_content').select('id,value');
    if(error) throw error;
    const changed=[];
    (data||[]).forEach(row=>{
      const result=removeReferenceFromHtml(row.value,fileId);
      if(result.changed) changed.push({id:row.id,value:result.value});
    });
    for(const row of changed){
      const {error:updateError}=await client.from('portfolio_content').update({value:row.value}).eq('id',row.id);
      if(updateError) throw updateError;
    }
    try{
      if(typeof state!=='undefined' && state?.values){
        changed.forEach(row=>{state.values[row.id]=row.value;});
        state.updatedAt=new Date().toISOString();
        if(typeof STORAGE_KEY!=='undefined') localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
        if(typeof renderChapters==='function') renderChapters();
      }
    }catch(err){console.warn('Lokale portfolio-weergave kon niet direct worden bijgewerkt:',err)}
    removeReferenceFromOpenEditors(fileId);
    return changed.length;
  }

  function confirmDelete(row){
    return new Promise(resolve=>{
      const overlay=document.createElement('div');
      overlay.className='file-delete-confirm-overlay';
      overlay.innerHTML=`<section class="file-delete-confirm" role="alertdialog" aria-modal="true" aria-label="Document verwijderen">
        <div class="file-delete-confirm-head">Document verwijderen?</div>
        <div class="file-delete-confirm-body">
          <p><strong>Let op!</strong> Hiermee verwijder je het document uit de bibliotheek. Eventuele verwijzingen in de tekst worden verwijderd.</p>
          <div class="file-delete-confirm-actions">
            <button class="file-title-btn secondary" type="button" data-delete-cancel>Annuleren</button>
            <button class="file-title-btn danger" type="button" data-delete-confirm>Verwijderen</button>
          </div>
        </div>
      </section>`;
      document.body.appendChild(overlay);
      const finish=value=>{overlay.remove();resolve(value)};
      overlay.querySelector('[data-delete-cancel]')?.addEventListener('click',()=>finish(false));
      overlay.querySelector('[data-delete-confirm]')?.addEventListener('click',()=>finish(true));
      const keyHandler=e=>{if(e.key==='Escape'){document.removeEventListener('keydown',keyHandler);finish(false)}};
      document.addEventListener('keydown',keyHandler,{once:true});
    });
  }

  async function deleteDocument(row,message,editorOverlay){
    const approved=await confirmDelete(row);
    if(!approved) return;
    const buttons=[...editorOverlay.querySelectorAll('button')];
    buttons.forEach(button=>button.disabled=true);
    message.textContent='Document en verwijzingen verwijderen…';
    try{
      await removeSavedReferences(String(row.id).toLowerCase());

      const {error:metadataError}=await client.from('portfolio_files').delete().eq('id',row.id);
      if(metadataError) throw metadataError;

      if(row.storage_path){
        const {error:storageError}=await client.storage.from(BUCKET).remove([row.storage_path]);
        if(storageError) throw new Error(`Het document is uit de bibliotheek verwijderd, maar het bestand kon niet uit de opslag worden verwijderd: ${storageError.message}`);
      }

      message.textContent='Document verwijderd.';
      await window.portfolioFiles?.reload?.();
      setTimeout(()=>editorOverlay.remove(),300);
    }catch(err){
      console.error('Document verwijderen mislukt:',err);
      message.textContent='Verwijderen mislukt: '+(err?.message||'onbekende fout');
      buttons.forEach(button=>button.disabled=false);
    }
  }

  function openEditor(button){
    if(!document.body.classList.contains('can-edit')) return;
    rowForButton(button).then(row=>{
      if(!row) return;
      const overlay=document.createElement('div');
      overlay.className='file-title-overlay';
      overlay.innerHTML=`<section class="file-title-dialog" role="dialog" aria-modal="true" aria-label="Document bewerken">
        <header class="file-title-head"><strong>Bewerken</strong><button class="file-title-close" type="button" aria-label="Sluiten">×</button></header>
        <div class="file-title-body">
          <label>Titel<input type="text" maxlength="200" data-title-input></label>
          <p class="file-title-message" data-title-message></p>
          <div class="file-title-actions">
            <button class="file-title-btn danger" type="button" data-title-delete>Verwijderen</button>
            <button class="file-title-btn secondary" type="button" data-title-cancel>Annuleren</button>
            <button class="file-title-btn" type="button" data-title-save>Opslaan</button>
          </div>
        </div>
      </section>`;
      document.body.appendChild(overlay);
      const input=overlay.querySelector('[data-title-input]');
      const message=overlay.querySelector('[data-title-message]');
      input.value=row.title||'';
      input.focus();
      input.select();
      const close=()=>overlay.remove();
      overlay.querySelector('.file-title-close')?.addEventListener('click',close);
      overlay.querySelector('[data-title-cancel]')?.addEventListener('click',close);
      overlay.querySelector('[data-title-delete]')?.addEventListener('click',()=>deleteDocument(row,message,overlay));
      overlay.querySelector('[data-title-save]')?.addEventListener('click',async()=>{
        const title=input.value.trim();
        if(!title){message.textContent='Vul een titel in.';return;}
        message.textContent='Titel opslaan…';
        const {error}=await client.from('portfolio_files').update({title}).eq('id',row.id);
        if(error){message.textContent='Opslaan mislukt: '+error.message;return;}
        message.textContent='Titel aangepast.';
        await window.portfolioFiles?.reload?.();
        setTimeout(close,250);
      });
      input.addEventListener('keydown',e=>{
        if(e.key==='Enter'){e.preventDefault();overlay.querySelector('[data-title-save]')?.click();}
        else if(e.key==='Escape') close();
      });
    }).catch(err=>console.error('Document laden mislukt:',err));
  }

  function enhance(){
    document.querySelectorAll('.portfolio-file-link').forEach(link=>{
      if(link.dataset.titleEditEnhanced) return;
      link.dataset.titleEditEnhanced='1';
      const row=document.createElement('div');
      row.className='portfolio-file-row';
      link.parentNode.insertBefore(row,link);
      row.appendChild(link);
      const edit=document.createElement('button');
      edit.type='button';
      edit.className='portfolio-file-edit';
      edit.setAttribute('aria-label','Bewerken');
      edit.title='Bewerken';
      edit.textContent='✎';
      edit.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        openEditor(link);
      });
      row.appendChild(edit);
    });
  }

  enhance();
  new MutationObserver(()=>enhance()).observe(document.body,{childList:true,subtree:true});
})();