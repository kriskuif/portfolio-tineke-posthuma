(() => {
  if (!window.pdfjsLib) return;

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  const style = document.createElement('style');
  style.textContent = `
    .file-paper.pdf-clean-viewer{
      width:min(100%,760px);
      min-height:0;
      aspect-ratio:auto;
      background:transparent;
      box-shadow:none;
      overflow:visible;
    }
    .pdf-clean-pages{display:grid;gap:14px;width:100%;align-items:start}
    .pdf-clean-page{display:block;width:100%;height:auto;background:#fff;box-shadow:0 4px 18px rgba(24,39,32,.16)}
    .pdf-clean-loading,.pdf-clean-error{width:100%;min-height:420px;display:grid;place-items:center;background:#fff;color:#607068;text-align:center;padding:24px;box-shadow:0 4px 18px rgba(24,39,32,.12)}
    .pdf-clean-error a{color:#1f5e4a;font-weight:800}
    @media(max-width:700px){.pdf-clean-pages{gap:9px}}
  `;
  document.head.appendChild(style);

  function isPdfIframe(iframe){
    if (!iframe || iframe.dataset.pdfCleanHandled) return false;
    const src = iframe.getAttribute('src') || '';
    return /\.pdf(?:[?#]|$)/i.test(src) || /application\/pdf/i.test(iframe.getAttribute('type') || '');
  }

  async function renderPdfIframe(iframe){
    if (!isPdfIframe(iframe)) return;
    iframe.dataset.pdfCleanHandled = '1';

    const paper = iframe.closest('.file-paper');
    if (!paper) return;

    const originalSrc = iframe.src;
    const pdfUrl = originalSrc.split('#')[0];
    paper.classList.add('pdf-clean-viewer');
    paper.innerHTML = '<div class="pdf-clean-loading">Document laden…</div>';

    try{
      const pdf = await window.pdfjsLib.getDocument({ url: pdfUrl }).promise;
      const pages = document.createElement('div');
      pages.className = 'pdf-clean-pages';
      paper.replaceChildren(pages);

      const targetWidth = Math.max(280, Math.min(760, paper.clientWidth || 760));
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);

      for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1){
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const cssScale = targetWidth / baseViewport.width;
        const cssViewport = page.getViewport({ scale: cssScale });
        const renderViewport = page.getViewport({ scale: cssScale * outputScale });

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-clean-page';
        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(cssViewport.width)}px`;
        canvas.style.height = `${Math.floor(cssViewport.height)}px`;
        canvas.setAttribute('aria-label', `Pagina ${pageNumber} van ${pdf.numPages}`);
        pages.appendChild(canvas);

        const context = canvas.getContext('2d', { alpha: false });
        await page.render({ canvasContext: context, viewport: renderViewport }).promise;
      }
    }catch(err){
      console.error('PDF kon niet zonder browserviewer worden weergegeven:', err);
      paper.innerHTML = `<div class="pdf-clean-error"><div><p>Het document kon niet in de vereenvoudigde weergave worden geladen.</p><p><a href="${pdfUrl}" target="_blank" rel="noopener">Document openen</a></p></div></div>`;
    }
  }

  function scan(root = document){
    root.querySelectorAll?.('.file-paper iframe').forEach(renderPdfIframe);
    if(root.matches?.('.file-paper iframe')) renderPdfIframe(root);
  }

  scan();
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if(node.nodeType === 1) scan(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });
})();

(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const REAM_SRC='https://cdn.jsdelivr.net/npm/reamkit@1.29.0/+esm';
  const JSZIP_SRC='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
  const MAX_BYTES=25*1024*1024;
  const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const WP_NS='http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  let pendingCategory='';
  let reamPromise=null;
  let jszipPromise=null;

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
  const setMessage=(node,text,state='')=>{
    if(!node) return;
    node.textContent=text;
    if(state) node.dataset.conversionMessage=state;
    else delete node.dataset.conversionMessage;
  };

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

  async function getReam(){
    if(reamPromise) return reamPromise;
    reamPromise=import(REAM_SRC).then(mod=>{
      const Ream=mod.Ream||mod.default?.Ream||mod.default;
      if(!Ream?.parse) throw new Error('Documentconverter kon niet worden geladen.');
      return Ream;
    }).catch(err=>{reamPromise=null;throw err;});
    return reamPromise;
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

  function improveTablePagination(xml){
    const parser=new DOMParser();
    const doc=parser.parseFromString(xml,'application/xml');
    if(doc.getElementsByTagName('parsererror').length){
      return {xml,changes:0};
    }

    let changes=0;
    const rows=[...doc.getElementsByTagNameNS(W_NS,'tr')];
    for(const row of rows){
      const direct=[...row.children];
      let trPr=direct.find(el=>el.namespaceURI===W_NS&&el.localName==='trPr');
      const alreadyNoSplit=trPr&&[...trPr.children].some(el=>el.namespaceURI===W_NS&&el.localName==='cantSplit');
      if(alreadyNoSplit) continue;

      const paragraphCount=row.getElementsByTagNameNS(W_NS,'p').length;
      const nestedTableCount=row.getElementsByTagNameNS(W_NS,'tbl').length;
      const drawingCount=row.getElementsByTagNameNS(W_NS,'drawing').length;
      const textLength=[...row.getElementsByTagNameNS(W_NS,'t')]
        .reduce((sum,node)=>sum+(node.textContent||'').length,0);

      let hasVeryTallDrawing=false;
      for(const extent of row.getElementsByTagNameNS(WP_NS,'extent')){
        const cy=Number(extent.getAttribute('cy')||0);
        if(Number.isFinite(cy)&&cy>5500000){
          hasVeryTallDrawing=true;
          break;
        }
      }

      const hasExplicitPageBreak=[...row.getElementsByTagNameNS(W_NS,'br')]
        .some(br=>(br.getAttributeNS(W_NS,'type')||br.getAttribute('w:type')||br.getAttribute('type'))==='page');

      // Keep ordinary form/table rows together. Very large/complex rows are
      // deliberately left splittable so they cannot overflow a full page.
      if(
        paragraphCount>20 ||
        nestedTableCount>0 ||
        drawingCount>2 ||
        textLength>5000 ||
        hasVeryTallDrawing ||
        hasExplicitPageBreak
      ) continue;

      if(!trPr){
        trPr=doc.createElementNS(W_NS,'w:trPr');
        row.insertBefore(trPr,row.firstChild);
      }
      trPr.appendChild(doc.createElementNS(W_NS,'w:cantSplit'));
      changes+=1;
    }

    if(!changes) return {xml,changes:0};
    return {xml:new XMLSerializer().serializeToString(doc),changes};
  }

  async function prepareDocxForPdf(file){
    const JSZip=await getJSZip();
    const bytes=new Uint8Array(await file.arrayBuffer());
    const zip=await JSZip.loadAsync(bytes);
    let repairedAttributes=0;
    let paginationChanges=0;
    let changed=false;

    const names=Object.keys(zip.files).filter(name=>
      !zip.files[name].dir&&(/\.xml$/i.test(name)||/\.rels$/i.test(name))
    );

    for(const name of names){
      const original=await zip.files[name].async('string');
      const repaired=dedupeXmlAttributes(original);
      let output=repaired.xml;
      repairedAttributes+=repaired.changes;

      if(name==='word/document.xml'){
        const paged=improveTablePagination(output);
        output=paged.xml;
        paginationChanges+=paged.changes;
      }

      if(output!==original){
        zip.file(name,output);
        changed=true;
      }
    }

    if(!changed) return bytes;
    if(repairedAttributes){
      console.info(`DOCX-conversie: ${repairedAttributes} dubbel XML-attribuut${repairedAttributes===1?'':'en'} tijdelijk hersteld.`);
    }
    if(paginationChanges){
      console.info(`DOCX-conversie: ${paginationChanges} tabelrij${paginationChanges===1?'':'en'} beschermd tegen pagina-afbreking.`);
    }
    return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
  }

  async function convertDocxToPdf(file){
    const bytes=await prepareDocxForPdf(file);
    const Ream=await getReam();
    const doc=Ream.parse(bytes);
    if(typeof doc.convertWithReport==='function'){
      const result=await doc.convertWithReport('pdf');
      if(result?.losses?.length) console.info('DOCX→PDF conversiemeldingen:',result.losses);
      if(!result?.bytes?.length) throw new Error('De converter leverde geen PDF op.');
      return new File([result.bytes],`${baseName(file.name)}.pdf`,{type:'application/pdf',lastModified:Date.now()});
    }
    const pdf=await doc.convert('pdf');
    if(!pdf?.length) throw new Error('De converter leverde geen PDF op.');
    return new File([pdf],`${baseName(file.name)}.pdf`,{type:'application/pdf',lastModified:Date.now()});
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

  async function handleDocxSave(event,button,file){
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

      setMessage(msg,'Document omzetten naar PDF…','busy');
      const pdf=await convertDocxToPdf(file);
      if(pdf.size>MAX_BYTES) throw new Error('De omgezette PDF is groter dan 25 MB.');

      setMessage(msg,'PDF uploaden…','busy');
      await uploadPdf(category,title,pdf,session);
      setMessage(msg,'Document is omgezet naar PDF en toegevoegd.','success');
      await window.portfolioFiles?.reload?.();
      setTimeout(()=>overlay.remove(),900);
    }catch(err){
      console.error('DOCX met verbeterde paginering verwerken mislukt:',err);
      const raw=String(err?.message||'');
      const friendly=/25 MB|ingelogd|upload/i.test(raw)
        ? raw
        : 'Het document kon niet naar PDF worden omgezet. Probeer het opnieuw of upload het document als PDF.';
      setMessage(msg,friendly,'error');
      button.disabled=false;
    }
  }

  document.addEventListener('click',event=>{
    const uploadButton=event.target.closest?.('[data-file-upload-button]');
    if(uploadButton){
      pendingCategory=uploadButton.dataset.fileUploadButton||'';
      setTimeout(()=>{
        const overlays=[...document.querySelectorAll('.file-upload-overlay')];
        const overlay=overlays.at(-1);
        if(overlay&&pendingCategory&&!overlay.dataset.uploadCategory){
          overlay.dataset.uploadCategory=pendingCategory;
        }
      },0);
      return;
    }

    const saveButton=event.target.closest?.('[data-file-save]');
    if(!saveButton) return;
    const overlay=saveButton.closest('.file-upload-overlay');
    const file=overlay?.querySelector('[data-file-input]')?.files?.[0];
    if(!file||extFromName(file.name)!=='docx') return;

    handleDocxSave(event,saveButton,file);
  },true);
})();
