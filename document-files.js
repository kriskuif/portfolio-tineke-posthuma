(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET = 'portfolio-documents';
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const sections = {
    evidence: { key: '5-2', title: 'Bewijsstukken', singular: 'bewijsstuk' },
    attachment: { key: '5-3', title: 'Bijlagen', singular: 'bijlage' }
  };

  let rows = [];
  let activeCategory = null;
  let activeIndex = 0;

  const css = document.createElement('style');
  css.textContent = `
    .portfolio-file-list{display:grid;gap:8px;margin-top:2px}
    .portfolio-file-link{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid #dce5df;background:#fbfcfa;color:#284f41;border-radius:11px;padding:10px 12px;font:inherit;font-weight:750;cursor:pointer}
    .portfolio-file-link:hover,.portfolio-file-link:focus-visible{background:#eef4f0;border-color:#adc2b6;outline:none}
    .portfolio-file-icon{flex:0 0 auto;width:26px;height:30px;border-radius:6px;background:#e5eee8;display:grid;place-items:center;font-size:.72rem;color:#1f5e4a;font-weight:900}
    .portfolio-file-empty{margin:0;color:#849089;font-style:italic}
    .portfolio-file-upload{margin-top:12px}
    body:not(.can-edit) .portfolio-file-upload{display:none!important}

    .portfolio-upload-overlay,.portfolio-viewer-overlay{position:fixed;inset:0;z-index:4200;background:rgba(18,35,29,.62);display:grid;place-items:center;padding:24px}
    .portfolio-upload-card{width:min(500px,100%);background:#fff;border-radius:20px;border:1px solid #dde5df;box-shadow:0 30px 90px rgba(16,34,27,.34);padding:22px}
    .portfolio-upload-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
    .portfolio-upload-head h3{margin:0;font-family:Georgia,serif;color:#234f42}
    .portfolio-upload-close,.portfolio-viewer-close{border:0;background:transparent;color:#607169;font-size:1.5rem;line-height:1;cursor:pointer;padding:2px 6px}
    .portfolio-upload-fields{display:grid;gap:13px}
    .portfolio-upload-fields label{display:grid;gap:6px;font-size:.8rem;font-weight:800;color:#42584e}
    .portfolio-upload-fields input[type="text"],.portfolio-upload-fields input[type="file"]{width:100%;font:inherit;border:1px solid #cdd9d2;border-radius:11px;padding:10px 11px;background:#fff;color:#25362f}
    .portfolio-upload-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:17px}
    .portfolio-upload-actions button{border:0;border-radius:10px;padding:9px 13px;font-weight:800;cursor:pointer}
    .portfolio-upload-actions .secondary{background:#edf2ee;color:#315342}.portfolio-upload-actions .primary{background:#1f5e4a;color:#fff}
    .portfolio-upload-message{min-height:1.2em;margin:10px 0 0;color:#697871;font-size:.82rem}

    .portfolio-viewer-overlay{padding:34px 66px}
    .portfolio-viewer-dialog{position:relative;width:min(820px,calc((100vh - 68px) * .7071),calc(100vw - 132px));height:min(calc(100vh - 68px),calc((100vw - 132px) / .7071));min-height:420px;background:#fff;border-radius:18px;box-shadow:0 32px 100px rgba(9,24,18,.44);display:grid;grid-template-rows:auto 1fr;overflow:hidden;border:1px solid rgba(255,255,255,.45)}
    .portfolio-viewer-head{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:13px 16px;background:#f5f7f4;border-bottom:1px solid #dce4de;min-height:54px}
    .portfolio-viewer-title{font-family:Georgia,serif;font-size:1.02rem;color:#234f42;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .portfolio-viewer-body{position:relative;min-height:0;overflow:auto;background:#d9ddda;overscroll-behavior:contain}
    .portfolio-viewer-frame{display:block;width:100%;height:100%;border:0;background:#fff}
    .portfolio-viewer-image-wrap{min-height:100%;display:flex;justify-content:center;align-items:flex-start;padding:16px;overflow:auto}
    .portfolio-viewer-image{display:block;max-width:100%;height:auto;background:#fff;box-shadow:0 3px 18px rgba(0,0,0,.16)}
    .portfolio-viewer-fallback{min-height:100%;display:grid;place-items:center;padding:24px;text-align:center;background:#f5f6f4;color:#526259}
    .portfolio-viewer-fallback a{display:inline-block;margin-top:12px;color:#1f5e4a;font-weight:800}
    .portfolio-viewer-nav{position:fixed;top:50%;transform:translateY(-50%);z-index:4210;width:44px;height:64px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.92);color:#1f5e4a;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.18);font-size:2rem;line-height:1;cursor:pointer;display:grid;place-items:center}
    .portfolio-viewer-nav:hover,.portfolio-viewer-nav:focus-visible{background:#fff;outline:2px solid rgba(255,255,255,.45)}
    .portfolio-viewer-prev{left:14px}.portfolio-viewer-next{right:14px}
    .portfolio-viewer-counter{font:700 .72rem/1 Arial,sans-serif;color:#718078;white-space:nowrap}
    @media(max-width:700px){
      .portfolio-viewer-overlay{padding:24px 46px}
      .portfolio-viewer-dialog{width:min(calc(100vw - 92px),calc((100vh - 48px) * .7071));height:min(calc(100vh - 48px),calc((100vw - 92px) / .7071));min-height:360px;border-radius:13px}
      .portfolio-viewer-nav{width:36px;height:56px;border-radius:11px}.portfolio-viewer-prev{left:5px}.portfolio-viewer-next{right:5px}
      .portfolio-viewer-head{padding:10px 11px;min-height:48px}.portfolio-viewer-title{font-size:.9rem}
    }
  `;
  document.head.appendChild(css);

  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const categoryRows = category => rows.filter(r => r.category === category).sort((a,b) => (a.sort_order||0)-(b.sort_order||0) || String(a.created_at||'').localeCompare(String(b.created_at||'')));
  const ext = name => (String(name||'').split('.').pop() || '').toLowerCase();
  const isImage = row => /^image\//.test(row.mime_type||'') || ['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext(row.file_name));
  const isOffice = row => ['doc','docx','xls','xlsx','ppt','pptx'].includes(ext(row.file_name));

  function publicUrl(row){
    return client.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl;
  }

  function patchFileCards(){
    Object.entries(sections).forEach(([category, cfg]) => {
      const card = document.querySelector(`[data-topic-card="${cfg.key}"]`);
      if (!card) return;
      const items = categoryRows(category);
      card.classList.toggle('filled', items.length > 0);
      const stateEl = card.querySelector('.topic-state');
      if(stateEl) stateEl.textContent = items.length ? `${items.length} bestand${items.length===1?'':'en'}` : 'Nog leeg';
      const content = card.querySelector('.topic-content');
      if(content){
        content.innerHTML = items.length
          ? `<div class="portfolio-file-list">${items.map((row,index)=>`<button class="portfolio-file-link" type="button" data-portfolio-file="${category}" data-file-index="${index}"><span class="portfolio-file-icon">${esc(ext(row.file_name).slice(0,4).toUpperCase() || 'DOC')}</span><span>${esc(row.title)}</span></button>`).join('')}</div>`
          : `<p class="portfolio-file-empty">Nog geen ${cfg.title.toLowerCase()} toegevoegd.</p>`;
      }
      const oldButton = card.querySelector('.topic-edit-btn');
      if(oldButton){
        oldButton.className = 'topic-edit-btn portfolio-file-upload';
        oldButton.removeAttribute('data-edit-topic');
        oldButton.dataset.uploadCategory = category;
        oldButton.textContent = 'Bestand uploaden';
      }
    });

    const chapter = document.getElementById('hoofdstuk-6');
    if(chapter){
      const progress = chapter.querySelector('#progress-6');
      if(progress){
        const regularFilled = [groups?.[5]?.topics?.[0], groups?.[5]?.topics?.[1]].filter(Boolean).filter(topic => topic.fields.some(([id]) => String(state.values[id]||'').trim())).length;
        const fileFilled = (categoryRows('evidence').length ? 1 : 0) + (categoryRows('attachment').length ? 1 : 0);
        progress.textContent = `${regularFilled + fileFilled} van 4 onderdelen ingevuld`;
      }
    }
  }

  async function loadFiles(){
    const { data, error } = await client.from('portfolio_files').select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at').order('sort_order',{ascending:true});
    if(error){ console.error('Portfolio-bestanden laden mislukt:', error); return; }
    rows = Array.isArray(data) ? data : [];
    patchFileCards();
  }

  function closeUpload(){ document.querySelector('.portfolio-upload-overlay')?.remove(); }
  function openUpload(category){
    if(!document.body.classList.contains('can-edit')) return;
    const cfg = sections[category];
    if(!cfg) return;
    closeUpload();
    const overlay = document.createElement('div');
    overlay.className = 'portfolio-upload-overlay';
    overlay.innerHTML = `<section class="portfolio-upload-card" role="dialog" aria-modal="true" aria-labelledby="portfolio-upload-title">
      <div class="portfolio-upload-head"><div><h3 id="portfolio-upload-title">${esc(cfg.title)} uploaden</h3></div><button class="portfolio-upload-close" type="button" aria-label="Sluiten">×</button></div>
      <div class="portfolio-upload-fields">
        <label>Titel<input type="text" maxlength="200" data-file-title placeholder="Geef het ${esc(cfg.singular)} een titel"></label>
        <label>Bestand<input type="file" data-file-input></label>
      </div>
      <div class="portfolio-upload-actions"><button class="secondary" type="button" data-file-cancel>Annuleren</button><button class="primary" type="button" data-file-save>Uploaden</button></div>
      <p class="portfolio-upload-message" data-file-message></p>
    </section>`;
    document.body.appendChild(overlay);
    document.documentElement.style.overflow='hidden';
    const finish=()=>{closeUpload();if(!document.querySelector('.portfolio-viewer-overlay'))document.documentElement.style.overflow='';};
    overlay.addEventListener('click',e=>{if(e.target===overlay)finish()});
    overlay.querySelector('.portfolio-upload-close')?.addEventListener('click',finish);
    overlay.querySelector('[data-file-cancel]')?.addEventListener('click',finish);
    overlay.querySelector('[data-file-title]')?.focus();
    overlay.querySelector('[data-file-save]')?.addEventListener('click',async()=>{
      const title=overlay.querySelector('[data-file-title]')?.value.trim()||'';
      const file=overlay.querySelector('[data-file-input]')?.files?.[0];
      const message=overlay.querySelector('[data-file-message]');
      const button=overlay.querySelector('[data-file-save]');
      if(!title){message.textContent='Geef eerst een titel op.';return;}
      if(!file){message.textContent='Kies eerst een bestand.';return;}
      if(file.size>25*1024*1024){message.textContent='Het bestand is groter dan 25 MB.';return;}
      button.disabled=true;
      message.textContent='Bestand uploaden…';
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'bestand';
      const id=crypto.randomUUID();
      const path=`${category}/${id}/${safeName}`;
      const upload=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type||undefined,upsert:false,cacheControl:'3600'});
      if(upload.error){message.textContent='Uploaden mislukt: '+upload.error.message;button.disabled=false;return;}
      const { data: sessionData } = await client.auth.getSession();
      const inserted=await client.from('portfolio_files').insert({category,title,storage_path:path,file_name:file.name,mime_type:file.type||null,sort_order:Date.now(),uploaded_by:sessionData?.session?.user?.id||null}).select().single();
      if(inserted.error){
        await client.storage.from(BUCKET).remove([path]);
        message.textContent='Opslaan van het bestand mislukt: '+inserted.error.message;
        button.disabled=false;
        return;
      }
      message.textContent='Bestand toegevoegd.';
      await loadFiles();
      setTimeout(finish,350);
    });
  }

  function viewerMarkup(row, index, total){
    const url=publicUrl(row);
    let content='';
    if(isImage(row)){
      content=`<div class="portfolio-viewer-image-wrap"><img class="portfolio-viewer-image" src="${esc(url)}" alt="${esc(row.title)}"></div>`;
    }else if(isOffice(row)){
      const office=`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      content=`<iframe class="portfolio-viewer-frame" src="${esc(office)}" title="${esc(row.title)}"></iframe>`;
    }else{
      content=`<iframe class="portfolio-viewer-frame" src="${esc(url)}" title="${esc(row.title)}"></iframe>`;
    }
    return `<section class="portfolio-viewer-dialog" role="dialog" aria-modal="true" aria-labelledby="portfolio-viewer-title">
      <header class="portfolio-viewer-head"><div class="portfolio-viewer-title" id="portfolio-viewer-title">${esc(row.title)}</div><span class="portfolio-viewer-counter">${index+1} / ${total}</span><button class="portfolio-viewer-close" type="button" aria-label="Sluiten">×</button></header>
      <div class="portfolio-viewer-body">${content}</div>
    </section>
    <button class="portfolio-viewer-nav portfolio-viewer-prev" type="button" aria-label="Vorig bestand">‹</button>
    <button class="portfolio-viewer-nav portfolio-viewer-next" type="button" aria-label="Volgend bestand">›</button>`;
  }

  function closeViewer(){
    document.querySelector('.portfolio-viewer-overlay')?.remove();
    activeCategory=null;
    if(!document.querySelector('.portfolio-upload-overlay'))document.documentElement.style.overflow='';
  }

  function showViewer(category,index){
    const items=categoryRows(category);
    if(!items.length)return;
    activeCategory=category;
    activeIndex=((index%items.length)+items.length)%items.length;
    let overlay=document.querySelector('.portfolio-viewer-overlay');
    if(!overlay){overlay=document.createElement('div');overlay.className='portfolio-viewer-overlay';document.body.appendChild(overlay);}
    overlay.innerHTML=viewerMarkup(items[activeIndex],activeIndex,items.length);
    document.documentElement.style.overflow='hidden';
    overlay.querySelector('.portfolio-viewer-close')?.addEventListener('click',closeViewer);
    overlay.querySelector('.portfolio-viewer-prev')?.addEventListener('click',()=>showViewer(category,activeIndex-1));
    overlay.querySelector('.portfolio-viewer-next')?.addEventListener('click',()=>showViewer(category,activeIndex+1));
    overlay.onclick=e=>{if(e.target===overlay)closeViewer()};
  }

  document.addEventListener('click',e=>{
    const upload=e.target.closest('[data-upload-category]');
    if(upload){e.preventDefault();e.stopPropagation();openUpload(upload.dataset.uploadCategory);return;}
    const file=e.target.closest('[data-portfolio-file]');
    if(file){e.preventDefault();showViewer(file.dataset.portfolioFile,Number(file.dataset.fileIndex)||0);}
  });

  document.addEventListener('keydown',e=>{
    if(!activeCategory)return;
    if(e.key==='Escape')closeViewer();
    if(e.key==='ArrowLeft')showViewer(activeCategory,activeIndex-1);
    if(e.key==='ArrowRight')showViewer(activeCategory,activeIndex+1);
  });

  const originalRender = window.renderChapters || (typeof renderChapters==='function' ? renderChapters : null);
  if(originalRender){
    const renderWithFiles=function(){originalRender();patchFileCards();};
    try{window.renderChapters=renderWithFiles;renderChapters=renderWithFiles;}catch(_err){window.renderChapters=renderWithFiles;}
  }

  new MutationObserver(()=>patchFileCards()).observe(document.body,{attributes:true,attributeFilter:['class']});
  loadFiles();
})();