(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const FILE_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const JSZIP_SRC='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const DOCX_PREVIEW_SRC='https://cdn.jsdelivr.net/npm/docx-preview@0.4.1/dist/docx-preview.min.js';
  const LEGACY_CATEGORY_MAP={
    evidence:'Bijlage',
    attachment:'Bijlage',
    feedback:'Feedback',
    lessonprep:'Lesvoorbereiding'
  };
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;
  let docxLibraryPromise=null;
  let chooserSequence=0;

  const style=document.createElement('style');
  style.textContent=`
    .text-file-link-overlay{position:fixed;inset:0;z-index:4050;background:rgba(16,31,25,.58);display:grid;place-items:center;padding:24px}
    .text-file-link-dialog{width:min(620px,calc(100vw - 30px));max-height:min(84vh,780px);display:flex;flex-direction:column;background:#fff;border:1px solid #dce4df;border-radius:19px;box-shadow:0 28px 90px rgba(13,35,27,.35);overflow:hidden}
    .text-file-link-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .text-file-link-head strong{font-family:Georgia,serif;font-size:1.08rem}
    .text-file-link-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;cursor:pointer}
    .text-file-link-body{padding:17px;overflow:auto;display:grid;gap:15px}
    .text-file-link-intro{margin:0;color:#5d6963;font-size:.84rem;line-height:1.55}
    .text-file-link-note{margin:-4px 0 0;padding:9px 11px;border-left:3px solid #7fa18f;border-radius:7px;background:#f1f6f2;color:#4d6257;font-size:.78rem}
    .text-file-link-selection{margin:0;padding:9px 11px;border-radius:10px;background:#f2f6f3;color:#294f40;font-size:.8rem;overflow-wrap:anywhere}
    .text-file-link-group{display:grid;gap:7px}
    .text-file-link-group h4{margin:0 0 2px;font-size:.82rem;color:#405047;text-transform:uppercase;letter-spacing:.06em}
    .text-file-choice{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;width:100%;padding:10px 11px;border:1px solid #dce5df;border-radius:11px;background:#fff;color:#24513f;text-align:left;font:inherit;font-weight:800;cursor:pointer}
    .text-file-choice:hover,.text-file-choice:focus-within{background:#edf4ef;border-color:#aec4b6;outline:none}
    .text-file-choice:has(input:checked){background:#e9f2ec;border-color:#9ebaa8}
    .text-file-choice input{width:17px;height:17px;accent-color:#1f5e4a;cursor:pointer}
    .text-file-choice span{overflow-wrap:anywhere}
    .text-file-link-empty{margin:0;color:#8b9690;font-style:italic;font-size:.82rem}
    .text-file-link-actions{position:sticky;bottom:-17px;display:flex;justify-content:flex-end;gap:8px;margin:2px -17px -17px;padding:13px 17px;background:linear-gradient(to bottom,rgba(255,255,255,.92),#fff 30%);border-top:1px solid #edf1ee}
    .text-file-link-btn{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 13px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .text-file-link-btn.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .text-file-link-btn.danger{background:#fff1ef;color:#8b3e35;border:1px solid #efd1cd}
    .text-file-link-btn:disabled{opacity:.45;cursor:not-allowed}
    .linked-file-viewer .file-viewer-card{width:min(92vw,880px)}
    .linked-file-viewer.single-linked-file .file-viewer-count,.linked-file-viewer.single-linked-file .file-nav-arrow{display:none!important}
    .linked-file-viewer .file-paper.docx-paper{width:min(100%,780px);min-height:100%;aspect-ratio:auto;background:transparent;box-shadow:none;overflow:visible}
    .linked-file-viewer .docx-preview-host{width:100%;min-height:100%}
    .linked-file-viewer .docx-preview-host .docx-wrapper{background:transparent!important;padding:0!important;display:grid;gap:14px}
    .linked-file-viewer .docx-preview-host section.docx{margin:0 auto!important;box-shadow:0 5px 24px rgba(24,39,32,.18)!important}
    .linked-file-viewer .docx-preview-loading,.linked-file-viewer .docx-preview-error{width:100%;min-height:420px;display:grid;place-items:center;background:#fff;color:#607068;text-align:center;padding:30px;box-shadow:0 5px 24px rgba(24,39,32,.14)}
    .linked-file-viewer .docx-preview-error a{color:#1f5e4a;font-weight:850}
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const publicUrl=path=>client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const normalizeIds=value=>String(value||'').split(',').map(id=>id.trim().toLowerCase()).filter((id,index,all)=>FILE_ID.test(id)&&all.indexOf(id)===index);
  const fileExt=item=>String(item?.file_name||'').split('.').pop().toLowerCase();
  const isDocx=item=>String(item?.mime_type||'').toLowerCase()===DOCX_MIME||fileExt(item)==='docx'||/\.docx$/i.test(String(item?.storage_path||''));
  const normalizeCategory=value=>{
    const raw=String(value||'').trim();
    return LEGACY_CATEGORY_MAP[raw.toLowerCase()]||raw||'Overig';
  };
  const compareCategories=(a,b)=>String(a).localeCompare(String(b),'nl',{sensitivity:'base'});

  function loadExternalScript(src,test){
    if(test()) return Promise.resolve();
    const existing=[...document.scripts].find(script=>script.src===src);
    if(existing){
      return new Promise((resolve,reject)=>{
        if(test()){resolve();return;}
        existing.addEventListener('load',()=>test()?resolve():reject(new Error('Bibliotheek is niet beschikbaar.')),{once:true});
        existing.addEventListener('error',()=>reject(new Error('Bibliotheek kon niet worden geladen.')),{once:true});
      });
    }
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.onload=()=>test()?resolve():reject(new Error('Bibliotheek is niet beschikbaar.'));
      script.onerror=()=>reject(new Error('Bibliotheek kon niet worden geladen.'));
      document.head.appendChild(script);
    });
  }

  async function ensureDocxLibrary(){
    if(window.docx?.renderAsync) return window.docx;
    if(docxLibraryPromise) return docxLibraryPromise;
    docxLibraryPromise=(async()=>{
      await loadExternalScript(JSZIP_SRC,()=>!!window.JSZip);
      await loadExternalScript(DOCX_PREVIEW_SRC,()=>!!window.docx?.renderAsync);
      return window.docx;
    })().catch(err=>{
      docxLibraryPromise=null;
      throw err;
    });
    return docxLibraryPromise;
  }

  async function fetchFiles(){
    const {data,error}=await client.from('portfolio_files')
      .select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at')
      .order('sort_order',{ascending:true})
      .order('created_at',{ascending:true});
    if(error) throw error;
    return data||[];
  }

  function fileViewerContent(item){
    const url=publicUrl(item.storage_path);
    const mime=String(item.mime_type||'').toLowerCase();
    const ext=fileExt(item);
    if(mime.startsWith('image/')||['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return `<img src="${esc(url)}" alt="${esc(item.title)}">`;
    if(mime==='application/pdf'||ext==='pdf') return `<iframe src="${esc(url)}#view=FitH" title="${esc(item.title)}"></iframe>`;
    if(mime.startsWith('text/')||['txt','html','htm'].includes(ext)) return `<iframe src="${esc(url)}" title="${esc(item.title)}"></iframe>`;
    return `<div class="file-fallback"><div><p>Dit bestandstype kan de browser niet altijd rechtstreeks in het venster weergeven.</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Bestand openen</a></p></div></div>`;
  }

  async function renderDocx(item,paper,renderId){
    const url=publicUrl(item.storage_path);
    paper.classList.add('docx-paper');
    paper.innerHTML='<div class="docx-preview-loading">Word-document laden…</div>';
    try{
      const docx=await ensureDocxLibrary();
      const response=await fetch(url);
      if(!response.ok) throw new Error(`Bestand ophalen mislukt (${response.status}).`);
      const buffer=await response.arrayBuffer();
      const bytes=new Uint8Array(buffer);
      if(bytes.length<4||bytes[0]!==0x50||bytes[1]!==0x4b) throw new Error('Het bestand is geen geldig DOCX/ZIP-bestand.');
      if(!paper.isConnected||paper.dataset.renderId!==renderId) return;
      const host=document.createElement('div');
      host.className='docx-preview-host';
      paper.replaceChildren(host);
      await docx.renderAsync(buffer,host,undefined,{
        inWrapper:true,
        breakPages:true,
        ignoreLastRenderedPageBreak:false
      });
    }catch(err){
      console.error('Gekoppeld Word-document kon niet worden weergegeven:',err);
      if(!paper.isConnected||paper.dataset.renderId!==renderId) return;
      const officeUrl=`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
      paper.innerHTML=`<div class="docx-preview-error"><div><p>Het Word-document kon niet in de ingebouwde weergave worden geladen.</p><p class="docx-preview-error-detail">${esc(err?.message||'Onbekende fout')}</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Bestand openen</a></p><p><a href="${esc(officeUrl)}" target="_blank" rel="noopener">Openen via Microsoft Office Online</a></p></div></div>`;
    }
  }

  function openLinkedViewer(items){
    if(!items.length) return;
    document.querySelector('.linked-file-viewer')?.remove();
    let current=0;
    let renderSequence=0;
    const overlay=document.createElement('div');
    overlay.className=`file-viewer-overlay linked-file-viewer${items.length===1?' single-linked-file':''}`;
    overlay.innerHTML=`
      <button class="file-nav-arrow prev" type="button" aria-label="Vorige gekoppelde document">‹</button>
      <section class="file-viewer-card" role="dialog" aria-modal="true">
        <header class="file-viewer-head"><strong data-linked-title></strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header>
        <div class="file-viewer-stage"><div class="file-paper" data-linked-paper></div></div>
        <span class="file-viewer-count" data-linked-count></span>
      </section>
      <button class="file-nav-arrow next" type="button" aria-label="Volgende gekoppelde document">›</button>`;
    document.body.appendChild(overlay);

    const render=()=>{
      const item=items[current];
      const paper=overlay.querySelector('[data-linked-paper]');
      const renderId=String(++renderSequence);
      paper.dataset.renderId=renderId;
      paper.classList.remove('docx-paper');
      overlay.querySelector('[data-linked-title]').textContent=item.title;
      if(isDocx(item)) renderDocx(item,paper,renderId);
      else paper.innerHTML=fileViewerContent(item);
      overlay.querySelector('[data-linked-count]').textContent=`${current+1} / ${items.length}`;
      const stage=overlay.querySelector('.file-viewer-stage');
      if(stage) stage.scrollTop=0;
    };
    const move=delta=>{current=(current+delta+items.length)%items.length;render()};
    const close=()=>{renderSequence+=1;document.removeEventListener('keydown',keyHandler);overlay.remove()};
    const keyHandler=e=>{
      if(e.key==='Escape') close();
      else if(items.length>1 && e.key==='ArrowLeft') move(-1);
      else if(items.length>1 && e.key==='ArrowRight') move(1);
    };
    overlay.querySelector('.prev')?.addEventListener('click',()=>move(-1));
    overlay.querySelector('.next')?.addEventListener('click',()=>move(1));
    overlay.querySelector('.file-viewer-close')?.addEventListener('click',close);
    document.addEventListener('keydown',keyHandler);
    render();
  }

  function removeChooserOverlays(){
    document.querySelectorAll('.text-file-link-overlay[data-link-chooser="1"]').forEach(node=>node.remove());
  }

  async function openLinkedFiles(ids){
    const cleanIds=normalizeIds(ids);
    if(!cleanIds.length) return;
    try{
      const {data,error}=await client.from('portfolio_files')
        .select('id,category,title,storage_path,file_name,mime_type')
        .in('id',cleanIds);
      if(error) throw error;
      const byId=new Map((data||[]).map(item=>[String(item.id).toLowerCase(),item]));
      const ordered=cleanIds.map(id=>byId.get(id)).filter(Boolean);
      if(!ordered.length){
        removeChooserOverlays();
        const overlay=document.createElement('div');
        overlay.className='text-file-link-overlay';
        overlay.dataset.linkChooser='1';
        overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Bestand niet gevonden</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">De gekoppelde documenten bestaan niet meer.</p></div></section>';
        document.body.appendChild(overlay);
        overlay.querySelector('.text-file-link-close')?.addEventListener('click',()=>overlay.remove());
        return;
      }
      openLinkedViewer(ordered);
    }catch(err){
      console.error('Gekoppelde bestanden openen mislukt:',err);
    }
  }

  function renderGroup(title,items,selectedSet){
    return `<section class="text-file-link-group"><h4>${esc(title)}</h4>${items.map(item=>`<label class="text-file-choice"><input type="checkbox" value="${item.id}" data-link-file-check${selectedSet.has(String(item.id).toLowerCase())?' checked':''}><span>${esc(item.title)}</span></label>`).join('')}</section>`;
  }

  function groupedRows(rows){
    const groups=new Map();
    rows.forEach(row=>{
      const category=normalizeCategory(row.category);
      if(!groups.has(category)) groups.set(category,[]);
      groups.get(category).push(row);
    });
    return [...groups.entries()].sort(([a],[b])=>compareCategories(a,b));
  }

  async function openChooser(detail){
    const sequence=++chooserSequence;
    removeChooserOverlays();

    const overlay=document.createElement('div');
    overlay.className='text-file-link-overlay';
    overlay.dataset.linkChooser='1';
    let keyHandler=null;
    const close=(restore=true)=>{
      if(keyHandler) document.removeEventListener('keydown',keyHandler);
      detail?.clearSelectionPreview?.();
      overlay.remove();
      if(restore) requestAnimationFrame(()=>detail?.restoreSelection?.());
    };
    keyHandler=e=>{if(e.key==='Escape') close(true);};
    document.addEventListener('keydown',keyHandler);
    overlay.addEventListener('click',e=>{if(e.target===overlay) close(true);});

    if(!detail?.hasSelection){
      overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Koppel bewijsstuk/bijlage</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">Selecteer eerst de tekst die je aan één of meer documenten wilt koppelen.</p></div></section>';
      document.body.appendChild(overlay);
      overlay.querySelector('.text-file-link-close')?.addEventListener('click',()=>close(false));
      return;
    }

    overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Koppel bewijsstuk/bijlage</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">Bestanden laden…</p></div></section>';
    document.body.appendChild(overlay);
    overlay.querySelector('.text-file-link-close')?.addEventListener('click',()=>close(true));

    try{
      const rows=await fetchFiles();
      if(sequence!==chooserSequence||!overlay.isConnected) return;
      const body=overlay.querySelector('.text-file-link-body');

      if(!rows.length){
        body.innerHTML='<p class="text-file-link-intro">Bewijsstukkenregister is leeg. Upload je bestanden om naar te kunnen verwijzen.</p>';
        return;
      }

      const existingIds=normalizeIds((detail.existingFileIds||[]).join(','));
      const selectedSet=new Set(existingIds);
      const categoryMarkup=groupedRows(rows).map(([category,items])=>renderGroup(category,items,selectedSet)).join('');
      body.innerHTML=`
        <p class="text-file-link-intro">Selecteer één of meer documenten uit het bewijsstukkenregister die je aan deze tekst wilt koppelen.</p>
        ${existingIds.length?'<p class="text-file-link-note">Bestaande koppelingen in deze selectie zijn al aangevinkt. Als maar een deel van de geselecteerde tekst al gekoppeld was, geldt je keuze na Opslaan voor de hele geselecteerde tekst.</p>':''}
        <p class="text-file-link-selection"><strong>Geselecteerde tekst:</strong> ${esc(detail.selectedText||'')}</p>
        ${categoryMarkup}
        <div class="text-file-link-actions">
          <button class="text-file-link-btn secondary" type="button" data-link-cancel>Annuleren</button>
          <button class="text-file-link-btn" type="button" data-link-apply>Koppelen</button>
        </div>`;
      const apply=body.querySelector('[data-link-apply]');
      const checks=[...body.querySelectorAll('[data-link-file-check]')];
      const update=()=>{
        const count=checks.filter(check=>check.checked).length;
        if(count){
          apply.disabled=false;
          apply.classList.remove('danger');
          apply.textContent=existingIds.length?`Koppeling opslaan (${count})`:`Koppelen (${count})`;
        }else if(existingIds.length){
          apply.disabled=false;
          apply.classList.add('danger');
          apply.textContent='Koppeling verwijderen';
        }else{
          apply.disabled=true;
          apply.classList.remove('danger');
          apply.textContent='Koppelen';
        }
      };
      checks.forEach(check=>check.addEventListener('change',update));
      body.querySelector('[data-link-cancel]')?.addEventListener('click',()=>close(true));
      apply.addEventListener('click',()=>{
        const selectedIds=checks.filter(check=>check.checked).map(check=>check.value);
        const selectedItems=selectedIds.map(id=>rows.find(row=>String(row.id).toLowerCase()===String(id).toLowerCase())).filter(Boolean);
        const ok=detail.applyFileLinks ? detail.applyFileLinks(selectedItems) : (selectedItems[0]?detail.applyFileLink?.(selectedItems[0]):false);
        if(ok) close(false);
      });
      update();
    }catch(err){
      console.error('Bestanden voor tekstkoppeling laden mislukt:',err);
      if(sequence!==chooserSequence||!overlay.isConnected) return;
      const body=overlay.querySelector('.text-file-link-body');
      if(body) body.innerHTML='<p class="text-file-link-intro">De documenten konden niet worden geladen.</p>';
    }
  }

  document.addEventListener('portfolio:link-file-request',event=>openChooser(event.detail));

  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[data-portfolio-file-id],a[data-portfolio-file-ids]');
    if(!link || link.closest('.rich-editor')) return;
    event.preventDefault();
    const ids=link.dataset.portfolioFileIds || link.dataset.portfolioFileId || '';
    openLinkedFiles(ids);
  });
})();