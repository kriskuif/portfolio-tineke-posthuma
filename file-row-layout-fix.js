(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const REAM_SRC='https://cdn.jsdelivr.net/npm/reamkit@1.29.0/+esm';
  const JSZIP_SRC='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const HEIC2ANY_SRC='https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
  const ACCEPT='.pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.webp,.heic,.heif';
  const MAX_BYTES=25*1024*1024;
  const OFFICE_TO_PDF=new Set(['docx','xlsx','pptx']);
  const DIRECT_IMAGES=new Set(['jpg','jpeg','png','webp']);
  const HEIC_IMAGES=new Set(['heic','heif']);
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);

  let pendingCategory='';
  let reamPromise=null;
  let jszipPromise=null;
  let heicPromise=null;

  const style=document.createElement('style');
  style.textContent=`
    .portfolio-file-list{align-content:start!important;grid-auto-rows:max-content!important}
    .portfolio-file-row{align-self:start!important;height:max-content!important}
    body.can-edit .portfolio-file-link{padding-right:92px!important}
    body.can-edit .portfolio-file-edit{right:46px!important}
    .portfolio-file-delete{position:absolute;right:6px;top:0;bottom:0;margin-block:auto;width:34px;height:34px;padding:0;border:1px solid #d7dfda;border-radius:9px;background:#fff;color:#75635d;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.76;transition:opacity .14s ease,background .14s ease,border-color .14s ease,color .14s ease,transform .14s ease}
    .portfolio-file-delete svg{width:16px;height:16px;pointer-events:none}
    .portfolio-file-delete:hover,.portfolio-file-delete:focus-visible{opacity:1;background:#f8eeec;border-color:#d9b6b0;color:#93453d;outline:none;transform:translateY(-1px)}
    body:not(.can-edit) .portfolio-file-delete{display:none!important}
    .portfolio-normal-viewer{z-index:4060}
    .portfolio-normal-viewer.single-file .file-nav-arrow,.portfolio-normal-viewer.single-file .file-viewer-count{display:none!important}
    .portfolio-normal-viewer .file-paper.normal-paper{width:min(100%,900px);height:100%;min-height:100%;aspect-ratio:auto;overflow:auto;background:#fff}
    .portfolio-normal-viewer .legacy-office-note{min-height:420px;display:grid;place-items:center;padding:30px;text-align:center;color:#536159;background:#fff}
    .portfolio-normal-viewer .legacy-office-note p{max-width:560px;margin:0 auto 13px}
    .portfolio-normal-viewer .legacy-office-note a{color:#1f5e4a;font-weight:850}
    .file-upload-message[data-conversion-message="busy"]{color:#315f4d;font-weight:700}
    .file-upload-message[data-conversion-message="error"]{color:#8b3e35}
    .file-upload-message[data-conversion-message="success"]{color:#1f5e4a;font-weight:800}
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const extFromName=name=>{
    const clean=String(name||'').split(/[?#]/)[0];
    const dot=clean.lastIndexOf('.');
    return dot>=0?clean.slice(dot+1).toLowerCase():'';
  };
  const ext=item=>extFromName(item?.file_name||item?.storage_path||'');
  const baseName=name=>{
    const clean=String(name||'bestand').replace(/^.*[\\/]/,'');
    const dot=clean.lastIndexOf('.');
    return (dot>0?clean.slice(0,dot):clean)||'bestand';
  };
  const safeName=name=>String(name||'bestand').replace(/[^a-z0-9._-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-120)||'bestand';
  const publicUrl=item=>client?.storage.from(BUCKET).getPublicUrl(item.storage_path).data.publicUrl||'';
  const isImage=item=>String(item?.mime_type||'').toLowerCase().startsWith('image/')||DIRECT_IMAGES.has(ext(item));
  const isPdf=item=>String(item?.mime_type||'').toLowerCase()==='application/pdf'||ext(item)==='pdf';
  const isLegacyOffice=item=>OFFICE_TO_PDF.has(ext(item));

  function setMessage(msg,text,state=''){
    if(!msg) return;
    msg.textContent=text;
    if(state) msg.dataset.conversionMessage=state;
    else delete msg.dataset.conversionMessage;
  }

  function loadScript(src,test){
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

  async function getReam(){
    if(reamPromise) return reamPromise;
    reamPromise=import(REAM_SRC).then(mod=>{
      const Ream=mod.Ream||mod.default?.Ream||mod.default;
      if(!Ream?.parse) throw new Error('Documentconverter kon niet worden geladen.');
      return Ream;
    }).catch(err=>{reamPromise=null;throw err;});
    return reamPromise;
  }

  async function getJSZip(){
    if(window.JSZip) return window.JSZip;
    if(jszipPromise) return jszipPromise;
    jszipPromise=loadScript(JSZIP_SRC,()=>!!window.JSZip).then(()=>window.JSZip).catch(err=>{jszipPromise=null;throw err;});
    return jszipPromise;
  }

  async function getHeic2Any(){
    if(window.heic2any) return window.heic2any;
    if(heicPromise) return heicPromise;
    heicPromise=loadScript(HEIC2ANY_SRC,()=>typeof window.heic2any==='function').then(()=>window.heic2any).catch(err=>{heicPromise=null;throw err;});
    return heicPromise;
  }

  function dedupeXmlAttributes(xml){
    let changes=0;
    const repaired=String(xml).replace(/<[^<>]+>/g,tag=>{
      if(/^<\s*[!?/]/.test(tag)) return tag;
      const selfClosing=/\/\s*>$/.test(tag);
      const end=selfClosing?'/>' :'>';
      const body=tag.slice(1,tag.length-end.length);
      const firstSpace=body.search(/\s/);
      if(firstSpace<0) return tag;
      const name=body.slice(0,firstSpace);
      const attrs=body.slice(firstSpace);
      const seen=new Set();
      const attrRe=/(\s+)([^\s=]+)(\s*=\s*)(["'])([\s\S]*?)\4/g;
      let out='';
      let last=0;
      let match;
      while((match=attrRe.exec(attrs))){
        out+=attrs.slice(last,match.index);
        const key=match[2];
        if(!seen.has(key)){
          seen.add(key);
          out+=match[0];
        }else{
          changes+=1;
        }
        last=attrRe.lastIndex;
      }
      out+=attrs.slice(last);
      return `<${name}${out}${end}`;
    });
    return {xml:repaired,changes};
  }

  async function repairDocx(bytes){
    const JSZip=await getJSZip();
    const zip=await JSZip.loadAsync(bytes);
    let totalChanges=0;
    const names=Object.keys(zip.files).filter(name=>!zip.files[name].dir&&(/\.xml$/i.test(name)||/\.rels$/i.test(name)));
    for(const name of names){
      const original=await zip.files[name].async('string');
      const repaired=dedupeXmlAttributes(original);
      if(repaired.changes){
        totalChanges+=repaired.changes;
        zip.file(name,repaired.xml);
      }
    }
    if(!totalChanges) return bytes;
    console.info(`DOCX-preview/conversie: ${totalChanges} dubbel XML-attribuut${totalChanges===1?'':'en'} tijdelijk hersteld.`);
    return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
  }

  async function convertOfficeToPdf(file){
    const extension=extFromName(file.name);
    let bytes=new Uint8Array(await file.arrayBuffer());
    if(extension==='docx'){
      try{bytes=await repairDocx(bytes);}catch(err){console.warn('DOCX vooraf herstellen overgeslagen:',err);}
    }
    const Ream=await getReam();
    const doc=Ream.parse(bytes);
    const pdf=await doc.convert('pdf');
    if(!pdf?.length) throw new Error('De converter leverde geen PDF op.');
    return new File([pdf],`${baseName(file.name)}.pdf`,{type:'application/pdf',lastModified:Date.now()});
  }

  async function convertHeicToJpeg(file){
    const heic2any=await getHeic2Any();
    const converted=await heic2any({blob:file,toType:'image/jpeg',quality:0.92});
    const blob=Array.isArray(converted)?converted[0]:converted;
    if(!(blob instanceof Blob)) throw new Error('De afbeelding kon niet worden geconverteerd.');
    return new File([blob],`${baseName(file.name)}.jpg`,{type:'image/jpeg',lastModified:Date.now()});
  }

  function directImageMime(extension,current){
    if(current&&current.startsWith('image/')) return current;
    return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'})[extension]||'application/octet-stream';
  }

  async function prepareUpload(file,msg){
    const extension=extFromName(file.name);
    if(file.size>MAX_BYTES) throw new Error('Het bestand is groter dan 25 MB.');
    if(extension==='pdf') return {file:new File([file],file.name,{type:'application/pdf',lastModified:file.lastModified}),success:'PDF toegevoegd.'};
    if(OFFICE_TO_PDF.has(extension)){
      setMessage(msg,'Document omzetten naar PDF…','busy');
      const pdf=await convertOfficeToPdf(file);
      if(pdf.size>MAX_BYTES) throw new Error('De omgezette PDF is groter dan 25 MB.');
      return {file:pdf,success:'Document is omgezet naar PDF en toegevoegd.'};
    }
    if(DIRECT_IMAGES.has(extension)){
      const mime=directImageMime(extension,file.type);
      return {file:new File([file],file.name,{type:mime,lastModified:file.lastModified}),success:'Afbeelding toegevoegd.'};
    }
    if(HEIC_IMAGES.has(extension)){
      setMessage(msg,'Afbeelding omzetten naar JPEG…','busy');
      const jpeg=await convertHeicToJpeg(file);
      if(jpeg.size>MAX_BYTES) throw new Error('De omgezette afbeelding is groter dan 25 MB.');
      return {file:jpeg,success:'Afbeelding is omgezet naar JPEG en toegevoegd.'};
    }
    throw new Error('Dit bestandstype wordt niet ondersteund. Gebruik PDF, DOCX, XLSX, PPTX, JPG, JPEG, PNG, WebP, HEIC of HEIF.');
  }

  async function nextSortOrder(category){
    const {data,error}=await client.from('portfolio_files').select('sort_order').eq('category',category).order('sort_order',{ascending:false}).limit(1);
    if(error) throw error;
    return (Number(data?.[0]?.sort_order)||0)+1000;
  }

  async function uploadPrepared(category,title,prepared,session){
    const id=crypto.randomUUID();
    const path=`${category}/${id}/${safeName(prepared.name)}`;
    const {error:uploadError}=await client.storage.from(BUCKET).upload(path,prepared,{contentType:prepared.type||'application/octet-stream',upsert:false});
    if(uploadError) throw uploadError;
    try{
      const order=await nextSortOrder(category);
      const {error:rowError}=await client.from('portfolio_files').insert({
        id,
        category,
        title,
        storage_path:path,
        file_name:prepared.name,
        mime_type:prepared.type||null,
        sort_order:order,
        uploaded_by:session.user.id
      });
      if(rowError) throw rowError;
    }catch(err){
      await client.storage.from(BUCKET).remove([path]);
      throw err;
    }
  }

  async function handleUploadSave(event,button){
    event.preventDefault();
    event.stopImmediatePropagation();
    const overlay=button.closest('.file-upload-overlay');
    if(!overlay||button.disabled) return;
    const category=overlay.dataset.uploadCategory||pendingCategory;
    const title=overlay.querySelector('[data-file-title]')?.value?.trim()||'';
    const file=overlay.querySelector('[data-file-input]')?.files?.[0];
    const msg=overlay.querySelector('[data-file-message]');
    if(!category){setMessage(msg,'De uploadlocatie kon niet worden bepaald. Sluit dit venster en probeer opnieuw.','error');return;}
    if(!title){setMessage(msg,'Geef eerst een titel op.','error');return;}
    if(!file){setMessage(msg,'Kies eerst een bestand van je computer.','error');return;}
    if(!client){setMessage(msg,'Uploaden is tijdelijk niet beschikbaar.','error');return;}

    button.disabled=true;
    try{
      const {data:sessionData}=await client.auth.getSession();
      const session=sessionData?.session;
      if(!session) throw new Error('Je bent niet meer ingelogd. Log opnieuw in.');
      const result=await prepareUpload(file,msg);
      setMessage(msg,result.file.type==='application/pdf'?'PDF uploaden…':'Bestand uploaden…','busy');
      await uploadPrepared(category,title,result.file,session);
      setMessage(msg,result.success,'success');
      await window.portfolioFiles?.reload?.();
      setTimeout(()=>overlay.remove(),900);
    }catch(err){
      console.error('Bestand voorbereiden/uploaden mislukt:',err);
      const extension=extFromName(file?.name);
      let text=err?.message||'Uploaden is mislukt.';
      if(OFFICE_TO_PDF.has(extension)&&!/25 MB|ingelogd|ondersteund|upload/i.test(text)){
        text='Het document kon niet naar PDF worden omgezet. Probeer het opnieuw of upload het document als PDF.';
      }else if(HEIC_IMAGES.has(extension)&&!/25 MB|ingelogd|ondersteund|upload/i.test(text)){
        text='De HEIC/HEIF-afbeelding kon niet naar JPEG worden omgezet. Probeer het opnieuw of upload de afbeelding als JPG of PNG.';
      }
      setMessage(msg,text,'error');
      button.disabled=false;
    }
  }

  function openDeleteFlow(row,editButton){
    const observer=new MutationObserver(()=>{
      const editor=document.querySelector('.file-title-overlay');
      const deleteAction=editor?.querySelector('[data-title-delete]');
      if(!editor||!deleteAction) return;
      observer.disconnect();
      deleteAction.click();
      const confirm=document.querySelector('.file-delete-confirm-overlay');
      confirm?.querySelector('[data-delete-cancel]')?.addEventListener('click',()=>{setTimeout(()=>editor.remove(),0);},{once:true});
    });
    observer.observe(document.body,{childList:true,subtree:true});
    editButton.click();
    setTimeout(()=>observer.disconnect(),2500);
  }

  function enhanceRows(){
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

  function enhanceUploadDialogs(){
    document.querySelectorAll('.file-upload-overlay').forEach(overlay=>{
      if(!overlay.dataset.uploadCategory&&pendingCategory) overlay.dataset.uploadCategory=pendingCategory;
      const input=overlay.querySelector('[data-file-input]');
      if(input) input.accept=ACCEPT;
    });
  }

  function renderItem(item,paper){
    const url=publicUrl(item);
    paper.className='file-paper normal-paper';
    if(isImage(item)){
      paper.innerHTML=`<img src="${esc(url)}" alt="${esc(item.title||item.file_name||'Afbeelding')}">`;
      return;
    }
    if(isPdf(item)){
      paper.innerHTML=`<iframe src="${esc(url)}#view=FitH" title="${esc(item.title||item.file_name||'PDF')}"></iframe>`;
      return;
    }
    if(isLegacyOffice(item)){
      paper.innerHTML=`<div class="legacy-office-note"><div><p>Dit is een eerder geüpload Office-bestand. Nieuwe Word-, Excel- en PowerPoint-bestanden worden bij upload automatisch naar PDF omgezet.</p><p>Upload dit bestand opnieuw om het voortaan direct als PDF in het portfolio te openen.</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Origineel bestand openen</a></p></div></div>`;
      return;
    }
    paper.innerHTML=`<div class="legacy-office-note"><div><p>Dit bestandstype kan niet rechtstreeks in het portfolio worden weergegeven.</p><p><a href="${esc(url)}" target="_blank" rel="noopener">Bestand openen</a></p></div></div>`;
  }

  function openViewer(items,startIndex=0){
    if(!items.length) return;
    document.querySelectorAll('.portfolio-normal-viewer,.linked-file-viewer,.file-viewer-overlay').forEach(node=>node.remove());
    let current=((startIndex%items.length)+items.length)%items.length;
    const overlay=document.createElement('div');
    overlay.className=`file-viewer-overlay portfolio-normal-viewer${items.length===1?' single-file':''}`;
    overlay.innerHTML=`
      <button class="file-nav-arrow prev" type="button" aria-label="Vorig bestand">‹</button>
      <section class="file-viewer-card" role="dialog" aria-modal="true">
        <header class="file-viewer-head"><strong data-normal-title></strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header>
        <div class="file-viewer-stage"><div class="file-paper" data-normal-paper></div></div>
        <span class="file-viewer-count" data-normal-count></span>
      </section>
      <button class="file-nav-arrow next" type="button" aria-label="Volgend bestand">›</button>`;
    document.body.appendChild(overlay);
    const render=()=>{
      const item=items[current];
      overlay.querySelector('[data-normal-title]').textContent=item.title||item.file_name||'Document';
      overlay.querySelector('[data-normal-count]').textContent=`${current+1} / ${items.length}`;
      renderItem(item,overlay.querySelector('[data-normal-paper]'));
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
    const {data,error}=await client.from('portfolio_files').select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at').eq('category',category).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
    if(error) throw error;
    return data||[];
  }

  async function rowsForIds(ids){
    if(!client||!ids.length) return [];
    const {data,error}=await client.from('portfolio_files').select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at').in('id',ids);
    if(error) throw error;
    const byId=new Map((data||[]).map(row=>[String(row.id).toLowerCase(),row]));
    return ids.map(id=>byId.get(id)).filter(Boolean);
  }

  function showLoadError(message){
    const overlay=document.createElement('div');
    overlay.className='file-viewer-overlay portfolio-normal-viewer single-file';
    overlay.innerHTML=`<section class="file-viewer-card" role="dialog" aria-modal="true"><header class="file-viewer-head"><strong>Document openen</strong><button class="file-viewer-close" type="button" aria-label="Sluiten">×</button></header><div class="file-viewer-stage"><div class="file-paper normal-paper"><div class="legacy-office-note"><p>${esc(message)}</p></div></div></div></section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.file-viewer-close')?.addEventListener('click',()=>overlay.remove());
  }

  document.addEventListener('click',event=>{
    const uploadButton=event.target.closest?.('[data-file-upload-button]');
    if(uploadButton){
      pendingCategory=uploadButton.dataset.fileUploadButton||'';
      setTimeout(enhanceUploadDialogs,0);
      return;
    }
    const saveButton=event.target.closest?.('[data-file-save]');
    if(saveButton&&saveButton.closest('.file-upload-overlay')){
      handleUploadSave(event,saveButton);
      return;
    }

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

  enhanceRows();
  enhanceUploadDialogs();
  new MutationObserver(()=>{enhanceRows();enhanceUploadDialogs();}).observe(document.body,{childList:true,subtree:true});
})();
