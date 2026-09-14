(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const sections={
    evidence:{cardKey:'5-2',label:'Bewijsstukken',empty:'Nog geen bewijsstukken toegevoegd.'},
    attachment:{cardKey:'5-3',label:'Bijlagen',empty:'Nog geen bijlagen toegevoegd.'}
  };
  let files={evidence:[],attachment:[]};
  let loading=false;

  const style=document.createElement('style');
  style.textContent=`
    .portfolio-file-list{display:grid;gap:7px;margin:10px 0 2px}
    .portfolio-file-link{width:100%;display:flex;align-items:center;gap:10px;border:1px solid #dce5df;background:#fff;color:#24513f;border-radius:11px;padding:10px 12px;text-align:left;font:inherit;font-weight:800;cursor:pointer}
    .portfolio-file-link:hover,.portfolio-file-link:focus-visible{background:#f0f5f1;border-color:#b9cbbf;outline:none}
    .portfolio-file-link::before{content:'↗';display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#e5eee8;color:#1f5e4a;font-size:.78rem;flex:0 0 auto}
    .portfolio-file-empty{color:#89958e;font-style:italic;margin:8px 0 0}
    .file-upload-overlay,.file-viewer-overlay{position:fixed;inset:0;z-index:3900;background:rgba(16,31,25,.58);display:grid;place-items:center;padding:24px}
    .file-upload-dialog{width:min(500px,calc(100vw - 30px));background:#fff;border-radius:19px;border:1px solid #dce4df;box-shadow:0 28px 90px rgba(13,35,27,.35);overflow:hidden}
    .file-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .file-dialog-head strong{font-family:Georgia,serif;font-size:1.08rem}
    .file-dialog-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;cursor:pointer}
    .file-upload-body{padding:18px;display:grid;gap:13px}
    .file-upload-body label{display:grid;gap:6px;font-size:.79rem;font-weight:850;color:#405047}
    .file-upload-body input[type="text"],.file-upload-body input[type="file"]{width:100%;border:1px solid #ced9d2;border-radius:11px;background:#fff;padding:10px 11px;font:inherit}
    .file-upload-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
    .file-upload-btn{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 13px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .file-upload-btn.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .file-upload-message{min-height:1.3em;margin:0;color:#59665f;font-size:.78rem;white-space:pre-line}
    .file-viewer-overlay{padding:28px 64px}
    .file-viewer-card{position:relative;width:min(92vw,880px);height:calc(100vh - 56px);max-height:1120px;display:flex;flex-direction:column;background:#f4f5f2;border-radius:20px;box-shadow:0 30px 100px rgba(5,24,17,.5);overflow:hidden}
    .file-viewer-head{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:54px;padding:10px 14px 10px 18px;background:#1f5e4a;color:#fff}
    .file-viewer-head strong{font-family:Georgia,serif;font-size:1.08rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .file-viewer-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;cursor:pointer;flex:0 0 auto}
    .file-viewer-stage{flex:1;min-height:0;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:16px;background:#dfe3df}
    .file-paper{width:min(100%,740px);min-height:100%;aspect-ratio:210/297;background:#fff;box-shadow:0 5px 24px rgba(24,39,32,.18);overflow:auto;position:relative}
    .file-paper iframe{display:block;width:100%;height:100%;min-height:100%;border:0;background:#fff}
    .file-paper img{display:block;width:100%;height:auto;min-height:auto;background:#fff}
    .file-fallback{display:grid;place-items:center;min-height:100%;padding:30px;text-align:center;color:#536159}
    .file-fallback a{color:#1f5e4a;font-weight:850}
    .file-nav-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:3910;width:48px;height:62px;border:1px solid rgba(255,255,255,.28);border-radius:14px;background:rgba(22,64,49,.88);color:#fff;font-size:2rem;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 8px 28px rgba(0,0,0,.2)}
    .file-nav-arrow.prev{left:12px}.file-nav-arrow.next{right:12px}
    .file-viewer-count{position:absolute;right:14px;bottom:10px;background:rgba(31,94,74,.9);color:#fff;border-radius:999px;padding:5px 9px;font-size:.7rem;font-weight:800;pointer-events:none}
    @media(max-width:700px){.file-viewer-overlay{padding:16px 45px}.file-viewer-card{height:calc(100vh - 32px);width:100%}.file-viewer-stage{padding:9px}.file-nav-arrow{width:38px;height:54px;border-radius:11px}.file-nav-arrow.prev{left:4px}.file-nav-arrow.next{right:4px}}
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const safeName=name=>String(name||'bestand').replace(/[^a-z0-9._-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-120)||'bestand';

  function publicUrl(path){ return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl; }

  async function loadFiles(){
    if(loading) return;
    loading=true;
    try{
      const {data,error}=await client.from('portfolio_files').select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at').order('sort_order',{ascending:true}).order('created_at',{ascending:true});
      if(error) throw error;
      files.evidence=(data||[]).filter(x=>x.category==='evidence');
      files.attachment=(data||[]).filter(x=>x.category==='attachment');
      renderFileSections();
    }catch(err){console.error('Bestandslijsten laden mislukt:',err)}
    finally{loading=false}
  }

  function renderCategory(category){
    const cfg=sections[category];
    const card=document.querySelector(`[data-topic-card="${cfg.cardKey}"]`);
    if(!card) return;
    const content=card.querySelector('.topic-content');
    if(content){
      content.innerHTML=files[category].length
        ? `<div class="portfolio-file-list">${files[category].map((item,index)=>`<button type="button" class="portfolio-file-link" data-view-file="${category}" data-file-index="${index}">${esc(item.title)}</button>`).join('')}</div>`
        : `<p class="portfolio-file-empty">${cfg.empty}</p>`;
    }
    const oldButton=card.querySelector('.topic-edit-btn');
    if(oldButton && !oldButton.dataset.fileUploadButton){
      const button=oldButton.cloneNode(true);
      button.dataset.fileUploadButton=category;
      button.removeAttribute('data-edit-topic');
      button.textContent='Bestand uploaden';
      oldButton.replaceWith(button);
      button.addEventListener('click',()=>openUpload(category));
    }
  }

  function renderFileSections(){
    renderCategory('evidence');
    renderCategory('attachment');
    document.querySelectorAll('[data-view-file]').forEach(btn=>{
      if(btn.dataset.viewerBound) return;
      btn.dataset.viewerBound='1';
      btn.addEventListener('click',()=>openViewer(btn.dataset.viewFile,Number(btn.dataset.fileIndex)||0));
    });
  }

  async function openUpload(category){
    if(!document.body.classList.contains('can-edit')) return;
    const cfg=sections[category];
    const overlay=document.createElement('div');
    overlay.className='file-upload-overlay';
    overlay.innerHTML=`<section class="file-upload-dialog" role="dialog" aria-modal="true" aria-label="${cfg.label} uploaden">
      <header class="file-dialog-head"><strong>${cfg.label.slice(0,-1)} uploaden</strong><button class="file-dialog-close" type="button" aria-label="Sluiten">×</button></header>
      <div class="file-upload-body">
        <label>Titel<input type="text" maxlength="200" data-file-title placeholder="Geef het bestand een duidelijke titel"></label>
        <label>Bestand<input type="file" data-file-input></label>
        <p class="file-upload-message" data-file-message></p>
        <div class="file-upload-actions"><button class="file-upload-btn secondary" type="button" data-file-cancel>Annuleren</button><button class="file-upload-btn" type="button" data-file-save>Uploaden</button></div>
      </div></section>`;
    document.body.appendChild(overlay);
    const close=()=>overlay.remove();
    overlay.querySelector('.file-dialog-close')?.addEventListener('click',close);
    overlay.querySelector('[data-file-cancel]')?.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    const titleInput=overlay.querySelector('[data-file-title]');
    titleInput?.focus();
    overlay.querySelector('[data-file-save]')?.addEventListener('click',async()=>{
      const title=titleInput.value.trim();
      const file=overlay.querySelector('[data-file-input]').files?.[0];
      const msg=overlay.querySelector('[data-file-message]');
      if(!title){msg.textContent='Geef eerst een titel op.';return}
      if(!file){msg.textContent='Kies eerst een bestand van je computer.';return}
      if(file.size>25*1024*1024){msg.textContent='Het bestand is groter dan 25 MB.';return}
      const {data:sessionData}=await client.auth.getSession();
      const session=sessionData?.session;
      if(!session){msg.textContent='Je bent niet meer ingelogd. Log opnieuw in.';return}
      const id=crypto.randomUUID();
      const path=`${category}/${id}/${safeName(file.name)}`;
      msg.textContent='Bestand uploaden…';
      const {error:uploadError}=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
      if(uploadError){msg.textContent='Uploaden mislukt: '+uploadError.message;return}
      const order=(files[category].at(-1)?.sort_order||0)+1000;
      const {error:rowError}=await client.from('portfolio_files').insert({id,category,title,storage_path:path,file_name:file.name,mime_type:file.type||null,sort_order:order,uploaded_by:session.user.id});
      if(rowError){await client.storage.from(BUCKET).remove([path]);msg.textContent='Opslaan mislukt: '+rowError.message;return}
      msg.textContent='Bestand toegevoegd.';
      await loadFiles();
      setTimeout(close,350);
    });
  }

  function viewerContent(item){
    const url=publicUrl(item.storage_path);
    const mime=String(item.mime_type||'').toLowerCase();
    const ext=String(item.file_name||'').split('.').pop().toLowerCase();
    if(mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return `<img src="${esc(url)}" alt="${esc(item.title)}">`;
    if(mime==='application/pdf' || ext==='pdf') return `<iframe src="${esc(url)}#view=FitH" title="${esc(item.title)}"></iframe>`;
    if(mime.startsWith('text/') || ['txt','html','htm'].includes(ext)) return `<iframe src="${esc(url)}" title="${esc(item.title)}"></iframe>`;
    return `<div class="file-fallback"><div><p>Dit bestandstype kan de browser niet altijd rechtstreeks in het venster weergeven.</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Bestand openen</a></p></div></div>`;
  }

  function openViewer(category,index){
    const list=files[category]||[];
    if(!list.length) return;
    let current=((index%list.length)+list.length)%list.length;
    const overlay=document.createElement('div');
    overlay.className='file-viewer-overlay';
    overlay.innerHTML=`<button class="file-nav-arrow prev" type="button" aria-label="Vorige">‹</button><section class="file-viewer-card" role="dialog" aria-modal="true"><header class="file-viewer-head"><strong data-view-title></strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header><div class="file-viewer-stage"><div class="file-paper" data-file-paper></div></div><span class="file-viewer-count" data-view-count></span></section><button class="file-nav-arrow next" type="button" aria-label="Volgende">›</button>`;
    document.body.appendChild(overlay);
    const render=()=>{
      const item=list[current];
      overlay.querySelector('[data-view-title]').textContent=item.title;
      overlay.querySelector('[data-file-paper]').innerHTML=viewerContent(item);
      overlay.querySelector('[data-view-count]').textContent=`${current+1} / ${list.length}`;
      overlay.querySelector('.file-viewer-stage').scrollTop=0;
    };
    const move=delta=>{current=(current+delta+list.length)%list.length;render()};
    const close=()=>{document.removeEventListener('keydown',keyHandler);overlay.remove()};
    const keyHandler=e=>{if(e.key==='ArrowLeft')move(-1);else if(e.key==='ArrowRight')move(1);else if(e.key==='Escape')close()};
    overlay.querySelector('.prev').addEventListener('click',()=>move(-1));
    overlay.querySelector('.next').addEventListener('click',()=>move(1));
    overlay.querySelector('.file-viewer-close').addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    document.addEventListener('keydown',keyHandler);
    render();
  }

  const observer=new MutationObserver(()=>renderFileSections());
  observer.observe(document.body,{childList:true,subtree:true});
  loadFiles();
  window.portfolioFiles={reload:loadFiles};
})();