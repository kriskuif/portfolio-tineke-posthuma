(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const style=document.createElement('style');
  style.textContent=`
    .portfolio-file-row{position:relative;display:block}
    body.can-edit .portfolio-file-link{padding-right:52px}
    .portfolio-file-row:hover .portfolio-file-link,
    .portfolio-file-row:focus-within .portfolio-file-link{background:#f0f5f1;border-color:#b9cbbf}
    .portfolio-file-edit{position:absolute;right:6px;top:50%;transform:translateY(-50%) translateX(4px);width:34px;height:34px;border:1px solid #c8d8ce;border-radius:9px;background:#fff;color:#24513f;cursor:pointer;font-size:.95rem;display:grid;place-items:center;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .14s ease,transform .14s ease,background .14s ease,border-color .14s ease}
    body.can-edit .portfolio-file-row:hover .portfolio-file-edit,
    body.can-edit .portfolio-file-row:focus-within .portfolio-file-edit{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(-50%) translateX(0)}
    .portfolio-file-edit:hover,.portfolio-file-edit:focus-visible{background:#e2ede6;border-color:#9fb8a8;outline:none}
    body:not(.can-edit) .portfolio-file-edit{display:none!important}
    .file-title-overlay{position:fixed;inset:0;z-index:3950;background:rgba(16,31,25,.58);display:grid;place-items:center;padding:24px}
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
    .file-title-message{min-height:1.3em;margin:0;color:#59665f;font-size:.78rem}
  `;
  document.head.appendChild(style);

  async function rowForButton(button){
    const category=button.dataset.viewFile;
    const index=Number(button.dataset.fileIndex)||0;
    const {data,error}=await client.from('portfolio_files')
      .select('id,title,category,sort_order,created_at')
      .eq('category',category)
      .order('sort_order',{ascending:true})
      .order('created_at',{ascending:true});
    if(error) throw error;
    return (data||[])[index]||null;
  }

  function openTitleEditor(button){
    if(!document.body.classList.contains('can-edit')) return;
    rowForButton(button).then(row=>{
      if(!row) return;
      const overlay=document.createElement('div');
      overlay.className='file-title-overlay';
      overlay.innerHTML=`<section class="file-title-dialog" role="dialog" aria-modal="true" aria-label="Titel aanpassen">
        <header class="file-title-head"><strong>Titel aanpassen</strong><button class="file-title-close" type="button" aria-label="Sluiten">×</button></header>
        <div class="file-title-body">
          <label>Titel<input type="text" maxlength="200" data-title-input></label>
          <p class="file-title-message" data-title-message></p>
          <div class="file-title-actions"><button class="file-title-btn secondary" type="button" data-title-cancel>Annuleren</button><button class="file-title-btn" type="button" data-title-save>Opslaan</button></div>
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
    }).catch(err=>console.error('Titel laden mislukt:',err));
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
      edit.setAttribute('aria-label','Titel aanpassen');
      edit.title='Titel aanpassen';
      edit.textContent='✎';
      edit.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        openTitleEditor(link);
      });
      row.appendChild(edit);
    });
  }

  enhance();
  new MutationObserver(()=>enhance()).observe(document.body,{childList:true,subtree:true});
})();