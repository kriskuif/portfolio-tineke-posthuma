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

    const sourceApp=document.querySelector('.app');
    if(!sourceApp) throw new Error('Portfolio-opmaak niet gevonden.');

    // Maak bewust alleen een kopie van de zichtbare site. Tijdelijke runtime-elementen
    // en scroll-locks van modals/beheervensters kunnen zo nooit in de export belanden.
    const appClone=sourceApp.cloneNode(true);
    appClone.querySelectorAll('.settings-nav,.manage-btn,.topic-edit-btn,.top-actions,.auth-overlay,.settings-overlay,.editor-window,.window-layer,script').forEach(el=>el.remove());

    const status=appClone.querySelector('#saveStatus');
    if(status) status.textContent='Portfolio';

    const menuButton=appClone.querySelector('#menuBtn');
    if(menuButton) menuButton.setAttribute('aria-expanded','false');

    const imageData=await imageAsDataUrl();
    if(imageData){
      const img=appClone.querySelector('.hero-photo-card img');
      if(img) img.src=imageData;
    }

    const css=await baseCss();
    const exportCss=`
      html{min-height:100%;height:auto!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;scroll-behavior:smooth}
      body{margin:0!important;min-height:100vh!important;height:auto!important;max-height:none!important;overflow:visible!important;position:static!important;overscroll-behavior:auto!important}
      .app{min-height:100vh!important;height:auto!important;max-height:none!important;overflow:visible!important;align-items:start}
      .content{min-height:100vh!important;height:auto!important;max-height:none!important;overflow:visible!important}
      main{height:auto!important;max-height:none!important;overflow:visible!important}
      .sidebar{position:sticky!important;top:0!important;align-self:start!important;height:100vh!important}
      .topic-edit-btn,.manage-btn,.settings-nav,.top-actions{display:none!important}
      @media(max-width:900px){
        html{overflow-y:auto!important}
        body{overflow:visible!important}
      }
    `;

    const menuScript=`(() => {
      document.documentElement.removeAttribute('style');
      document.body.removeAttribute('style');
      const body=document.body;
      const menu=document.getElementById('menuBtn');
      menu?.addEventListener('click',()=>{
        const open=body.classList.toggle('menu-open');
        menu.setAttribute('aria-expanded',String(open));
      });
      document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>{
        body.classList.remove('menu-open');
        menu?.setAttribute('aria-expanded','false');
      }));
    })();`;

    return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#1f5e4a">
  <meta name="description" content="Portfolio Wandeltrainer 3 van Tineke Posthuma.">
  <title>Portfolio Tineke Posthuma · Wandeltrainer 3</title>
  <style>${css}\n${exportCss}</style>
</head>
<body>
${appClone.outerHTML}
<script>${menuScript}<\/script>
</body>
</html>`;
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
      try{
        const html=await buildSiteCloneHtml();
        downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),'portfolio-tineke-posthuma.html');
        if(message) message.textContent='Volledige HTML-kopie gedownload.';
      }catch(err){
        console.error(err);
        if(message) message.textContent='HTML-export maken is mislukt.';
      }
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