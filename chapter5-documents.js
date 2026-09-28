(() => {
  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
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
            ['s9_feedback','Feedback praktijkbegeleider','Voeg hier één of meer feedbackmomenten toe met een titel en toelichting.']
          ]},
          {title:'Lesvoorbereidingen',fields:[
            ['s17_lesvoorbereidingen','Lesvoorbereidingen','Voeg hier één of meer lesvoorbereidingen toe met een titel en toelichting.']
          ]}
        ];
      }
    }catch(err){
      console.error('Portfolio-indeling aanpassen mislukt:',err);
    }
  }

  function syncStaticLabels(){
    const setText=(selector,text)=>{
      const el=document.querySelector(selector);
      if(el && el.textContent!==text) el.textContent=text;
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
      if(p && p.textContent!=='Wie ben ik als wandelcoach, waar sta ik nu en welke leerdoelen horen bij mijn profiel?') p.textContent='Wie ben ik als wandelcoach, waar sta ik nu en welke leerdoelen horen bij mijn profiel?';
      const tags=profileCard.querySelectorAll('.mini-tags span');
      if(tags[0] && tags[0].textContent!=='Profiel als wandelcoach') tags[0].textContent='Profiel als wandelcoach';
      if(tags[1] && tags[1].textContent!=='Persoonlijke leerdoelen') tags[1].textContent='Persoonlijke leerdoelen';
    }

    const doelgroepCard=overviewCards[1];
    if(doelgroepCard){
      const title=doelgroepCard.querySelector('h4');
      if(title && title.textContent!=='Doelgroep') title.textContent='Doelgroep';
      const p=doelgroepCard.querySelector('p');
      if(p && p.textContent!=='Wie zijn mijn deelnemers en wat is hun beginsituatie?') p.textContent='Wie zijn mijn deelnemers en wat is hun beginsituatie?';
      const tags=doelgroepCard.querySelectorAll('.mini-tags span');
      if(tags[0] && tags[0].textContent!=='Doelgroep') tags[0].textContent='Doelgroep';
      if(tags[1]) tags[1].remove();
    }

    const planningCard=overviewCards[2];
    if(planningCard){
      const p=planningCard.querySelector('p');
      if(p && p.textContent!=='Hoe houd ik mijn lesdagen bij en hoe vertaal ik die naar concrete trainingen?') p.textContent='Hoe houd ik mijn lesdagen bij en hoe vertaal ik die naar concrete trainingen?';
      const tags=planningCard.querySelectorAll('.mini-tags span');
      if(tags[0] && tags[0].textContent!=='Mijn logboek') tags[0].textContent='Mijn logboek';
    }

    const evaluatieCard=overviewCards[4];
    if(evaluatieCard){
      const p=evaluatieCard.querySelector('p');
      if(p && p.textContent!=='Hoe leg ik mijn lesdagen vast, verwerk ik feedback en stuur ik mijn handelen bij?') p.textContent='Hoe leg ik mijn lesdagen vast, verwerk ik feedback en stuur ik mijn handelen bij?';
      const tags=evaluatieCard.querySelectorAll('.mini-tags span');
      if(tags[0] && tags[0].textContent!=='Verslaglegging lesdagen') tags[0].textContent='Verslaglegging lesdagen';
    }
  }

  applyPortfolioStructure();
  if(typeof renderChapters==='function') renderChapters();
  syncStaticLabels();

  const sections={
    feedback:{cardKey:'4-2',fieldId:'s9_feedback',title:'Feedback praktijkbegeleider',empty:'Nog geen feedback toegevoegd.'},
    lessonprep:{cardKey:'4-3',fieldId:'s17_lesvoorbereidingen',title:'Lesvoorbereidingen',empty:'Nog geen lesvoorbereidingen toegevoegd.'}
  };
  const entries={feedback:[],lessonprep:[]};
  const fieldToCategory=new Map(Object.entries(sections).map(([key,value])=>[value.fieldId,key]));

  const style=document.createElement('style');
  style.textContent=`
    .chapter5-repeat-list{display:grid;gap:14px}
    .chapter5-repeat-entry{padding:0 0 13px;border-bottom:1px solid #e5ebe7}
    .chapter5-repeat-entry:last-child{padding-bottom:0;border-bottom:0}
    .chapter5-repeat-entry h5{margin:0 0 5px;color:#244f40;font-family:Georgia,serif;font-size:.96rem;line-height:1.3}
    .chapter5-repeat-entry p{margin:0;color:#53635b;white-space:pre-wrap;line-height:1.55}
    .chapter5-repeat-overlay{position:fixed;inset:0;z-index:4200;background:rgba(18,34,28,.56);display:grid;place-items:center;padding:22px}
    .chapter5-repeat-dialog{width:min(700px,calc(100vw - 30px));max-height:min(88vh,850px);display:flex;flex-direction:column;background:#fff;border:1px solid #dce5df;border-radius:20px;box-shadow:0 28px 90px rgba(13,35,27,.34);overflow:hidden}
    .chapter5-repeat-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 17px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .chapter5-repeat-head strong{font-family:Georgia,serif;font-size:1.08rem}
    .chapter5-repeat-close{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;font-size:1.25rem;cursor:pointer}
    .chapter5-repeat-body{padding:17px;overflow:auto;display:grid;gap:14px}
    .chapter5-repeat-editor-list{display:grid;gap:14px}
    .chapter5-repeat-editor-item{display:grid;gap:9px;padding:14px;border:1px solid #dce5df;border-radius:14px;background:#fbfcfb}
    .chapter5-repeat-editor-item input,.chapter5-repeat-editor-item textarea{width:100%;border:1px solid #ced9d2;border-radius:10px;background:#fff;color:#263b32;font:inherit;padding:10px 11px;box-sizing:border-box}
    .chapter5-repeat-editor-item textarea{min-height:135px;resize:vertical;line-height:1.5}
    .chapter5-repeat-editor-item input:focus,.chapter5-repeat-editor-item textarea:focus{outline:2px solid rgba(47,122,97,.18);border-color:#78a28f}
    .chapter5-repeat-remove{justify-self:end;border:0;background:transparent;color:#8a5048;font:inherit;font-size:.76rem;font-weight:800;cursor:pointer;padding:2px 0}
    .chapter5-repeat-add{justify-self:start;border:1px solid #cddfd4;border-radius:10px;background:#eef5f0;color:#1f5e4a;padding:9px 12px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .chapter5-repeat-message{min-height:18px;margin:0;color:#66746e;font-size:.78rem}
    .chapter5-repeat-message.error{color:#9a4138}
    .chapter5-repeat-actions{position:sticky;bottom:-17px;display:flex;justify-content:flex-end;gap:8px;margin:2px -17px -17px;padding:13px 17px;background:linear-gradient(to bottom,rgba(255,255,255,.92),#fff 30%);border-top:1px solid #edf1ee}
    .chapter5-repeat-actions button{border:0;border-radius:11px;background:#1f5e4a;color:#fff;padding:9px 13px;font:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .chapter5-repeat-actions button.secondary{background:#eef3ef;color:#1f5e4a;border:1px solid #dce7df}
    .chapter5-repeat-actions button:disabled{opacity:.5;cursor:not-allowed}
    @media(max-width:700px){.chapter5-repeat-overlay{padding:10px}.chapter5-repeat-dialog{width:100%;max-height:92vh;border-radius:16px}}
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const cleanEntry=value=>({title:String(value?.title||'').trim(),body:String(value?.body||'').trim()});

  function parseEntries(raw){
    const value=String(raw||'').trim();
    if(!value) return [];
    try{
      const parsed=JSON.parse(value);
      const list=Array.isArray(parsed)?parsed:Array.isArray(parsed?.entries)?parsed.entries:[];
      return list.map(cleanEntry).filter(item=>item.title||item.body);
    }catch(_err){
      return [{title:'',body:value}];
    }
  }

  function serializeEntries(list){
    const clean=list.map(cleanEntry).filter(item=>item.title||item.body);
    return clean.length?JSON.stringify({version:1,entries:clean}):'';
  }

  function hydrateFromState(){
    if(typeof state==='undefined' || !state?.values) return;
    Object.entries(sections).forEach(([category,cfg])=>{
      entries[category]=parseEntries(state.values[cfg.fieldId]);
    });
  }

  function updateChapterProgress(){
    if(typeof groups==='undefined' || !groups[4]) return;
    let count=0;
    groups[4].topics.forEach(topic=>{
      const special=topic.fields.map(([id])=>fieldToCategory.get(id)).find(Boolean);
      if(special){
        if(entries[special].some(item=>item.title||item.body)) count+=1;
      }else if(topic.fields.some(([id])=>String(typeof state!=='undefined'?state?.values?.[id]||'':'').trim())){
        count+=1;
      }
    });
    const progress=document.getElementById('progress-5');
    const text=`${count} van ${groups[4].topics.length} onderdelen ingevuld`;
    if(progress && progress.textContent!==text) progress.textContent=text;
  }

  function renderCategory(category){
    const cfg=sections[category];
    const card=document.querySelector(`[data-topic-card="${cfg.cardKey}"]`);
    if(!card) return;
    const list=entries[category]||[];
    const filled=list.some(item=>item.title||item.body);
    const signature=JSON.stringify(list);
    const content=card.querySelector('.topic-content');

    if(content && content.dataset.repeatableSignature!==signature){
      content.dataset.repeatableSignature=signature;
      content.innerHTML=filled
        ? `<div class="chapter5-repeat-list">${list.map(item=>`<article class="chapter5-repeat-entry">${item.title?`<h5>${esc(item.title)}</h5>`:''}${item.body?`<p>${esc(item.body)}</p>`:''}</article>`).join('')}</div>`
        : `<p class="topic-empty">${esc(cfg.empty)}</p>`;
    }

    card.classList.toggle('filled',filled);
    const badge=card.querySelector('.topic-state');
    const badgeText=filled?'Ingevuld':'Nog leeg';
    if(badge && badge.textContent!==badgeText) badge.textContent=badgeText;

    const current=card.querySelector('.topic-edit-btn');
    const buttonText=filled?'Aanpassen':'Invullen';
    if(current && current.dataset.repeatableEditor!==category){
      const button=current.cloneNode(true);
      button.removeAttribute('data-edit-topic');
      button.removeAttribute('data-file-upload-button');
      button.dataset.repeatableEditor=category;
      button.textContent=buttonText;
      current.replaceWith(button);
      button.addEventListener('click',()=>openEditor(category));
    }else if(current && current.textContent!==buttonText){
      current.textContent=buttonText;
    }
  }

  function renderSections(){
    renderCategory('feedback');
    renderCategory('lessonprep');
    updateChapterProgress();
  }

  function makeEditorItem(item={title:'',body:''}){
    const wrapper=document.createElement('section');
    wrapper.className='chapter5-repeat-editor-item';
    wrapper.innerHTML=`
      <input type="text" maxlength="200" data-repeat-title placeholder="Titel" value="${esc(item.title||'')}">
      <textarea data-repeat-body placeholder="Hoofdtekst">${esc(item.body||'')}</textarea>
      <button type="button" class="chapter5-repeat-remove" data-repeat-remove>Verwijderen</button>`;
    wrapper.querySelector('[data-repeat-remove]')?.addEventListener('click',()=>{
      const list=wrapper.closest('[data-repeat-editor-list]');
      if(!list) return;
      if(list.children.length===1){
        wrapper.querySelector('[data-repeat-title]').value='';
        wrapper.querySelector('[data-repeat-body]').value='';
        wrapper.querySelector('[data-repeat-title]').focus();
      }else{
        wrapper.remove();
      }
    });
    return wrapper;
  }

  function openEditor(category){
    if(!document.body.classList.contains('can-edit')) return;
    const cfg=sections[category];
    const overlay=document.createElement('div');
    overlay.className='chapter5-repeat-overlay';
    overlay.innerHTML=`
      <section class="chapter5-repeat-dialog" role="dialog" aria-modal="true" aria-label="${esc(cfg.title)} aanpassen">
        <header class="chapter5-repeat-head"><strong>${esc(cfg.title)}</strong><button class="chapter5-repeat-close" type="button" aria-label="Sluiten">×</button></header>
        <div class="chapter5-repeat-body">
          <div class="chapter5-repeat-editor-list" data-repeat-editor-list></div>
          <button class="chapter5-repeat-add" type="button" data-repeat-add>Nieuwe invoer +</button>
          <p class="chapter5-repeat-message" data-repeat-message></p>
          <div class="chapter5-repeat-actions"><button class="secondary" type="button" data-repeat-cancel>Annuleren</button><button type="button" data-repeat-save>Opslaan</button></div>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    const list=overlay.querySelector('[data-repeat-editor-list]');
    (entries[category].length?entries[category]:[{title:'',body:''}]).forEach(item=>list.appendChild(makeEditorItem(item)));

    const close=()=>overlay.remove();
    overlay.querySelector('.chapter5-repeat-close')?.addEventListener('click',close);
    overlay.querySelector('[data-repeat-cancel]')?.addEventListener('click',close);
    overlay.addEventListener('click',event=>{if(event.target===overlay) close();});
    overlay.querySelector('[data-repeat-add]')?.addEventListener('click',()=>{
      const item=makeEditorItem();
      list.appendChild(item);
      item.querySelector('[data-repeat-title]')?.focus();
      item.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    requestAnimationFrame(()=>list.querySelector('[data-repeat-title]')?.focus());

    overlay.querySelector('[data-repeat-save]')?.addEventListener('click',async event=>{
      const saveButton=event.currentTarget;
      const message=overlay.querySelector('[data-repeat-message]');
      const draft=[...list.querySelectorAll('.chapter5-repeat-editor-item')].map(item=>({
        title:item.querySelector('[data-repeat-title]')?.value?.trim()||'',
        body:item.querySelector('[data-repeat-body]')?.value?.trim()||''
      }));
      if(draft.some(item=>(item.title&&!item.body)||(!item.title&&item.body))){
        message.textContent='Vul bij elke invoer zowel een titel als de hoofdtekst in.';
        message.classList.add('error');
        return;
      }
      const clean=draft.filter(item=>item.title&&item.body);
      saveButton.disabled=true;
      message.classList.remove('error');
      message.textContent='Opslaan…';

      try{
        const {data:sessionData}=await client.auth.getSession();
        if(!sessionData?.session) throw new Error('Je bent niet meer ingelogd. Log opnieuw in.');
        const value=serializeEntries(clean);
        const {error}=await client.from('portfolio_content').upsert([{id:cfg.fieldId,value}],{onConflict:'id'});
        if(error) throw error;

        entries[category]=clean;
        if(typeof state!=='undefined' && state?.values) state.values[cfg.fieldId]=value;
        if(typeof persistState==='function') persistState(`${cfg.title} opgeslagen op website`);
        else if(typeof setStatus==='function') setStatus(`${cfg.title} opgeslagen op website`,'saved');
        renderSections();
        message.textContent='Opgeslagen.';
        setTimeout(close,300);
      }catch(err){
        console.error(`${cfg.title} opslaan mislukt:`,err);
        message.textContent='Opslaan mislukt: '+String(err?.message||err);
        message.classList.add('error');
        saveButton.disabled=false;
      }
    });
  }

  async function loadEntries(){
    hydrateFromState();
    renderSections();
    try{
      const ids=Object.values(sections).map(cfg=>cfg.fieldId);
      const {data,error}=await client.from('portfolio_content').select('id,value').in('id',ids);
      if(error) throw error;
      (data||[]).forEach(row=>{
        const category=fieldToCategory.get(row.id);
        if(!category) return;
        entries[category]=parseEntries(row.value);
        if(typeof state!=='undefined' && state?.values) state.values[row.id]=row.value||'';
      });
      renderSections();
    }catch(err){
      console.error('Feedback/lesvoorbereidingen laden mislukt:',err);
    }
  }

  const topics5=document.getElementById('topics-5');
  let observer=null;
  if(topics5){
    let scheduled=false;
    const observe=()=>observer?.observe(topics5,{childList:true,subtree:true});
    observer=new MutationObserver(()=>{
      if(scheduled) return;
      scheduled=true;
      setTimeout(()=>{
        scheduled=false;
        observer.disconnect();
        hydrateFromState();
        renderSections();
        observe();
      },0);
    });
    observe();
  }

  loadEntries();
})();
