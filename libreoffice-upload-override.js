(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const MAX_BYTES=25*1024*1024;
  const OFFICE_EXTENSIONS=new Set(['docx','xlsx','pptx']);
  const LO_CDN='https://erseco.github.io/libreoffice-document-converter/';
  const LO_MODULE=`${LO_CDN}dist/browser.js`;
  const JSZIP_SRC='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const RELOAD_KEY='portfolio-libreoffice-isolation-reload-v1';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  let pendingCategory='';
  let jszipPromise=null;
  let converterPromise=null;
  let progressMessage=null;

  const extFromName=name=>{
    const clean=String(name||'').split(/[?#]/)[0];
    const dot=clean.lastIndexOf('.');
    return dot>=0?clean.slice(dot+1).toLowerCase():'';
  };
  const baseName=name=>{
    const clean=String(name||'bestand').replace(/^.*[\\/]/,'');
    const dot=clean.lastIndexOf('.');
    return (dot>0?clean.slice(0,dot):clean)||'bestand';
  };
  const safeName=name=>String(name||'bestand').replace(/[^a-z0-9._-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-120)||'bestand';

  function setMessage(node,text,state=''){
    if(!node) return;
    node.textContent=text;
    if(state) node.dataset.conversionMessage=state;
    else delete node.dataset.conversionMessage;
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

  async function getJSZip(){
    if(window.JSZip) return window.JSZip;
    if(jszipPromise) return jszipPromise;
    jszipPromise=loadScript(JSZIP_SRC,()=>!!window.JSZip)
      .then(()=>window.JSZip)
      .catch(err=>{jszipPromise=null;throw err;});
    return jszipPromise;
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

  async function repairDocxOnly(bytes){
    const JSZip=await getJSZip();
    const zip=await JSZip.loadAsync(bytes);
    let changes=0;
    const names=Object.keys(zip.files).filter(name=>
      !zip.files[name].dir&&(/\.xml$/i.test(name)||/\.rels$/i.test(name))
    );
    for(const name of names){
      const original=await zip.files[name].async('string');
      const repaired=dedupeXmlAttributes(original);
      if(repaired.changes){
        changes+=repaired.changes;
        zip.file(name,repaired.xml);
      }
    }
    if(!changes) return bytes;
    console.info(`LibreOffice-conversie: ${changes} dubbel XML-attribuut${changes===1?'':'en'} tijdelijk hersteld.`);
    return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
  }

  async function bootstrapIsolation(){
    if(window.crossOriginIsolated&&typeof SharedArrayBuffer!=='undefined'){
      try{sessionStorage.removeItem(RELOAD_KEY);}catch(_err){}
      return;
    }
    if(!window.isSecureContext||!navigator.serviceWorker) return;
    try{
      const swUrl=new URL('libreoffice-coi-serviceworker.js?v=20260928-1',document.baseURI).href;
      await navigator.serviceWorker.register(swUrl,{scope:'./'});
      await navigator.serviceWorker.ready;
      let reloaded='';
      try{reloaded=sessionStorage.getItem(RELOAD_KEY)||'';}catch(_err){}
      if(reloaded!=='1'){
        try{sessionStorage.setItem(RELOAD_KEY,'1');}catch(_err){}
        window.location.reload();
      }
    }catch(err){
      console.warn('LibreOffice browserisolatie kon niet worden geactiveerd; de bestaande converter blijft beschikbaar.',err);
    }
  }

  bootstrapIsolation();

  async function getLibreOfficeConverter(msg){
    if(!window.crossOriginIsolated||typeof SharedArrayBuffer==='undefined'){
      throw new Error('LIBREOFFICE_ISOLATION_UNAVAILABLE');
    }
    progressMessage=msg||null;
    if(converterPromise) return converterPromise;

    setMessage(msg,'LibreOffice-converter laden… De eerste keer wordt ongeveer 235 MB eenmalig gedownload.','busy');
    converterPromise=import(LO_MODULE).then(async mod=>{
      const WorkerBrowserConverter=mod.WorkerBrowserConverter;
      if(typeof WorkerBrowserConverter!=='function') throw new Error('LibreOffice-module is niet beschikbaar.');
      const converter=new WorkerBrowserConverter({
        sofficeJs:`${LO_CDN}wasm/soffice.js`,
        sofficeWasm:`${LO_CDN}wasm/soffice.wasm`,
        sofficeData:`${LO_CDN}wasm/soffice.data`,
        sofficeWorkerJs:new URL('libreoffice-soffice-worker-proxy.js',document.baseURI).href,
        browserWorkerJs:new URL('libreoffice-worker-proxy.js',document.baseURI).href,
        verbose:false,
        onProgress:info=>{
          const percent=Number(info?.percent);
          const suffix=Number.isFinite(percent)&&percent>0?` ${Math.round(percent)}%`:'';
          setMessage(progressMessage,`LibreOffice-converter laden…${suffix}`,'busy');
        }
      });
      await converter.initialize();
      return converter;
    }).catch(err=>{
      converterPromise=null;
      throw err;
    });
    return converterPromise;
  }

  async function convertWithLibreOffice(file,msg){
    const extension=extFromName(file.name);
    let bytes=new Uint8Array(await file.arrayBuffer());
    if(extension==='docx') bytes=await repairDocxOnly(bytes);

    const converter=await getLibreOfficeConverter(msg);
    setMessage(msg,'Document met LibreOffice omzetten naar PDF…','busy');
    progressMessage=msg||null;
    const result=await converter.convert(bytes,{outputFormat:'pdf'},file.name);
    const pdfBytes=result?.data;
    if(!pdfBytes?.length) throw new Error('LibreOffice leverde geen PDF op.');
    return new File([pdfBytes],`${baseName(file.name)}.pdf`,{
      type:'application/pdf',
      lastModified:Date.now()
    });
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

  async function uploadPdf(category,title,pdf,session){
    const id=crypto.randomUUID();
    const path=`${category}/${id}/${safeName(pdf.name)}`;
    const {error:uploadError}=await client.storage.from(BUCKET).upload(path,pdf,{
      contentType:'application/pdf',
      upsert:false
    });
    if(uploadError) throw uploadError;
    try{
      const sortOrder=await nextSortOrder(category);
      const {error:rowError}=await client.from('portfolio_files').insert({
        id,
        category,
        title,
        storage_path:path,
        file_name:pdf.name,
        mime_type:'application/pdf',
        sort_order:sortOrder,
        uploaded_by:session.user.id
      });
      if(rowError) throw rowError;
    }catch(err){
      await client.storage.from(BUCKET).remove([path]);
      throw err;
    }
  }

  function fallBackToExisting(button,msg){
    setMessage(msg,'LibreOffice-conversie is hier niet beschikbaar. De bestaande converter wordt gebruikt…','busy');
    button.disabled=false;
    button.dataset.libreofficeBypass='1';
    setTimeout(()=>{
      try{button.click();}
      finally{setTimeout(()=>delete button.dataset.libreofficeBypass,0);}
    },40);
  }

  async function handleOfficeSave(event,button,file){
    event.preventDefault();
    event.stopImmediatePropagation();

    const overlay=button.closest('.file-upload-overlay');
    if(!overlay||button.disabled) return;
    const category=overlay.dataset.uploadCategory||pendingCategory;
    const title=overlay.querySelector('[data-file-title]')?.value?.trim()||'';
    const msg=overlay.querySelector('[data-file-message]');

    if(!category){setMessage(msg,'De uploadlocatie kon niet worden bepaald. Sluit dit venster en probeer opnieuw.','error');return;}
    if(!title){setMessage(msg,'Geef eerst een titel op.','error');return;}
    if(file.size>MAX_BYTES){setMessage(msg,'Het bestand is groter dan 25 MB.','error');return;}

    if(!window.crossOriginIsolated||typeof SharedArrayBuffer==='undefined'){
      fallBackToExisting(button,msg);
      return;
    }

    button.disabled=true;
    try{
      const {data:sessionData}=await client.auth.getSession();
      const session=sessionData?.session;
      if(!session) throw new Error('Je bent niet meer ingelogd. Log opnieuw in.');

      const pdf=await convertWithLibreOffice(file,msg);
      if(pdf.size>MAX_BYTES) throw new Error('De omgezette PDF is groter dan 25 MB.');

      setMessage(msg,'PDF uploaden…','busy');
      await uploadPdf(category,title,pdf,session);
      setMessage(msg,'Document is met LibreOffice omgezet naar PDF en toegevoegd.','success');
      await window.portfolioFiles?.reload?.();
      setTimeout(()=>overlay.remove(),900);
    }catch(err){
      console.error('LibreOffice DOCX/XLSX/PPTX-conversie mislukt:',err);
      const raw=String(err?.message||'');
      if(/25 MB|ingelogd/i.test(raw)){
        setMessage(msg,raw,'error');
        button.disabled=false;
        return;
      }
      fallBackToExisting(button,msg);
    }finally{
      progressMessage=null;
    }
  }

  window.addEventListener('click',event=>{
    const uploadButton=event.target.closest?.('[data-file-upload-button]');
    if(uploadButton){
      pendingCategory=uploadButton.dataset.fileUploadButton||'';
      return;
    }

    const saveButton=event.target.closest?.('[data-file-save]');
    if(!saveButton||saveButton.dataset.libreofficeBypass==='1') return;
    const overlay=saveButton.closest('.file-upload-overlay');
    const file=overlay?.querySelector('[data-file-input]')?.files?.[0];
    if(!file||!OFFICE_EXTENSIONS.has(extFromName(file.name))) return;

    handleOfficeSave(event,saveButton,file);
  },true);
})();
