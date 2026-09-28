(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET='portfolio-documents';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  function applyPortfolioStructure(){
    try{
      if(typeof groups==='undefined') return;

      if(groups[0]){
        groups[0].sub='Wie ben ik als wandelcoach en wat wil ik ontwikkelen?';
        groups[0].topics=[
          {title:'Mijn profiel als wandelcoach',fields:[
            ['s1_intro','Korte introductie','Wie ben je, welke ervaring heb je met wandelen en training geven, en in welke context geef je training?'],
            ['s1_motivatie','Motivatie','Waarom volg je Wandeltrainer 3? Wat wil je als trainer bereiken?'],
            ['s1_visie','Mijn visie','Wat vind jij belangrijk in een goede wandeltraining?'],
            ['s2_start','Persoonlijke leerdoelen · Startpunt','Welke vaardigheden beheers je al en waar wil je beter in worden?'],
            ['s2_leerdoelen','Persoonlijke leerdoelen','Formuleer 3–5 concrete leerdoelen.'],
            ['s2_succes','Persoonlijke leerdoelen · Succescriteria','Hoe weet je aan het einde dat je jouw leerdoelen hebt bereikt?']
          ]}
        ];
      }

      if(groups[1]){
        groups[1].title='Doelgroep';
        groups[1].sub='Voor wie geef ik training en wat is de beginsituatie?';
        groups[1].topics=[
          {title:'Beginsituatie en doelgroep',fields:[
            ['s3_groep','Groepsprofiel','Beschrijf leeftijd, omvang, wandelervaring, niveau en motivatie.'],
            ['s3_begin','Beginsituatie','Wat kunnen de deelnemers nu? Waar liggen kansen en aandachtspunten?'],
            ['s3_behoeften','Behoeften','Wat willen de deelnemers bereiken en wat hebben zij van jou nodig?']
          ]}
        ];
      }

      if(groups[2]){
        groups[2].sub='Mijn lesdagen bijhouden en concrete trainingsvoorbereiding.';
        groups[2].topics=[
          {title:'Mijn logboek',fields:[['s5_planning','Mijn logboek','Leg hier per lesdag vast wat je hebt gedaan, wat opviel en wat je wilt meenemen naar een volgende les.']]},
          {title:'Trainingsvoorbereiding',fields:[['s6_voorbereiding','Voorbereiding','Doel, warming-up, kern, afsluiting, materialen, organisatie en aandachtspunten.']]}
        ];
      }

      if(groups[4]){
        groups[4].topics=[
          {title:'Verslaglegging lesdagen',fields:[
            ['s8_evaluatie','Evaluatie','Wat ging goed en wat kon beter?'],
            ['s8_bijstelling','Bijstelling','Wat verander je in een volgende training of periode?']
          ]},
          {title:'Aansturen van assisterend kader',fields:[
            ['s10_kader','Aansturing','Hoe stuur je assistenten aan, verdeel je taken en bewaak je afspraken?']
          ]},
          {title:'Feedback praktijkbegeleider',fields:[
            ['s9_feedback','Feedback','Upload hier de feedback van de praktijkbegeleider.']
          ]},
          {title:'Lesvoorbereidingen',fields:[
            ['s17_lesvoorbereidingen','Lesvoorbereidingen','Upload hier de lesvoorbereidingen.']
          ]}
        ];
      }
    }catch(err){console.error('Portfolio-indeling aanpassen mislukt:',err)}
  }

  function syncStaticLabels(){
    const setText=(selector,text)=>{
      const el=document.querySelector(selector);
      if(el) el.textContent=text;
    };

    setText('.nav a[href="#hoofdstuk-2"] span:last-child','Doelgroep');

    setText('#hoofdstuk-1 .chapter-heading .subtitle','Wie ben ik als wandelcoach en wat wil ik ontwikkelen?');
    setText('#hoofdstuk-2 .chapter-heading h3','Doelgroep');
    setText('#hoofdstuk-2 .chapter-heading .subtitle','Voor wie geef ik training en wat is de beginsituatie?');
    setText('#hoofdstuk-3 .chapter-heading .subtitle','Mijn lesdagen bijhouden en concrete trainingsvoorbereiding.');

    const overviewCards=document.querySelectorAll('#overzicht .journey-card');
    const profileCard=overviewCards[0];
    if(profileCard){
      const p=profileCard.querySelector('p');
      if(p) p.textContent='Wie ben ik als wandelcoach, waar sta ik nu en welke leerdoelen horen bij mijn profiel?';
      const tags=profileCard.querySelectorAll('.mini-tags span');
      if(tags[0]) tags[0].textContent='Profiel als wandelcoach';
      if(tags[1]) tags[1].textContent='Persoonlijke leerdoelen';
    }

    const doelgroepCard=overviewCards[1];
    if(doelgroepCard){
      const title=doelgroepCard.querySelector('h4');
      if(title) title.textContent='Doelgroep';
      const p=doelgroepCard.querySelector('p');
      if(p) p.textContent='Wie zijn mijn deelnemers en wat is hun beginsituatie?';
      const tags=doelgroepCard.querySelectorAll('.mini-tags span');
      if(tags[0]) tags[0].textContent='Doelgroep';
      if(tags[1]) tags[1].remove();
    }

    const planningCard=overviewCards[2];
    if(planningCard){
      const p=planningCard.querySelector('p');
      if(p) p.textContent='Hoe houd ik mijn lesdagen bij en hoe vertaal ik die naar concrete trainingen?';
      const tags=planningCard.querySelectorAll('.mini-tags span');
      if(tags[0]) tags[0].textContent='Mijn logboek';
    }

    const evaluatieCard=overviewCards[4];
    if(evaluatieCard){
      const p=evaluatieCard.querySelector('p');
      if(p) p.textContent='Hoe leg ik mijn lesdagen vast, verwerk ik feedback en stuur ik mijn handelen bij?';
      const tags=evaluatieCard.querySelectorAll('.mini-tags span');
      if(tags[0]) tags[0].textContent='Verslaglegging lesdagen';
    }
  }

  applyPortfolioStructure();
  if(typeof renderChapters==='function') renderChapters();
  syncStaticLabels();

  const sections={
    feedback:{cardKey:'4-2',label:'Feedback',singular:'Feedback',empty:'Nog geen feedbackdocumenten toegevoegd.'},
    lessonprep:{cardKey:'4-3',label:'Lesvoorbereidingen',singular:'Lesvoorbereiding',empty:'Nog geen lesvoorbereidingen toegevoegd.'}
  };
  const files={feedback:[],lessonprep:[]};
  let loading=false;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeName=name=>String(name||'bestand').replace(/[^a-z0-9._-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-120)||'bestand';
  const publicUrl=path=>client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  async function loadFiles(){
    if(loading) return;
    loading=true;
    try{
      const {data,error}=await client.from('portfolio_files')
        .select('id,category,title,storage_path,file_name,mime_type,sort_order,created_at')
        .in('category',['feedback','lessonprep'])
        .order('sort_order',{ascending:true})
        .order('created_at',{ascending:true});
      if(error) throw error;
      files.feedback=(data||[]).filter(x=>x.category==='feedback');
      files.lessonprep=(data||[]).filter(x=>x.category==='lessonprep');
      renderSections();
    }catch(err){console.error('Feedback/lesvoorbereidingen laden mislukt:',err)}
    finally{loading=false}
  }

  function signature(category){return files[category].map(x=>`${x.id}:${x.title}`).join('|')||'empty'}

  function renderCategory(category){
    const cfg=sections[category];
    const card=document.querySelector(`[data-topic-card="${cfg.cardKey}"]`);
    if(!card) return;
    const content=card.querySelector('.topic-content');
    const sig=signature(category);
    if(content && content.dataset.fileSignature!==sig){
      content.dataset.fileSignature=sig;
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
    const stateBadge=card.querySelector('.topic-state');
    if(stateBadge){
      stateBadge.textContent=files[category].length ? `${files[category].length} bestand${files[category].length===1?'':'en'}` : 'Nog leeg';
    }
  }

  function bindViewButtons(){
    document.querySelectorAll('[data-view-file="feedback"],[data-view-file="lessonprep"]').forEach(btn=>{
      if(btn.dataset.viewerBound) return;
      btn.dataset.viewerBound='1';
      btn.addEventListener('click',()=>openViewer(btn.dataset.viewFile,Number(btn.dataset.fileIndex)||0));
    });
  }

  function renderSections(){
    renderCategory('feedback');
    renderCategory('lessonprep');
    bindViewButtons();
  }

  function openUpload(category){
    if(!document.body.classList.contains('can-edit')) return;
    const cfg=sections[category];
    const overlay=document.createElement('div');
    overlay.className='file-upload-overlay';
    overlay.innerHTML=`<section class="file-upload-dialog" role="dialog" aria-modal="true" aria-label="${esc(cfg.singular)} uploaden"><header class="file-dialog-head"><strong>${esc(cfg.singular)} uploaden</strong><button class="file-dialog-close" type="button" aria-label="Sluiten">×</button></header><div class="file-upload-body"><label>Titel<input type="text" maxlength="200" data-file-title placeholder="Geef het bestand een duidelijke titel"></label><label>Bestand<input type="file" data-file-input></label><p class="file-upload-message" data-file-message></p><div class="file-upload-actions"><button class="file-upload-btn secondary" type="button" data-file-cancel>Annuleren</button><button class="file-upload-btn" type="button" data-file-save>Uploaden</button></div></div></section>`;
    document.body.appendChild(overlay);
    const close=()=>overlay.remove();
    overlay.querySelector('.file-dialog-close')?.addEventListener('click',close);
    overlay.querySelector('[data-file-cancel]')?.addEventListener('click',close);
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
    if(mime.startsWith('image/')||['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return `<img src="${esc(url)}" alt="${esc(item.title)}">`;
    if(mime==='application/pdf'||ext==='pdf') return `<iframe src="${esc(url)}#view=FitH" title="${esc(item.title)}"></iframe>`;
    if(mime.startsWith('text/')||['txt','html','htm'].includes(ext)) return `<iframe src="${esc(url)}" title="${esc(item.title)}"></iframe>`;
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
    overlay.querySelector('.prev')?.addEventListener('click',()=>move(-1));
    overlay.querySelector('.next')?.addEventListener('click',()=>move(1));
    overlay.querySelector('.file-viewer-close')?.addEventListener('click',close);
    document.addEventListener('keydown',keyHandler);
    render();
  }

  let scheduled=false;
  const scheduleRender=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;renderSections()});
  };
  new MutationObserver(records=>{
    if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('[data-topic-card="4-2"],[data-topic-card="4-3"]')||n.querySelector?.('[data-topic-card="4-2"],[data-topic-card="4-3"]'))))) scheduleRender();
  }).observe(document.body,{childList:true,subtree:true});

  const previousReload=window.portfolioFiles?.reload;
  if(window.portfolioFiles){
    window.portfolioFiles.reload=async()=>{await previousReload?.();await loadFiles();};
  }
  loadFiles();
})();