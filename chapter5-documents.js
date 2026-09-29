(() => {
  'use strict';

  const repeatableFields={
    s9_feedback:{title:'Feedback praktijkbegeleider',empty:'Nog geen feedback toegevoegd.'},
    s17_lesvoorbereidingen:{title:'Lesvoorbereidingen',empty:'Nog geen lesvoorbereidingen toegevoegd.'}
  };
  let entryCounter=0;

  const escHtml=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function parseEntries(raw){
    const value=String(raw||'').trim();
    if(!value) return [];
    try{
      const parsed=JSON.parse(value);
      const list=Array.isArray(parsed)?parsed:Array.isArray(parsed?.entries)?parsed.entries:[];
      return list
        .map(item=>({title:String(item?.title||'').trim(),body:String(item?.body||'').trim()}))
        .filter(item=>item.title||item.body);
    }catch(_err){
      return [{title:'',body:value}];
    }
  }

  function serializeEntries(list){
    const clean=list
      .map(item=>({title:String(item?.title||'').trim(),body:String(item?.body||'').trim()}))
      .filter(item=>item.title||item.body);
    return clean.length?JSON.stringify({version:1,entries:clean}):'';
  }

  function renderRich(value){
    const rich=window.portfolioRichText;
    if(rich?.isRich?.(value)) return rich.sanitize(value);
    return escHtml(value).replace(/\n/g,'<br>');
  }

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
      if(p) p.textContent='Wie ben ik als wandelcoach, waar sta ik nu en welke leerdoelen horen bij mijn profiel?';
      const tags=profileCard.querySelectorAll('.mini-tags span');
      if(tags[0]) tags[0].textContent='Profiel als wandelcoach';
      if(tags[1]) tags[1].textContent='Persoonlijke leerdoelen';
    }

    const doelgroepCard=overviewCards[1];
    if(doelgroepCard){
      doelgroepCard.querySelector('h4')?.replaceChildren(document.createTextNode('Doelgroep'));
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

  const style=document.createElement('style');
  style.textContent=`
    .chapter5-native-list{display:grid;gap:18px}
    .chapter5-native-entry{display:grid;gap:12px;padding:0 0 18px;border-bottom:1px solid #e4ebe6}
    .chapter5-native-entry:last-child{border-bottom:0;padding-bottom:2px}
    .chapter5-native-entry .modal-field input{width:100%;border:1px solid #cbd8d0;border-radius:12px;background:#fff;color:#26352e;font:inherit;padding:11px 12px;box-sizing:border-box}
    .chapter5-native-entry .modal-field input:focus{outline:2px solid rgba(31,94,74,.18);border-color:#6e9985}
    .chapter5-native-remove{justify-self:end;border:0;background:transparent;color:#8d5148;padding:2px 0;font:inherit;font-size:.76rem;font-weight:800;cursor:pointer}
    .chapter5-native-add{justify-self:start;margin-top:2px}
    .chapter5-native-message{margin:0;min-height:18px;color:#66746e;font-size:.78rem}
    .chapter5-native-message.error{color:#9a4138}
    .chapter5-repeat-list{display:grid;gap:14px}
    .chapter5-repeat-entry{padding:0 0 13px;border-bottom:1px solid #e5ebe7}
    .chapter5-repeat-entry:last-child{padding-bottom:0;border-bottom:0}
    .chapter5-repeat-entry h5{margin:0 0 5px;color:#244f40;font-family:Georgia,serif;font-size:.96rem;line-height:1.3}
    .chapter5-rich-body{color:#53635b;line-height:1.55;overflow-wrap:anywhere}
    .chapter5-rich-body p{margin:.25em 0}
    .chapter5-rich-body ul,.chapter5-rich-body ol{margin:.35em 0 .35em 1.4em;padding-left:.7em}
    .chapter5-rich-body a[data-portfolio-file-id],.chapter5-rich-body a[data-portfolio-file-ids]{color:#1f5e4a;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px;font-weight:750;cursor:pointer}
  `;
  document.head.appendChild(style);

  function repeatableFieldForTopic(topic){
    if(!topic?.fields?.length) return null;
    const id=topic.fields[0]?.[0];
    return repeatableFields[id]?id:null;
  }

  function renderRepeatableCards(){
    if(typeof groups==='undefined' || typeof state==='undefined') return;
    groups.forEach((group,groupIndex)=>{
      group.topics.forEach((topic,topicIndex)=>{
        const fieldId=repeatableFieldForTopic(topic);
        if(!fieldId) return;
        const card=document.querySelector(`[data-topic-card="${groupIndex}-${topicIndex}"]`);
        const content=card?.querySelector('.topic-content');
        if(!content) return;
        const list=parseEntries(state.values[fieldId]);
        content.innerHTML=list.length
          ? `<div class="chapter5-repeat-list">${list.map(item=>`<article class="chapter5-repeat-entry">${item.title?`<h5>${escHtml(item.title)}</h5>`:''}${item.body?`<div class="chapter5-rich-body">${renderRich(item.body)}</div>`:''}</article>`).join('')}</div>`
          : `<p class="topic-empty">${escHtml(repeatableFields[fieldId].empty)}</p>`;
      });
    });
  }

  function collectEntries(list){
    return [...list.querySelectorAll('.chapter5-native-entry')].map(entry=>({
      title:entry.querySelector('[data-repeat-title]')?.value?.trim()||'',
      body:entry.querySelector('[data-repeat-body]')?.value?.trim()||''
    }));
  }

  function makeEntry(fieldId,item={title:'',body:''}){
    const section=document.createElement('section');
    section.className='chapter5-native-entry';
    const key=`chapter5-native-${fieldId}-${Date.now()}-${++entryCounter}`;
    section.innerHTML=`
      <div class="modal-field">
        <label>Titel<small>Geef deze invoer een korte, duidelijke titel.</small></label>
        <input type="text" maxlength="200" data-repeat-title placeholder="Typ hier de titel">
      </div>
      <div class="modal-field">
        <label>Hoofdtekst<small>Werk de invoer hier uit. Opmaak en bewijsstukken koppelen werken hetzelfde als in de andere onderdelen.</small></label>
        <textarea data-modal-field="${key}" data-repeat-body></textarea>
      </div>
      <button type="button" class="chapter5-native-remove" data-repeat-remove>Verwijderen</button>`;
    section.querySelector('[data-repeat-title]').value=item.title||'';
    section.querySelector('[data-repeat-body]').value=item.body||'';
    return section;
  }

  function enhanceNativeWindow(win){
    if(!win?.el || win.el.dataset.nativeRepeatableReady==='1') return;
    const fieldId=repeatableFieldForTopic(win.topic);
    if(!fieldId) return;

    const canonical=win.el.querySelector(`[data-modal-field="${fieldId}"]`);
    const fields=win.el.querySelector('.modal-fields');
    if(!canonical||!fields) return;

    win.el.dataset.nativeRepeatableReady='1';
    const initial=parseEntries(canonical.value);
    canonical.dataset.richEnhanced='1';
    canonical.dataset.repeatCanonical='1';
    canonical.style.display='none';
    canonical.setAttribute('aria-hidden','true');

    const list=document.createElement('div');
    list.className='chapter5-native-list';
    list.dataset.nativeRepeatList='1';
    (initial.length?initial:[{title:'',body:''}]).forEach(item=>list.appendChild(makeEntry(fieldId,item)));

    const add=document.createElement('button');
    add.type='button';
    add.className='text-button chapter5-native-add';
    add.dataset.nativeRepeatAdd='1';
    add.textContent='Nieuwe invoer +';

    const message=document.createElement('p');
    message.className='chapter5-native-message';
    message.dataset.nativeRepeatMessage='1';

    fields.replaceChildren(canonical,list,add,message);

    const syncCanonical=()=>{
      canonical.value=serializeEntries(collectEntries(list));
    };
    const markDirty=()=>{
      syncCanonical();
      if(typeof setWindowDirty==='function') setWindowDirty(win,true);
    };

    list.addEventListener('input',markDirty);

    list.addEventListener('click',event=>{
      const remove=event.target.closest?.('[data-repeat-remove]');
      if(!remove) return;
      const entry=remove.closest('.chapter5-native-entry');
      if(!entry) return;
      if(list.children.length===1){
        entry.querySelector('[data-repeat-title]').value='';
        const textarea=entry.querySelector('[data-repeat-body]');
        const editor=entry.querySelector('.rich-editor');
        if(editor){
          editor.innerHTML='';
          editor.dispatchEvent(new Event('input',{bubbles:true}));
        }else if(textarea){
          textarea.value='';
          textarea.dispatchEvent(new Event('input',{bubbles:true}));
        }
        entry.querySelector('[data-repeat-title]')?.focus();
      }else{
        entry.remove();
        markDirty();
      }
    });

    add.addEventListener('click',()=>{
      const entry=makeEntry(fieldId);
      list.appendChild(entry);
      markDirty();
      entry.querySelector('[data-repeat-title]')?.focus();
      entry.scrollIntoView({behavior:'smooth',block:'nearest'});
    });

    const saveButton=win.el.querySelector('[data-window-save]');
    saveButton?.addEventListener('click',event=>{
      const draft=collectEntries(list);
      if(draft.some(item=>(item.title&&!item.body)||(!item.title&&item.body))){
        event.preventDefault();
        event.stopImmediatePropagation();
        message.textContent='Vul bij elke invoer zowel een titel als de hoofdtekst in.';
        message.classList.add('error');
        return;
      }
      message.textContent='';
      message.classList.remove('error');
      syncCanonical();
    },true);

    syncCanonical();
  }

  applyPortfolioStructure();

  if(typeof openEditor==='function' && typeof openWindows!=='undefined'){
    const originalOpenEditor=openEditor;
    openEditor=function(groupIndex,topicIndex){
      originalOpenEditor(groupIndex,topicIndex);
      const key=typeof makeWindowKey==='function'?makeWindowKey(groupIndex,topicIndex):`${groupIndex}-${topicIndex}`;
      const win=openWindows.get(key);
      if(win) enhanceNativeWindow(win);
    };
  }

  if(typeof renderChapters==='function'){
    const originalRenderChapters=renderChapters;
    const nativeRepeatableRender=function(){
      originalRenderChapters();
      renderRepeatableCards();
      syncStaticLabels();
    };
    try{
      window.renderChapters=nativeRepeatableRender;
      renderChapters=nativeRepeatableRender;
    }catch(_err){
      window.renderChapters=nativeRepeatableRender;
    }
    nativeRepeatableRender();
  }else{
    syncStaticLabels();
  }
})();