(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const CATEGORY_TABLE='portfolio_file_categories';
  const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const JSZIP_SRC='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const DOCX_PREVIEW_SRC='https://cdn.jsdelivr.net/npm/docx-preview@0.4.1/dist/docx-preview.min.js';
  const STANDARD_CATEGORIES=['Bijlage','Feedback','Lesvoorbereiding','Reflectieverslag','Trainingsvoorbereiding'];
  const LEGACY_CATEGORY_MAP={
    evidence:'Bijlage',
    attachment:'Bijlage',
    feedback:'Feedback',
    lessonprep:'Lesvoorbereiding'
  };
  const LOCAL_CATEGORY_KEY='portfolio-evidence-custom-categories-v1';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  let files=[];
  let customCategories=[];
  let loading=false;
  let docxLibraryPromise=null;

  const style=document.createElement('style');
  style.textContent=`
    .evidence-register-section .chapter-header{align-items:center}
    .evidence-register-add{margin-left:auto;flex:0 0 auto;border:1px solid #cbded2;border-radius:11px;background:#eef5f0;color:#1f5e4a;padding:9px 13px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .evidence-register-add:hover,.evidence-register-add:focus-visible{background:#e3eee7;border-color:#aec5b7;outline:none}
    body:not(.can-edit) .evidence-register-add{display:none}
    .evidence-register-empty{margin:0;color:#89958e;font-style:italic}
    .evidence-category-card .topic-content{margin-top:0}
    .portfolio-file-list{display:grid;gap:7px;margin:10px 0 2px}
    .portfolio-file-link{width:100%;display:flex;align-items:center;gap:10px;border:1px solid #dce5df;background:#fff;color:#24513f;border-radius:11px;padding:10px 12px;text-align:left;font:inherit;font-weight:800;cursor:pointer}
    .portfolio-file-link:hover,.portfolio-file-link:focus-visible{background:#f0f5f1;border-color:#b9cbbf;outline:none}
    .portfolio-file-link::before{content:'↗';display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#e5eee8;color:#1f5e4a;font-size:.78rem;flex:0 0 auto}
    .portfolio-file-empty{color:#89958e;font-style:italic;margin:8px 0 0}
    .file-upload-overlay,.file-viewer-overlay{position:fixed;inset:0;z-index:3900;background:rgba(16,31,25,.58);display:grid;place-items:center;padding:24px}
    .file-upload-dialog{width:min(540px,calc(100vw - 30px));background:#fff;border-radius:19px;border:1px solid #dce4df;box-shadow:0 28px 90px rgba(13,35,27,.35);overflow:hidden}
    .file-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .file-dialog-head strong{font-family:Georgia,serif;font-size:1.08rem}
    .file-dialog-close,.file-viewer-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;cursor:pointer}
    .file-upload-body{padding:18px;display:grid;gap:13px}
    .file-upload-body label{display:grid;gap:6px;font-size:.79rem;font-weight:850;color:#405047}
    .file-upload-body input[type="text"],.file-upload-body input[type="file"],.file-upload-body select{width:100%;border:1px solid #ced9d2;border-radius:11px;background:#fff;padding:10px 11px;font:inherit;color:#263b32;box-sizing:border-box}
    .file-category-control{display:grid;grid-template-columns:minmax(0,1fr) 42px;gap:8px;align-items:end}
    .file-category-add{width:42px;height:42px;border:1px solid #c8d9cf;border-radius:11px;background:#eef5f0;color:#1f5e4a;font:inherit;font-size:1.35rem;font-weight:700;cursor:pointer}
    .file-category-add:hover,.file-category-add:focus-visible{background:#e3eee7;outline:none}
    .file-category-new{display:none;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;padding:10px;border:1px solid #e0e8e3;border-radius:12px;background:#f7faf8}
    .file-category-new.open{display:grid}
    .file-category-new label{margin:0}
    .file-category-save{height:42px;border:0;border-radius:10px;background:#1f5e4a;color:#fff;padding:0 13px;font:inherit;font-size:.78rem;font-weight:850;cursor:pointer}
    .file-upload-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
    .file-upload-btn{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 13px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .file-upload-btn.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .file-upload-btn:disabled,.file-category-save:disabled{opacity:.55;cursor:not-allowed}
    .file-upload-message{min-height:1.3em;margin:0;color:#59665f;font-size:.78rem;white-space:pre-line}
    .file-upload-message.error{color:#98433a}
    .file-viewer-overlay{padding:28px 64px}
    .file-viewer-card{position:relative;width:min(92vw,880px);height:calc(100vh - 56px);max-height:1120px;display:flex;flex-direction:column;background:#f4f5f2;border-radius:20px;box-shadow:0 30px 100px rgba(5,24,17,.5);overflow:hidden}
    .file-viewer-head{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:54px;padding:10px 14px 10px 18px;background:#1f5e4a;color:#fff}
    .file-viewer-head strong{font-family:Georgia,serif;font-size:1.08rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .file-viewer-stage{flex:1;min-height:0;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:16px;background:#dfe3df}
    .file-paper{width:min(100%,740px);min-height:100%;aspect-ratio:210/297;background:#fff;box-shadow:0 5px 24px rgba(24,39,32,.18);overflow:auto;position:relative}
    .file-paper iframe{display:block;width:100%;height:100%;min-height:100%;border:0;background:#fff}
    .file-paper img{display:block;width:100%;height:auto;background:#fff}
    .file-paper.docx-paper{width:min(100%,780px);min-height:100%;aspect-ratio:auto;background:transparent;box-shadow:none;overflow:visible}
    .docx-preview-host{width:100%;min-height:100%}
    .docx-preview-host .docx-wrapper{background:transparent!important;padding:0!important;display:grid;gap:14px}
    .docx-preview-host section.docx{margin:0 auto!important;box-shadow:0 5px 24px rgba(24,39,32,.18)!important}
    .docx-preview-loading,.docx-preview-error{width:100%;min-height:420px;display:grid;place-items:center;background:#fff;color:#607068;text-align:center;padding:30px;box-shadow:0 5px 24px rgba(24,39,32,.14)}
    .docx-preview-error a{color:#1f5e4a;font-weight:850}
    .file-fallback{display:grid;place-items:center;min-height:100%;padding:30px;text-align:center;color:#536159}
    .file-fallback a{color:#1f5e4a;font-weight:850}
    .file-nav-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:3910;width:48px;height:62px;border:1px solid rgba(255,255,255,.28);border-radius:14px;background:rgba(22,64,49,.88);color:#fff;font-size:2rem;line-height:1;cursor:pointer;display:grid;place-items:center;box-shadow:0 8px 28px rgba(0,0,0,.2)}
    .file-nav-arrow.prev{left:12px}.file-nav-arrow.next{right:12px}
    .file-viewer-count{position:absolute;right:14px;bottom:10px;background:rgba(31,94,74,.9);color:#fff;border-radius:999px;padding:5px 9px;font-size:.7rem;font-weight:800;pointer-events:none}
    @media(max-width:700px){
      .evidence-register-section .chapter-header{align-items:flex-start}
      .evidence-register-add{margin-left:0}
      .file-category-control{grid-template-columns:minmax(0,1fr) 42px}
      .file-category-new{grid-template-columns:1fr}
      .file-category-save{justify-self:end;padding-inline:14px}
      .file-viewer-overlay{padding:16px 45px}.file-viewer-card{height:calc(100vh - 32px);width:100%}.file-viewer-stage{padding:9px}.file-nav-arrow{width:38px;height:54px;border-radius:11px}.file-nav-arrow.prev{left:4px}.file-nav-arrow.next{right:4px}.docx-preview-host .docx-wrapper{gap:9px}
    }
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeName=name=>String(name||'bestand').replace(/[^a-z0-9._-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-120)||'bestand';
  const publicUrl=path=>client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const fileExt=item=>String(item?.file_name||'').split('.').pop().toLowerCase();
  const isDocx=item=>String(item?.mime_type||'').toLowerCase()===DOCX_MIME||fileExt(item)==='docx'||/\.docx$/i.test(String(item?.storage_path||''));
  const compareCategories=(a,b)=>String(a).localeCompare(String(b),'nl',{sensitivity:'base'});
  const normalizeCategory=value=>{
    const raw=String(value||'').trim();
    return LEGACY_CATEGORY_MAP[raw.toLowerCase()]||raw;
  };

  function readLocalCategories(){
    try{
      const parsed=JSON.parse(localStorage.getItem(LOCAL_CATEGORY_KEY)||'[]');
      return Array.isArray(parsed)?parsed.map(x=>String(x||'').trim()).filter(Boolean):[];
    }catch(_err){return[];}
  }

  function saveLocalCategories(list){
    try{localStorage.setItem(LOCAL_CATEGORY_KEY,JSON.stringify(list));}catch(_err){}
  }

  function uniqueCategories(list){
    const seen=new Set();
    return list.map(x=>String(x||'').trim()).filter(Boolean).filter(name=>{
      const key=name.toLocaleLowerCase('nl');
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function allCategoryChoices(){
    return uniqueCategories([...STANDARD_CATEGORIES,...customCategories]).sort(compareCategories);
  }

  function ensurePortfolioStructure(){
    try{
      if(typeof groups!=='undefined'&&groups[5]){
        const next=groups[5].topics.filter(topic=>!['Bewijsstukkenregister','Bijlagen'].includes(String(topic?.title||'')));
        if(next.length!==groups[5].topics.length){
          groups[5].topics=next;
          if(typeof renderChapters==='function') renderChapters();
        }
      }
    }catch(err){console.warn('Hoofdstuk 06 kon niet worden opgeschoond:',err)}

    const nav=document.querySelector('.nav');
    if(nav&&!nav.querySelector('a[href="#hoofdstuk-7"]')){
      const h6=nav.querySelector('a[href="#hoofdstuk-6"]');
      h6?.insertAdjacentHTML('afterend','<a href="#hoofdstuk-7"><span class="n">07</span><span>Bewijsstukkenregister</span></a>');
    }

    const overview=document.querySelector('#overzicht .journey');
    const subtitle=document.querySelector('#overzicht .section-header .subtitle');
    if(subtitle) subtitle.textContent='Zeven hoofdstukken met de bijbehorende onderdelen.';
    if(overview&&!overview.querySelector('a[href="#hoofdstuk-7"]')){
      overview.insertAdjacentHTML('beforeend','<article class="journey-card"><div class="num">07</div><h4>Bewijsstukkenregister</h4><p>Alle bewijsstukken overzichtelijk geordend per soort.</p><div class="mini-tags"><span>Bewijsstukken</span><span>Documenten</span></div><a href="#hoofdstuk-7">Bekijk hoofdstuk</a></article>');
    }
    const chapter6Card=[...document.querySelectorAll('#overzicht .journey-card')].find(card=>card.querySelector('a[href="#hoofdstuk-6"]'));
    chapter6Card?.querySelectorAll('.mini-tags span').forEach(tag=>{
      if(tag.textContent.trim().toLowerCase()==='bewijsstukken') tag.remove();
    });

    if(!document.getElementById('hoofdstuk-7')){
      const footer=document.querySelector('main > footer');
      footer?.insertAdjacentHTML('beforebegin',`<section class="portfolio-group section evidence-register-section" id="hoofdstuk-7" data-group="7">
        <div class="section-header chapter-header evidence-register-header">
          <div class="section-num">07</div>
          <div class="chapter-heading"><h3>Bewijsstukkenregister</h3><p class="subtitle">Alle bewijsstukken geordend per soort.</p></div>
          <button class="evidence-register-add" type="button" data-file-upload-button>Bestand toevoegen</button>
        </div>
        <div class="topic-list" id="evidence-register-topics"><p class="evidence-register-empty">Nog geen bewijsstukken toegevoegd.</p></div>
      </section>`);
      document.querySelector('[data-file-upload-button]')?.addEventListener('click',()=>openUpload());
    }
  }

  function loadExternalScript(src,test){
    if(test()) return Promise.resolve();
    const existing=[...document.scripts].find(script=>script.src===src);
    if(existing){
      return new Promise((resolve,reject)=>{
        if(test()){resolve();return}
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

  async function loadFiles(){
    if(loading) return;
    loading=true;
    try{
      const fileResult=await client.from('portfolio_files')
        .select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at')
        .order('sort_order',{ascending:true})
        .order('created_at',{ascending:true});
      if(fileResult.error) throw fileResult.error;
      const counters=new Map();
      files=(fileResult.data||[]).map(item=>{
        const raw=String(item.category||'').trim();
        const index=counters.get(raw)||0;
        counters.set(raw,index+1);
        return {...item,_categoryIndex:index,_displayCategory:normalizeCategory(raw)};
      });

      let remote=[];
      const categoryResult=await client.from(CATEGORY_TABLE).select('name').order('name',{ascending:true});
      if(categoryResult.error){
        console.warn('Eigen bewijsstukcategorieën konden niet uit Supabase worden geladen:',categoryResult.error);
      }else{
        remote=(categoryResult.data||[]).map(row=>String(row.name||'').trim()).filter(Boolean);
      }
      const fromFiles=files.map(item=>item._displayCategory).filter(name=>name&&!STANDARD_CATEGORIES.some(std=>std.toLocaleLowerCase('nl')===name.toLocaleLowerCase('nl')));
      customCategories=uniqueCategories([...remote,...readLocalCategories(),...fromFiles]).sort(compareCategories);
      saveLocalCategories(customCategories);
      ensurePortfolioStructure();
      renderRegister();
    }catch(err){console.error('Bestandsregister laden mislukt:',err)}
    finally{loading=false}
  }

  function renderRegister(){
    const target=document.getElementById('evidence-register-topics');
    if(!target) return;
    const groupsMap=new Map();
    files.forEach(item=>{
      const name=item._displayCategory||'Bijlage';
      if(!groupsMap.has(name)) groupsMap.set(name,[]);
      groupsMap.get(name).push(item);
    });
    const categories=[...groupsMap.keys()].filter(name=>groupsMap.get(name)?.length).sort(compareCategories);
    if(!categories.length){
      target.innerHTML='<p class="evidence-register-empty">Nog geen bewijsstukken toegevoegd.</p>';
      return;
    }
    target.innerHTML=categories.map((category,index)=>{
      const items=groupsMap.get(category)||[];
      return `<article class="topic-card filled evidence-category-card">
        <div class="topic-card-head">
          <div class="topic-card-title"><span class="topic-index">Onderdeel 07.${index+1}</span><h4>${esc(category)}</h4></div>
          <span class="topic-state">${items.length} ${items.length===1?'bewijsstuk':'bewijsstukken'}</span>
        </div>
        <div class="topic-content"><div class="portfolio-file-list">${items.map(item=>`<button type="button" class="portfolio-file-link" data-view-file="${esc(item.category)}" data-file-index="${item._categoryIndex}">${esc(item.title)}</button>`).join('')}</div></div>
      </article>`;
    }).join('');
    bindViewButtons();
  }

  function bindViewButtons(){
    document.querySelectorAll('#hoofdstuk-7 [data-view-file]').forEach(btn=>{
      if(btn.dataset.viewerBound) return;
      btn.dataset.viewerBound='1';
      btn.addEventListener('click',()=>openViewer(btn.dataset.viewFile,Number(btn.dataset.fileIndex)||0));
    });
  }

  function categoryOptions(selected=''){
    const choices=allCategoryChoices();
    const value=selected||choices[0]||'Bijlage';
    return choices.map(name=>`<option value="${esc(name)}"${name===value?' selected':''}>${esc(name)}</option>`).join('');
  }

  async function persistCustomCategory(name,message){
    const clean=String(name||'').trim().replace(/\s+/g,' ');
    if(!clean){message.textContent='Vul een categorienaam in.';return null;}
    if(clean.length>80){message.textContent='De categorienaam mag maximaal 80 tekens bevatten.';return null;}
    const existing=allCategoryChoices().find(item=>item.toLocaleLowerCase('nl')===clean.toLocaleLowerCase('nl'));
    if(existing) return existing;

    const {data:sessionData}=await client.auth.getSession();
    const session=sessionData?.session;
    if(!session){message.textContent='Je bent niet meer ingelogd. Log opnieuw in.';return null;}
    message.textContent='Categorie opslaan…';
    const {error}=await client.from(CATEGORY_TABLE).insert({name:clean,created_by:session.user.id});
    if(error&&error.code!=='23505'){
      message.textContent='Categorie opslaan mislukt: '+error.message;
      return null;
    }
    customCategories=uniqueCategories([...customCategories,clean]).sort(compareCategories);
    saveLocalCategories(customCategories);
    message.textContent='Categorie toegevoegd.';
    return clean;
  }

  async function nextSortOrder(category){
    const {data,error}=await client.from('portfolio_files')
      .select('sort_order')
      .eq('category',category)
      .order('sort_order',{ascending:false})
      .limit(1);
    if(error) throw error;
    return (Number(data?.[0]?.sort_order)||0)+1000;
  }

  function openUpload(defaultCategory=''){
    if(!document.body.classList.contains('can-edit')) return;
    const initial=allCategoryChoices().includes(defaultCategory)?defaultCategory:(allCategoryChoices()[0]||'Bijlage');
    const overlay=document.createElement('div');
    overlay.className='file-upload-overlay';
    overlay.dataset.uploadCategory=initial;
    overlay.innerHTML=`<section class="file-upload-dialog" role="dialog" aria-modal="true" aria-label="Bewijsstuk toevoegen">
      <header class="file-dialog-head"><strong>Bewijsstuk toevoegen</strong><button class="file-dialog-close" type="button" aria-label="Sluiten">×</button></header>
      <div class="file-upload-body">
        <label>Naam<input type="text" maxlength="200" data-file-title placeholder="Geef het bewijsstuk een duidelijke naam"></label>
        <div class="file-category-control">
          <label>Soort bewijsstuk<select data-file-category>${categoryOptions(initial)}</select></label>
          <button class="file-category-add" type="button" data-category-toggle aria-label="Nieuwe categorie toevoegen" title="Nieuwe categorie toevoegen">+</button>
        </div>
        <div class="file-category-new" data-category-new>
          <label>Nieuwe categorie<input type="text" maxlength="80" data-category-name placeholder="Naam van de categorie"></label>
          <button class="file-category-save" type="button" data-category-save>Toevoegen</button>
        </div>
        <label>Bestand<input type="file" data-file-input></label>
        <p class="file-upload-message" data-file-message></p>
        <div class="file-upload-actions"><button class="file-upload-btn secondary" type="button" data-file-cancel>Annuleren</button><button class="file-upload-btn" type="button" data-file-save>Uploaden</button></div>
      </div>
    </section>`;
    document.body.appendChild(overlay);
    const close=()=>overlay.remove();
    const titleInput=overlay.querySelector('[data-file-title]');
    const categorySelect=overlay.querySelector('[data-file-category]');
    const newWrap=overlay.querySelector('[data-category-new]');
    const newInput=overlay.querySelector('[data-category-name]');
    const msg=overlay.querySelector('[data-file-message]');

    overlay.querySelector('.file-dialog-close')?.addEventListener('click',close);
    overlay.querySelector('[data-file-cancel]')?.addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    categorySelect?.addEventListener('change',()=>{overlay.dataset.uploadCategory=categorySelect.value;});
    overlay.querySelector('[data-category-toggle]')?.addEventListener('click',()=>{
      const open=!newWrap.classList.contains('open');
      newWrap.classList.toggle('open',open);
      if(open) requestAnimationFrame(()=>newInput?.focus());
    });
    overlay.querySelector('[data-category-save]')?.addEventListener('click',async()=>{
      const button=overlay.querySelector('[data-category-save]');
      button.disabled=true;
      const added=await persistCustomCategory(newInput.value,msg);
      button.disabled=false;
      if(!added) return;
      categorySelect.innerHTML=categoryOptions(added);
      categorySelect.value=added;
      overlay.dataset.uploadCategory=added;
      newInput.value='';
      newWrap.classList.remove('open');
    });
    newInput?.addEventListener('keydown',e=>{
      if(e.key==='Enter'){e.preventDefault();overlay.querySelector('[data-category-save]')?.click();}
      else if(e.key==='Escape'){newWrap.classList.remove('open');}
    });
    titleInput?.focus();

    overlay.querySelector('[data-file-save]')?.addEventListener('click',async()=>{
      const title=titleInput.value.trim();
      const category=categorySelect.value.trim();
      const file=overlay.querySelector('[data-file-input]').files?.[0];
      msg.classList.remove('error');
      overlay.dataset.uploadCategory=category;
      if(!title){msg.textContent='Geef eerst een naam op.';msg.classList.add('error');return}
      if(!category){msg.textContent='Kies eerst een soort bewijsstuk.';msg.classList.add('error');return}
      if(!file){msg.textContent='Kies eerst een bestand van je computer.';msg.classList.add('error');return}
      if(file.size>25*1024*1024){msg.textContent='Het bestand is groter dan 25 MB.';msg.classList.add('error');return}
      const {data:sessionData}=await client.auth.getSession();
      const session=sessionData?.session;
      if(!session){msg.textContent='Je bent niet meer ingelogd. Log opnieuw in.';msg.classList.add('error');return}
      const id=crypto.randomUUID();
      const path=`${safeName(category).toLowerCase()}/${id}/${safeName(file.name)}`;
      msg.textContent='Bestand uploaden…';
      const {error:uploadError}=await client.storage.from(BUCKET).upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});
      if(uploadError){msg.textContent='Uploaden mislukt: '+uploadError.message;msg.classList.add('error');return}
      try{
        const order=await nextSortOrder(category);
        const {error:rowError}=await client.from('portfolio_files').insert({id,category,title,storage_path:path,file_name:file.name,mime_type:file.type||null,sort_order:order,uploaded_by:session.user.id});
        if(rowError) throw rowError;
      }catch(err){
        await client.storage.from(BUCKET).remove([path]);
        msg.textContent='Opslaan mislukt: '+(err?.message||'onbekende fout');
        msg.classList.add('error');
        return;
      }
      msg.textContent='Bestand toegevoegd.';
      await loadFiles();
      setTimeout(close,350);
    });
  }

  function viewerContent(item){
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
      await docx.renderAsync(buffer,host,undefined,{inWrapper:true,breakPages:true,ignoreLastRenderedPageBreak:false});
    }catch(err){
      console.error('Word-document kon niet in het portfolio worden weergegeven:',err);
      if(!paper.isConnected||paper.dataset.renderId!==renderId) return;
      const officeUrl=`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
      paper.innerHTML=`<div class="docx-preview-error"><div><p>Het Word-document kon niet in de ingebouwde weergave worden geladen.</p><p class="docx-preview-error-detail">${esc(err?.message||'Onbekende fout')}</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Bestand openen</a></p><p><a href="${esc(officeUrl)}" target="_blank" rel="noopener">Openen via Microsoft Office Online</a></p></div></div>`;
    }
  }

  function openViewer(category,index){
    const list=files.filter(item=>item.category===category);
    if(!list.length) return;
    let current=((index%list.length)+list.length)%list.length;
    let renderSequence=0;
    const overlay=document.createElement('div');
    overlay.className='file-viewer-overlay';
    overlay.innerHTML=`<button class="file-nav-arrow prev" type="button" aria-label="Vorige">‹</button><section class="file-viewer-card" role="dialog" aria-modal="true"><header class="file-viewer-head"><strong data-view-title></strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header><div class="file-viewer-stage"><div class="file-paper" data-file-paper></div></div><span class="file-viewer-count" data-view-count></span></section><button class="file-nav-arrow next" type="button" aria-label="Volgende">›</button>`;
    document.body.appendChild(overlay);
    const render=()=>{
      const item=list[current];
      const paper=overlay.querySelector('[data-file-paper]');
      const renderId=String(++renderSequence);
      paper.dataset.renderId=renderId;
      paper.classList.remove('docx-paper');
      overlay.querySelector('[data-view-title]').textContent=item.title;
      if(isDocx(item)) renderDocx(item,paper,renderId);
      else paper.innerHTML=viewerContent(item);
      overlay.querySelector('[data-view-count]').textContent=`${current+1} / ${list.length}`;
      overlay.querySelector('.file-viewer-stage').scrollTop=0;
    };
    const move=delta=>{current=(current+delta+list.length)%list.length;render()};
    const close=()=>{renderSequence+=1;document.removeEventListener('keydown',keyHandler);overlay.remove()};
    const keyHandler=e=>{if(e.key==='ArrowLeft')move(-1);else if(e.key==='ArrowRight')move(1);else if(e.key==='Escape')close()};
    overlay.querySelector('.prev').addEventListener('click',()=>move(-1));
    overlay.querySelector('.next').addEventListener('click',()=>move(1));
    overlay.querySelector('.file-viewer-close').addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    document.addEventListener('keydown',keyHandler);
    render();
  }

  function normalizeIds(value){
    return uniqueCategories(String(value||'').split(',').map(id=>id.trim().toLowerCase()).filter(Boolean));
  }

  function renderChooserGroup(title,items,selectedSet){
    if(!items.length) return '';
    return `<section class="text-file-link-group"><h4>${esc(title)}</h4>${items.map(item=>`<label class="text-file-choice"><input type="checkbox" value="${esc(item.id)}" data-link-file-check${selectedSet.has(String(item.id).toLowerCase())?' checked':''}><span>${esc(item.title)}</span></label>`).join('')}</section>`;
  }

  async function openDynamicLinkChooser(detail){
    const overlay=document.createElement('div');
    overlay.className='text-file-link-overlay';
    const close=(restore=true)=>{
      detail?.clearSelectionPreview?.();
      overlay.remove();
      if(restore) requestAnimationFrame(()=>detail?.restoreSelection?.());
    };
    if(!detail?.hasSelection){
      overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Koppel aan document</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">Selecteer eerst de tekst die je aan één of meer documenten wilt koppelen.</p></div></section>';
      document.body.appendChild(overlay);
      overlay.querySelector('.text-file-link-close')?.addEventListener('click',()=>close(false));
      return;
    }
    overlay.innerHTML='<section class="text-file-link-dialog" role="dialog" aria-modal="true"><header class="text-file-link-head"><strong>Koppel aan document</strong><button class="text-file-link-close" type="button" aria-label="Sluiten">×</button></header><div class="text-file-link-body"><p class="text-file-link-intro">Bestanden laden…</p></div></section>';
    document.body.appendChild(overlay);
    overlay.querySelector('.text-file-link-close')?.addEventListener('click',()=>close(true));
    try{
      const {data,error}=await client.from('portfolio_files')
        .select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at')
        .order('sort_order',{ascending:true})
        .order('created_at',{ascending:true});
      if(error) throw error;
      const rows=(data||[]).map(row=>({...row,_displayCategory:normalizeCategory(row.category)}));
      const existingIds=normalizeIds((detail.existingFileIds||[]).join(','));
      const selectedSet=new Set(existingIds);
      const grouped=new Map();
      rows.forEach(row=>{
        const key=row._displayCategory||'Bijlage';
        if(!grouped.has(key)) grouped.set(key,[]);
        grouped.get(key).push(row);
      });
      const body=overlay.querySelector('.text-file-link-body');
      body.innerHTML=`
        <p class="text-file-link-intro">Selecteer één of meer documenten die je aan deze tekst wilt koppelen.</p>
        ${existingIds.length?'<p class="text-file-link-note">Bestaande koppelingen in deze selectie zijn al aangevinkt. Als maar een deel van de geselecteerde tekst al gekoppeld was, geldt je keuze na Opslaan voor de hele geselecteerde tekst.</p>':''}
        <p class="text-file-link-selection"><strong>Geselecteerde tekst:</strong> ${esc(detail.selectedText||'')}</p>
        ${[...grouped.keys()].sort(compareCategories).map(name=>renderChooserGroup(name,grouped.get(name)||[],selectedSet)).join('')||'<p class="text-file-link-empty">Nog geen bewijsstukken toegevoegd.</p>'}
        <div class="text-file-link-actions"><button class="text-file-link-btn secondary" type="button" data-link-cancel>Annuleren</button><button class="text-file-link-btn" type="button" data-link-apply>Koppelen</button></div>`;
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
        const ok=detail.applyFileLinks?detail.applyFileLinks(selectedItems):(selectedItems[0]?detail.applyFileLink?.(selectedItems[0]):false);
        if(ok) close(false);
      });
      update();
    }catch(err){
      console.error('Bestanden voor tekstkoppeling laden mislukt:',err);
      const body=overlay.querySelector('.text-file-link-body');
      if(body) body.innerHTML='<p class="text-file-link-intro">De documenten konden niet worden geladen.</p>';
    }
  }

  document.addEventListener('portfolio:link-file-request',event=>{
    event.stopImmediatePropagation();
    openDynamicLinkChooser(event.detail);
  },true);

  ensurePortfolioStructure();
  requestAnimationFrame(()=>{
    ensurePortfolioStructure();
    renderRegister();
  });
  loadFiles();
  window.portfolioFiles={reload:loadFiles,openUpload,getFiles:()=>files.slice(),getCategories:()=>allCategoryChoices().slice()};
})();