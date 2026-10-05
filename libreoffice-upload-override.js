(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const MAX_BYTES=25*1024*1024;
  const INIT_TIMEOUT_MS=15*60*1000;
  const CONVERT_TIMEOUT_MS=10*60*1000;
  const OFFICE_EXTENSIONS=new Set(['docx','xlsx','pptx']);
  const LO_CDN='https://erseco.github.io/libreoffice-document-converter/';
  const LO_MODULE=`${LO_CDN}dist/browser.js`;
  const JSZIP_SRC='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const SW_URL='libreoffice-coi-serviceworker.js?v=20260928-5';
  const RELOAD_KEY='portfolio-libreoffice-isolation-reload-v5';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  let pendingCategory='';
  let jszipPromise=null;
  let converterPromise=null;
  let progressMessage=null;
  let isolationPromise=null;

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

  function withTimeout(promise,ms,message){
    return new Promise((resolve,reject)=>{
      let settled=false;
      const timer=setTimeout(()=>{
        if(settled) return;
        settled=true;
        reject(new Error(message));
      },ms);
      Promise.resolve(promise).then(value=>{
        if(settled) return;
        settled=true;
        clearTimeout(timer);
        resolve(value);
      },error=>{
        if(settled) return;
        settled=true;
        clearTimeout(timer);
        reject(error);
      });
    });
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
      script.crossOrigin='anonymous';
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

  async function repairOpenXmlPackage(bytes){
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
    console.info(`[LibreOffice] ${changes} dubbel XML-attribuut${changes===1?'':'en'} tijdelijk hersteld.`);
    return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
  }

  function hasIsolation(){
    return window.crossOriginIsolated&&typeof SharedArrayBuffer!=='undefined';
  }

  async function ensureIsolation({silent=false}={}){
    if(hasIsolation()){
      try{sessionStorage.removeItem(RELOAD_KEY);}catch(_err){}
      return true;
    }
    if(isolationPromise) return isolationPromise;
    isolationPromise=(async()=>{
      if(!window.isSecureContext||!navigator.serviceWorker){
        if(silent) return false;
        throw new Error('Deze browser kan de beveiligde LibreOffice-omgeving niet starten.');
      }
      console.info('[LibreOffice] Browserisolatie activeren.');
      const registration=await navigator.serviceWorker.register(new URL(SW_URL,document.baseURI).href,{
        scope:'./',
        updateViaCache:'none'
      });
      try{await registration.update();}catch(_err){}
      await navigator.serviceWorker.ready;

      if(hasIsolation()){
        try{sessionStorage.removeItem(RELOAD_KEY);}catch(_err){}
        return true;
      }

      let reloaded='';
      try{reloaded=sessionStorage.getItem(RELOAD_KEY)||'';}catch(_err){}
      if(reloaded!=='1'){
        try{sessionStorage.setItem(RELOAD_KEY,'1');}catch(_err){}
        console.info('[LibreOffice] Pagina eenmalig herladen om browserisolatie toe te passen.');
        window.location.reload();
        return false;
      }

      if(silent) return false;
      throw new Error('LibreOffice-browserisolatie werd na herladen niet actief.');
    })().finally(()=>{isolationPromise=null;});
    return isolationPromise;
  }

  async function bootstrapIsolationForSignedInEditor(){
    try{
      const {data}=await client.auth.getSession();
      if(!data?.session) return;
      await ensureIsolation({silent:true});
    }catch(err){
      console.warn('[LibreOffice] Automatische voorbereiding kon niet worden afgerond:',err);
    }
  }

  bootstrapIsolationForSignedInEditor();
  client.auth.onAuthStateChange?.((_event,session)=>{
    if(!session) return;
    setTimeout(()=>ensureIsolation({silent:true}).catch(()=>{}),0);
  });

  function copyToUint8Array(value){
    let view=null;
    if(value instanceof Uint8Array){
      view=value;
    }else if(ArrayBuffer.isView(value)){
      view=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
    }else if(value instanceof ArrayBuffer){
      view=new Uint8Array(value);
    }else if(typeof SharedArrayBuffer!=='undefined'&&value instanceof SharedArrayBuffer){
      view=new Uint8Array(value);
    }else if(value?.buffer&&(value.buffer instanceof ArrayBuffer||
      (typeof SharedArrayBuffer!=='undefined'&&value.buffer instanceof SharedArrayBuffer))){
      view=new Uint8Array(value.buffer,Number(value.byteOffset)||0,Number(value.byteLength)||value.buffer.byteLength);
    }
    if(!view?.byteLength) return null;
    const copy=new Uint8Array(view.byteLength);
    copy.set(view);
    return copy;
  }

  async function getLibreOfficeConverter(msg){
    if(!hasIsolation()){
      throw new Error('LibreOffice-browserisolatie is niet actief. Herlaad de pagina en probeer opnieuw.');
    }
    progressMessage=msg||null;
    if(converterPromise) return converterPromise;

    setMessage(msg,'LibreOffice voorbereiden… De eerste keer wordt ongeveer 240 MB geladen. Op tragere apparaten kan dit meerdere minuten duren.','busy');
    console.info('[LibreOffice] Module laden.');

    converterPromise=import(LO_MODULE).then(async mod=>{
      const WorkerBrowserConverter=mod.WorkerBrowserConverter;
      if(typeof WorkerBrowserConverter!=='function'){
        throw new Error('LibreOffice-browsermodule is niet beschikbaar.');
      }
      const converter=new WorkerBrowserConverter({
        sofficeJs:new URL('libreoffice-soffice-proxy.js',document.baseURI).href,
        sofficeWasm:`${LO_CDN}wasm/soffice.wasm`,
        sofficeData:`${LO_CDN}wasm/soffice.data`,
        sofficeWorkerJs:new URL('libreoffice-soffice-worker-proxy.js',document.baseURI).href,
        browserWorkerJs:new URL('libreoffice-worker-proxy.js',document.baseURI).href,
        verbose:false,
        onProgress:info=>{
          const percent=Number(info?.percent);
          const pct=Number.isFinite(percent)&&percent>=0?` ${Math.round(percent)}%`:'';
          const detail=String(info?.message||'').trim();
          setMessage(progressMessage,`LibreOffice voorbereiden…${pct}${detail?` — ${detail}`:''}`,'busy');
        }
      });
      console.info('[LibreOffice] Initialisatie starten.');
      await withTimeout(
        converter.initialize(),
        INIT_TIMEOUT_MS,
        'LibreOffice kon niet binnen 15 minuten worden voorbereid.'
      );
      console.info('[LibreOffice] Initialisatie geslaagd.');
      return converter;
    }).catch(err=>{
      converterPromise=null;
      throw err;
    });
    return converterPromise;
  }

  async function convertWithLibreOffice(file,msg){
    let bytes=new Uint8Array(await file.arrayBuffer());
    bytes=await repairOpenXmlPackage(bytes);

    const converter=await getLibreOfficeConverter(msg);
    setMessage(msg,'Document met LibreOffice omzetten naar PDF… Op tragere apparaten kan dit enkele minuten duren.','busy');
    progressMessage=msg||null;
    console.info(`[LibreOffice] Conversie starten: ${file.name}, ${bytes.length} bytes.`);

    const result=await withTimeout(
      converter.convert(bytes,{outputFormat:'pdf'},file.name),
      CONVERT_TIMEOUT_MS,
      'De LibreOffice-conversie duurde langer dan 10 minuten.'
    );
    const pdfBytes=copyToUint8Array(result?.data);
    if(!pdfBytes?.length) throw new Error('LibreOffice leverde geen PDF op.');
    console.info(`[LibreOffice] Conversie geslaagd: ${pdfBytes.length} PDF-bytes.`);

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

    if(!hasIsolation()){
      button.disabled=true;
      setMessage(msg,'LibreOffice voorbereiden… De pagina wordt één keer herladen. Kies het bestand daarna opnieuw.','busy');
      try{
        const ready=await ensureIsolation({silent:false});
        if(ready){
          setMessage(msg,'LibreOffice is gereed. Klik opnieuw op Uploaden.','success');
          button.disabled=false;
        }
      }catch(err){
        setMessage(msg,`LibreOffice kon niet worden voorbereid: ${String(err?.message||err)}`,'error');
        button.disabled=false;
      }
      return;
    }

    button.disabled=true;
    try{
      const {data:sessionData}=await client.auth.getSession();
      const session=sessionData?.session;
      if(!session) throw new Error('Je bent niet meer ingelogd. Log opnieuw in.');

      const pdf=await convertWithLibreOffice(file,msg);
      if(pdf.size>MAX_BYTES) throw new Error('De omgezette PDF is groter dan 25 MB.');

      setMessage(msg,'LibreOffice-conversie geslaagd — PDF uploaden…','busy');
      await uploadPdf(category,title,pdf,session);
      setMessage(msg,'Document is met LibreOffice omgezet naar PDF en toegevoegd.','success');
      await window.portfolioFiles?.reload?.();
      setTimeout(()=>overlay.remove(),1400);
    }catch(err){
      console.error('[LibreOffice] DOCX/XLSX/PPTX-verwerking mislukt:',err);
      const raw=String(err?.message||'Onbekende fout.');
      const preparationFailure=/voorbereid|initialis|browserisolatie|browsermodule|converter laden/i.test(raw);
      setMessage(msg,`${preparationFailure?'LibreOffice voorbereiden':'LibreOffice-conversie'} mislukt: ${raw}`,'error');
      button.disabled=false;
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
    if(!saveButton) return;
    const overlay=saveButton.closest('.file-upload-overlay');
    const file=overlay?.querySelector('[data-file-input]')?.files?.[0];
    if(!file||!OFFICE_EXTENSIONS.has(extFromName(file.name))) return;

    handleOfficeSave(event,saveButton,file);
  },true);
})();
