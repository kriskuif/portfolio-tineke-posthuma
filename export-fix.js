(() => {
  const SITE_URL = 'https://kriskuif.github.io/portfolio-tineke-posthuma/';
  const esc = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1200);
  }

  async function imageAsDataUrl(){
    try{
      const image=document.querySelector('.hero-photo-card img');
      if(!image) return '';
      const response=await fetch(image.src,{cache:'no-store'});
      if(!response.ok) return '';
      const blob=await response.blob();
      return await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result||'');
        reader.onerror=reject;
        reader.readAsDataURL(blob);
      });
    }catch(_err){ return ''; }
  }

  async function baseCss(){
    try{
      const response=await fetch(new URL('styles.css',SITE_URL).href,{cache:'no-store'});
      return response.ok ? await response.text() : '';
    }catch(_err){ return ''; }
  }

  async function buildSiteCloneHtml(){
    if(typeof renderChapters==='function') renderChapters();
    const clone=document.documentElement.cloneNode(true);

    clone.querySelectorAll('.settings-overlay,.auth-overlay,.editor-window,.window-layer,.settings-nav,.manage-btn,.topic-edit-btn,.top-actions,script').forEach(el=>el.remove());
    const cloneBody=clone.querySelector('body');
    cloneBody?.classList.remove('can-edit','menu-open');

    // De instellingen-popup blokkeert tijdens het exporteren bewust de scroll van de live pagina.
    // Die tijdelijke runtime-stijlen mogen nooit in de zelfstandige HTML-kopie terechtkomen.
    clone.style.overflow='';
    clone.style.height='';
    clone.style.maxHeight='';
    clone.style.overscrollBehavior='';
    if(cloneBody){
      cloneBody.style.overflow='';
      cloneBody.style.height='';
      cloneBody.style.maxHeight='';
      cloneBody.style.overscrollBehavior='';
      cloneBody.style.position='';
    }

    const status=clone.querySelector('#saveStatus');
    if(status) status.textContent='Portfolio';

    const css=await baseCss();
    clone.querySelectorAll('link[rel="stylesheet"]').forEach(link=>link.remove());
    if(css){
      const style=document.createElement('style');
      style.textContent=css;
      clone.querySelector('head')?.appendChild(style);
    }

    const runtimeCss=[...document.head.querySelectorAll('style')].map(s=>s.textContent||'').join('\n');
    if(runtimeCss){
      const style=document.createElement('style');
      style.textContent=runtimeCss+'\nbody:not(.can-edit) .topic-edit-btn{display:none!important}';
      clone.querySelector('head')?.appendChild(style);
    }

    const exportReset=document.createElement('style');
    exportReset.textContent=`
      html,body{overflow-y:auto!important;overflow-x:hidden!important;height:auto!important;max-height:none!important;overscroll-behavior:auto!important;position:static!important}
      body{min-height:100vh!important}
      .app{min-height:100vh!important;height:auto!important;overflow:visible!important}
      .content,main{height:auto!important;max-height:none!important;overflow:visible!important}
    `;
    clone.querySelector('head')?.appendChild(exportReset);

    const imageData=await imageAsDataUrl();
    if(imageData){
      const img=clone.querySelector('.hero-photo-card img');
      if(img) img.src=imageData;
    }

    const script=document.createElement('script');
    script.textContent=`(() => { document.documentElement.style.overflow=''; document.body.style.overflow=''; const b=document.body,m=document.getElementById('menuBtn'); m?.addEventListener('click',()=>{const o=b.classList.toggle('menu-open');m.setAttribute('aria-expanded',String(o));}); document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>{b.classList.remove('menu-open');m?.setAttribute('aria-expanded','false');})); })();`;
    clone.querySelector('body')?.appendChild(script);

    return '<!DOCTYPE html>\n'+clone.outerHTML;
  }

  function topicHtml(topic,number){
    const rows=topic.fields.map(([id,label])=>({label,value:String(state.values[id]||'').trim()})).filter(item=>item.value);
    const content=rows.length
      ? rows.map(item=>`<div class="field"><h4>${esc(item.label)}</h4><p>${esc(item.value).replace(/\n/g,'<br>')}</p></div>`).join('')
      : '<p class="empty">Nog niet ingevuld.</p>';
    return `<article class="topic"><div class="topic-label">Onderdeel ${number}</div><h3>${esc(topic.title)}</h3>${content}</article>`;
  }

  function overviewHtml(){
    return `<section class="overview"><h2>Portfolio-overzicht</h2><p class="overview-intro">Zes hoofdstukken met de bijbehorende onderdelen.</p><div class="overview-grid">${groups.map(group=>`<article class="overview-card"><div class="overview-num">${group.n}</div><div><h3>${esc(group.title)}</h3><p>${esc(group.sub)}</p><div class="overview-topics">${group.topics.map(topic=>`<span>${esc(topic.title)}</span>`).join('')}</div></div></article>`).join('')}</div></section>`;
  }

  async function buildDocumentExport(){
    const imageData=await imageAsDataUrl();
    const photo=imageData?`<img class="portrait" src="${imageData}" alt="Tineke Posthuma">`:'';
    const chapters=groups.map(group=>`<section class="chapter"><div class="chapter-head"><span>${group.n}</span><div><h2>${esc(group.title)}</h2><p>${esc(group.sub)}</p></div></div>${group.topics.map((topic,index)=>topicHtml(topic,`${group.n}.${index+1}`)).join('')}</section>`).join('');

    return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio Tineke Posthuma · Wandeltrainer 3</title><style>
    @page{margin:18mm}*{box-sizing:border-box}body{margin:0;background:#fbfaf6;color:#1d2924;font-family:Arial,sans-serif;line-height:1.55}.page{max-width:900px;margin:auto;padding:34px}.cover{display:grid;grid-template-columns:1fr 230px;gap:32px;align-items:center;padding:34px;border:1px solid #dedfd6;border-radius:24px;background:#f3eee1;margin-bottom:24px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#1f5e4a}.cover h1{font-family:Georgia,serif;font-size:52px;line-height:.95;margin:12px 0}.cover h1 span{color:#1f5e4a}.cover p{color:#526158}.portrait{width:100%;border-radius:18px;border:8px solid #fff}.intro,.overview,.chapter{background:#fff;border:1px solid #dfe5df;border-radius:20px;padding:24px;margin:16px 0}.intro h2,.overview h2,.chapter h2,.topic h3,.overview-card h3{font-family:Georgia,serif}.intro h2,.overview h2{margin:0 0 8px}.overview-intro{margin:0 0 16px;color:#66746e}.overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.overview-card{display:grid;grid-template-columns:42px 1fr;gap:12px;border:1px solid #e1e7e2;border-radius:15px;padding:14px;background:#fcfdfb}.overview-num{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#e6efe9;color:#1f5e4a;font-weight:800}.overview-card h3{margin:0 0 5px;font-size:18px;color:#294f40}.overview-card p{margin:0 0 8px;color:#66746e;font-size:13px}.overview-topics{display:flex;flex-wrap:wrap;gap:5px}.overview-topics span{font-size:10px;padding:4px 7px;border-radius:999px;background:#f1ead8;color:#655d42}.chapter-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}.chapter-head>span{display:grid;place-items:center;min-width:40px;height:40px;background:#e6efe9;color:#1f5e4a;border-radius:12px;font-weight:700}.chapter-head h2{margin:0 0 3px}.chapter-head p{margin:0;color:#66746e}.topic{border-top:1px solid #e7ece8;padding:18px 0 6px}.topic-label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#75857c;font-weight:700}.topic h3{margin:4px 0 12px;color:#294f40}.field{margin:10px 0;padding-left:12px;border-left:3px solid #dbe7df}.field h4{margin:0 0 3px;font-size:12px;color:#446054}.field p{margin:0;color:#405047}.empty{color:#8a948f;font-style:italic}footer{text-align:center;color:#66746e;font-size:12px;margin:28px 0}@media print{body{background:#fff}.page{padding:0}.cover,.intro,.overview-card,.chapter,.topic{break-inside:avoid}}@media(max-width:650px){.page{padding:15px}.cover{grid-template-columns:1fr}.cover h1{font-size:42px}.portrait{max-width:260px}.overview-grid{grid-template-columns:1fr}}
    </style></head><body><div class="page"><header class="cover"><div><div class="eyebrow">Portfolio · Wandeltrainer 3</div><h1>Tineke <span>Posthuma</span></h1><p>Een persoonlijk portfolio over mijn ontwikkeling als wandeltrainer, met praktijkervaringen, trainingsplannen, feedback, reflecties en bewijsstukken.</p></div>${photo}</header><section class="intro"><h2>Over dit portfolio</h2><p>Deze website is opgezet als digitaal portfolio voor Wandeltrainer 3. Hier komen de persoonlijke teksten, praktijkvoorbeelden, trainingsplannen, reflecties en bewijsstukken van Tineke samen in één overzichtelijk geheel.</p></section>${overviewHtml()}${chapters}<footer>Portfolio Tineke Posthuma · Wandeltrainer 3</footer></div></body></html>`;
  }

  function messageElement(button){
    return button.closest('.settings-card')?.querySelector('[data-export-message]');
  }

  document.addEventListener('click',async(event)=>{
    const button=event.target.closest('[data-export-html],[data-export-word],[data-export-pdf]');
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const message=messageElement(button);
    if(button.matches('[data-export-html]')){
      if(message) message.textContent='Volledige HTML-kopie van de website maken…';
      const html=await buildSiteCloneHtml();
      downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),'portfolio-tineke-posthuma.html');
      if(message) message.textContent='Volledige HTML-kopie gedownload.';
      return;
    }

    if(button.matches('[data-export-word]')){
      if(message) message.textContent='Word-bestand maken…';
      const html=await buildDocumentExport();
      downloadBlob(new Blob([html],{type:'application/msword'}),'portfolio-tineke-posthuma.doc');
      if(message) message.textContent='Word-bestand met portfolio-overzicht gedownload.';
      return;
    }

    const printWindow=window.open('','_blank');
    if(!printWindow){ if(message) message.textContent='Sta pop-ups toe om de PDF-export te openen.'; return; }
    if(message) message.textContent='PDF-weergave maken…';
    const html=await buildDocumentExport();
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.addEventListener('load',()=>setTimeout(()=>printWindow.print(),250),{once:true});
    if(message) message.textContent='Kies in het afdrukvenster “Opslaan als PDF”.';
  },true);
})();