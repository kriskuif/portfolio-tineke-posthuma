(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const MAX_BYTES=25*1024*1024;
  const OFFICE_EXTENSIONS=new Set(['docx','xlsx','pptx']);
  const JSZIP_SRC='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const CONVERTER_ORIGIN='https://erseco.github.io';
  const CONVERTER_URL=`${CONVERTER_ORIGIN}/document-converter/?origins=${encodeURIComponent(location.origin)}`;
  const LEGACY_SW_NAME='libreoffice-coi-serviceworker.js';
  const LEGACY_RELOAD_KEY='portfolio-libreoffice-legacy-sw-removed-v1';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  let pendingCategory='';
  let jszipPromise=null;
  let converterFrame=null;
  let converterReadyPromise=null;
  let resolveConverterReady=null;
  let rejectConverterReady=null;
  let readyTimer=null;
  const pendingRequests=new Map();

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

  async function removeLegacyIsolationWorker(){
    if(!navigator.serviceWorker?.getRegistrations) return;
    try{
      const registrations=await navigator.serviceWorker.getRegistrations();
      let removed=false;
      for(const registration of registrations){
        const urls=[registration.active?.scriptURL,registration.waiting?.scriptURL,registration.installing?.scriptURL].filter(Boolean);
        if(!urls.some(url=>url.includes(LEGACY_SW_NAME))) continue;
        const ok=await registration.unregister();
        removed=removed||ok;
      }
      if(!removed||!navigator.serviceWorker.controller) return;
      let alreadyReloaded='';
      try{alreadyReloaded=sessionStorage.getItem(LEGACY_RELOAD_KEY)||'';}catch(_err){}
      if(alreadyReloaded==='1') return;
      try{sessionStorage.setItem(LEGACY_RELOAD_KEY,'1');}catch(_err){}
      window.location.reload();
    }catch(err){
      console.warn('[LibreOffice] Oude browserisolatie kon niet automatisch worden verwijderd:',err);
    }
  }

  removeLegacyIsolationWorker();

  function normalizeResultBytes(value){
    if(value instanceof ArrayBuffer) return new Uint8Array(value);
    if(ArrayBuffer.isView(value)) return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
    if(value?.buffer instanceof ArrayBuffer){
      const offset=Number(value.byteOffset)||0;
      const length=Number(value.byteLength)||value.buffer.byteLength;
      return new Uint8Array(value.buffer,offset,length);
    }
    return null;
  }

  function onConverterMessage(event){
    if(event.origin!==CONVERTER_ORIGIN) return;
    if(!converterFrame||event.source!==converterFrame.contentWindow) return;
    const data=event.data||{};

    if(data.type==='ready'||data.type==='converterReady'){
      console.info('[LibreOffice] Converter iframe gereed.');
      if(readyTimer){clearTimeout(readyTimer);readyTimer=null;}
      resolveConverterReady?.(converterFrame);
      resolveConverterReady=null;
      rejectConverterReady=null;
      return;
    }

    const requestId=data.requestId;
    if(!requestId||!pendingRequests.has(requestId)) return;
    const pending=pendingRequests.get(requestId);

    if(data.type==='result'){
      clearTimeout(pending.timer);
      pendingRequests.delete(requestId);
      const bytes=normalizeResultBytes(data.data);
      if(!bytes?.length){
        pending.reject(new Error('LibreOffice leverde een leeg conversieresultaat op.'));
        return;
      }
      console.info(`[LibreOffice] Conversieresultaat ontvangen: ${bytes.length} bytes.`);
      pending.resolve(bytes);
      return;
    }

    if(data.type==='error'){
      clearTimeout(pending.timer);
      pendingRequests.delete(requestId);
      pending.reject(new Error(String(data.error||'Onbekende LibreOffice-fout.')));
    }
  }

  window.addEventListener('message',onConverterMessage);

  function ensureConverter(msg){
    if(converterReadyPromise) return converterReadyPromise;

    setMessage(msg,'LibreOffice-converter laden… De eerste keer kan dit wat langer duren.','busy');
    console.info('[LibreOffice] Converter iframe initialiseren.');

    converterReadyPromise=new Promise((resolve,reject)=>{
      resolveConverterReady=resolve;
      rejectConverterReady=reject;
      readyTimer=setTimeout(()=>{
        readyTimer=null;
        rejectConverterReady?.(new Error('LibreOffice-converter startte niet binnen 4 minuten.'));
        rejectConverterReady=null;
        resolveConverterReady=null;
        converterReadyPromise=null;
      },240000);

      const iframe=document.createElement('iframe');
      iframe.src=CONVERTER_URL;
      iframe.title='LibreOffice documentconverter';
      iframe.setAttribute('aria-hidden','true');
      iframe.tabIndex=-1;
      iframe.style.cssText='position:fixed!important;width:1px!important;height:1px!important;left:-10000px!important;top:-10000px!important;opacity:0!important;pointer-events:none!important;border:0!important;';
      iframe.addEventListener('error',()=>{
        if(readyTimer){clearTimeout(readyTimer);readyTimer=null;}
        converterReadyPromise=null;
        reject(new Error('LibreOffice-converter kon niet worden geladen.'));
      },{once:true});
      converterFrame=iframe;
      document.body.appendChild(iframe);
    });

    return converterReadyPromise;
  }

  async function convertWithLibreOffice(file,msg){
    let bytes=new Uint8Array(await file.arrayBuffer());
    bytes=await repairOpenXmlPackage(bytes);

    const iframe=await ensureConverter(msg);
    setMessage(msg,'Document met LibreOffice omzetten naar PDF…','busy');
    console.info(`[LibreOffice] Conversie starten: ${file.name}, ${bytes.length} bytes.`);

    const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
    const requestId=`portfolio-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pdfBytes=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        pendingRequests.delete(requestId);
        reject(new Error('LibreOffice-conversie duurde langer dan 3 minuten.'));
      },180000);
      pendingRequests.set(requestId,{resolve,reject,timer});
      try{
        iframe.contentWindow.postMessage({
          type:'convert',
          buffer,
          format:'pdf',
          requestId
        },CONVERTER_ORIGIN,[buffer]);
      }catch(err){
        clearTimeout(timer);
        pendingRequests.delete(requestId);
        reject(err);
      }
    });

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
      console.error('[LibreOffice] DOCX/XLSX/PPTX-conversie mislukt:',err);
      const raw=String(err?.message||'Onbekende fout.');
      setMessage(msg,`LibreOffice-conversie mislukt: ${raw}`,'error');
      button.disabled=false;
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
