(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const style=document.createElement('style');
  style.textContent=`
    .text-file-link-overlay{position:fixed;inset:0;z-index:4050;background:rgba(16,31,25,.58);display:grid;place-items:center;padding:24px}
    .text-file-link-dialog{width:min(590px,calc(100vw - 30px));max-height:min(82vh,760px);display:flex;flex-direction:column;background:#fff;border:1px solid #dce4df;border-radius:19px;box-shadow:0 28px 90px rgba(13,35,27,.35);overflow:hidden}
    .text-file-link-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .text-file-link-head strong{font-family:Georgia,serif;font-size:1.08rem}
    .text-file-link-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;cursor:pointer}
    .text-file-link-body{padding:17px;overflow:auto;display:grid;gap:15px}
    .text-file-link-intro{margin:0;color:#5d6963;font-size:.84rem}
    .text-file-link-selection{margin:0;padding:9px 11px;border-radius:10px;background:#f2f6f3;color:#294f40;font-size:.8rem;overflow-wrap:anywhere}
    .text-file-link-group{display:grid;gap:7px}
    .text-file-link-group h4{margin:0 0 2px;font-size:.82rem;color:#405047;text-transform:uppercase;letter-spacing:.06em}
    .text-file-choice{display:flex;align-items:center;gap:9px;width:100%;padding:10px 11px;border:1px solid #dce5df;border-radius:11px;background:#fff;color:#24513f;text-align:left;font:inherit;font-weight:800;cursor:pointer}
    .text-file-choice:hover,.text-file-choice:focus-visible{background:#edf4ef;border-color:#aec4b6;outline:none}
    .text-file-choice::before{content:'↗';display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:#e5eee8;color:#1f5e4a;font-size:.75rem;flex:0 0 auto}
    .text-file-link-empty{margin:0;color:#8b9690;font-style:italic;font-size:.82rem}
    .linked-file-viewer .file-viewer-card{width:min(92vw,880px)}
    .linked-file-viewer .file-viewer-count,.linked-file-viewer .file-nav-arrow{display:none!important}
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const publicUrl=path=>client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

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
    const ext=String(item.file_name||'').split('.').pop().toLowerCase();
    if(mime.startsWith('image/')||['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return `<img src="${esc(url)}" alt="${esc(item.title)}">`;
    if(mime==='application/pdf'||ext==='pdf') return `<iframe src="${esc(url)}#view=FitH" title="${esc(item.title)}"></iframe>`;
    if(mime.startsWith('text/')||['txt','html','htm'].includes(ext)) return `<iframe src="${esc(url)}" title="${esc(item.title)}"></iframe>`;
    return `<div class="file-fallback"><div><p>Dit bestandstype kan de browser niet altijd rechtstreeks in het venster weergeven.</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Bestand openen</a></p></div></div>`;
  }

  function openSingleViewer(item){
    document.querySelector('.linked-file-viewer')?.remove();
    const overlay=document.createElement('div');
    overlay.className='file-viewer-overlay linked-file-viewer';
    overlay.innerHTML=`<section class="file-viewer-card" role="dialog" aria-modal="true" aria-label="${esc(item.title)}"><header class="file-viewer-head"><strong>${esc(item.title)}</strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header><div class="file-viewer-stage"><div class="file-paper">${fileViewerContent(item)}</div></div></section>`;
    document.body.appendChild(overlay);
    const close=()=>{document.removeEventListener('keydown',keyHandler);overlay.remove()};
    const keyHandler=e=>{if(e.key==='Escape')close()};
    overlay.querySelector('.file-viewer-close')?.addEventListener('click',close);
    document.addEventListener('keydown',keyHandler);
  }

  async function openLinkedFile(id,category){
    try{
      let query=client.from('portfolio_files').select('id,category,title,storage_path,file_name,mime_type').eq('id',id);
      if(category) query=query.eq('category',category);
      const {data,error}=await query.maybeSingle();
      if(error) throw error;
      if(!data){
        const overlay=document.createElement('div');
        overlay.className='text-file-link-overlay';
        overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Bestand niet gevonden</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">Het gekoppelde bewijsstuk of de bijlage bestaat niet meer.</p></div></section>';
        document.body.appendChild(overlay);
        overlay.querySelector('.text-file-link-close')?.addEventListener('click',()=>overlay.remove());
        return;
      }
      openSingleViewer(data);
    }catch(err){
      console.error('Gekoppeld bestand openen mislukt:',err);
    }
  }

  function renderGroup(title,items,apply,close){
    if(!items.length) return `<section class="text-file-link-group"><h4>${esc(title)}</h4><p class="text-file-link-empty">Nog geen bestanden toegevoegd.</p></section>`;
    return `<section class="text-file-link-group"><h4>${esc(title)}</h4>${items.map(item=>`<button class="text-file-choice" type="button" data-link-file-id="${item.id}" data-link-file-category="${item.category}">${esc(item.title)}</button>`).join('')}</section>`;
  }

  async function openChooser(detail){
    const overlay=document.createElement('div');
    overlay.className='text-file-link-overlay';
    const close=()=>overlay.remove();
    if(!detail?.hasSelection){
      overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Koppel aan bewijsstuk/bijlage</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">Selecteer eerst de tekst die je aan een bewijsstuk of bijlage wilt koppelen.</p></div></section>';
      document.body.appendChild(overlay);
      overlay.querySelector('.text-file-link-close')?.addEventListener('click',close);
      return;
    }
    overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Koppel aan bewijsstuk/bijlage</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">Bestanden laden…</p></div></section>';
    document.body.appendChild(overlay);
    overlay.querySelector('.text-file-link-close')?.addEventListener('click',close);
    try{
      const rows=await fetchFiles();
      const evidence=rows.filter(row=>row.category==='evidence');
      const attachments=rows.filter(row=>row.category==='attachment');
      const body=overlay.querySelector('.text-file-link-body');
      body.innerHTML=`<p class="text-file-link-intro">Kies het bestand dat je aan de geselecteerde tekst wilt koppelen.</p><p class="text-file-link-selection"><strong>Geselecteerd:</strong> ${esc(detail.selectedText||'')}</p>${renderGroup('Bewijsstukken',evidence)}${renderGroup('Bijlagen',attachments)}`;
      body.querySelectorAll('[data-link-file-id]').forEach(button=>{
        button.addEventListener('click',()=>{
          const item=rows.find(row=>row.id===button.dataset.linkFileId);
          if(!item) return;
          const ok=detail.applyFileLink?.(item);
          if(ok) close();
        });
      });
    }catch(err){
      console.error('Bestanden voor tekstkoppeling laden mislukt:',err);
      const body=overlay.querySelector('.text-file-link-body');
      if(body) body.innerHTML='<p class="text-file-link-intro">De bewijsstukken en bijlagen konden niet worden geladen.</p>';
    }
  }

  document.addEventListener('portfolio:link-file-request',event=>openChooser(event.detail));

  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[data-portfolio-file-id]');
    if(!link || link.closest('.rich-editor')) return;
    event.preventDefault();
    openLinkedFile(link.dataset.portfolioFileId,link.dataset.portfolioFileCategory||'');
  });
})();