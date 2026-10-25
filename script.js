const body = document.body;
const menuBtn = document.getElementById('menuBtn');
const STORAGE_KEY = 'portfolio-tineke-posthuma-v1';

const groups = [
  {n:'01',title:'Profiel & leerdoelen',sub:'Wie ben ik als trainer en wat wil ik ontwikkelen?',topics:[
    {title:'Mijn profiel als wandeltrainer',fields:[
      ['s1_intro','Korte introductie','Wie ben je, welke ervaring heb je met wandelen en training geven, en in welke context geef je training?'],
      ['s1_motivatie','Motivatie','Waarom volg je Wandeltrainer 3? Wat wil je als trainer bereiken?'],
      ['s1_visie','Mijn visie','Wat vind jij belangrijk in een goede wandeltraining?']
    ]},
    {title:'Persoonlijke leerdoelen',fields:[
      ['s2_start','Startpunt','Welke vaardigheden beheers je al en waar wil je beter in worden?'],
      ['s2_leerdoelen','Leerdoelen','Formuleer 3–5 concrete leerdoelen.'],
      ['s2_succes','Succescriteria','Hoe weet je aan het einde dat je jouw leerdoelen hebt bereikt?']
    ]}
  ]},
  {n:'02',title:'Doelgroep & doelen',sub:'Voor wie geef ik training en waar werken we naartoe?',topics:[
    {title:'Beginsituatie en doelgroep',fields:[
      ['s3_groep','Groepsprofiel','Beschrijf leeftijd, omvang, wandelervaring, niveau en motivatie.'],
      ['s3_begin','Beginsituatie','Wat kunnen de deelnemers nu? Waar liggen kansen en aandachtspunten?']
    ]},
    {title:'Trainingsdoelen',fields:[
      ['s4_doelen','Trainingsdoelen','Welke concrete doelen wil je met de groep bereiken?'],
      ['s4_onderbouwing','Onderbouwing en meetpunten','Waarom passen deze doelen bij de doelgroep en hoe volg je de voortgang?']
    ]}
  ]},
  {n:'03',title:'Planning & voorbereiding',sub:'Van periode-opbouw naar concrete trainingsvoorbereiding.',topics:[
    {title:'Periodeplanning',fields:[['s5_planning','Periodeplanning','Beschrijf de opbouw van de periode, thema’s, belasting en progressie.']]},
    {title:'Trainingsvoorbereiding',fields:[['s6_voorbereiding','Voorbereiding','Doel, warming-up, kern, afsluiting, materialen, organisatie en aandachtspunten.']]}
  ]},
  {n:'04',title:'Uitvoering & bewijs',sub:'Wat heb ik gedaan en waarmee laat ik dat zien?',topics:[
    {title:'Uitvoering en bewijs',fields:[
      ['s7_uitvoering','Uitvoering','Wat heb je uitgevoerd en hoe verliep de training in de praktijk?'],
      ['s7_bewijs','Bewijs','Noteer foto’s, documenten, observaties of andere bewijsstukken die hierbij horen.']
    ]},
    {title:'Veiligheid en risicoanalyse',fields:[['s11_veiligheid','Veiligheid en risicoanalyse','Welke risico’s zijn relevant en welke maatregelen neem je?']]},
    {title:'Communicatie en begeleiding',fields:[['s12_communicatie','Communicatie en begeleiding','Hoe geef je instructie, feedback en persoonlijke begeleiding?']]}
  ]},
  {n:'05',title:'Observaties & Opdrachten',sub:'Vastleggen van observaties en uitgevoerde opdrachten.',topics:[
    {title:'Observaties',fields:[['s18_observaties','Observaties','Wat heb je geobserveerd en wat zijn je belangrijkste bevindingen?']]},
    {title:'Opdrachten',fields:[['s19_opdrachten','Opdrachten','Welke opdracht heb je uitgevoerd en wat heb je ervan geleerd?']]}
  ]},
  {n:'06',title:'Evaluatie & feedback',sub:'Terugkijken, feedback verwerken en bijstellen.',topics:[
    {title:'Evaluatie en bijstelling',fields:[
      ['s8_evaluatie','Evaluatie','Wat ging goed en wat kon beter?']
    ]},
    {title:'Feedback praktijkbegeleider',fields:[['s9_feedback','Feedback','Welke feedback heb je gekregen en wat heb je ermee gedaan?']]},
    {title:'Aansturen van assisterend kader',fields:[['s10_kader','Aansturing','Hoe stuur je assistenten aan, verdeel je taken en bewaak je afspraken?']]}
  ]},
  {n:'07',title:'Ontwikkeling & reflectie',sub:'Wat heb ik geleerd en wat neem ik mee?',topics:[
    {title:'Mijn ontwikkeling als trainer',fields:[['s13_ontwikkeling','Mijn ontwikkeling','Wat heb je geleerd en welke veranderingen zie je in je trainerhandelen?']]},
    {title:'Eindreflectie',fields:[['s14_reflectie','Eindreflectie','Wat neem je mee uit de opleiding en hoe wil je je verder ontwikkelen?']]},
    {title:'Bewijsstukkenregister',fields:[['s15_register','Bewijsstukkenregister','Noteer titel/bestand, datum, onderdeel en een korte toelichting.']]},
    {title:'Bijlagen',fields:[['s16_bijlagen','Bijlagen','Noteer hier welke bijlagen bij het portfolio horen.']]}
  ]}
];

const esc = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Uitgefaseerde invoervelden verschijnen niet opnieuw via opgeslagen oude indelingen.
const removedInputFieldIds = new Set(['s3_behoeften','s8_bijstelling']);
const baseTopicFields = topic => (topic?.fields || []).filter(([id]) => !removedInputFieldIds.has(id));
const extraFieldId = /^extra_[a-z0-9]{12,48}$/i;
// A topic's first original content ID (or custom topic's ID) never changes when reordered.
const topicFieldLayoutKey = topic => 'topic_field_layout_v1_' + (topic?.portfolioKey || topic?.fields?.[0]?.[0] || '');
const fieldHeadingKey = id => 'field_heading_' + id;
const fieldHeading = (id,original) => String(state.values[fieldHeadingKey(id)] || '').trim() || original;

function fieldsFromLayout(topic,stored){
  const defaults=baseTopicFields(topic);
  if(!stored) return defaults.map(field=>field.slice());
  try{
    const saved=JSON.parse(stored);
    if(saved?.version!==1||!Array.isArray(saved.fields)||saved.fields.length>40) return defaults.map(field=>field.slice());
    const originals=new Map(defaults.map(field=>[field[0],field]));
    const seen=new Set();
    const fields=[];
    for(const record of saved.fields){
      const id=String(record?.id||'');
      if(seen.has(id)) continue;
      if(originals.has(id)) fields.push(originals.get(id).slice());
      else if(extraFieldId.test(id)){
        const label=String(record.label||'Nieuw kopje').trim().slice(0,120)||'Nieuw kopje';
        fields.push([id,label,'']);
      }else continue;
      seen.add(id);
    }
    return fields;
  }catch(_err){return defaults.map(field=>field.slice());}
}
const visibleTopicFields = topic => fieldsFromLayout(topic,state.values[topicFieldLayoutKey(topic)]);
function serializeFieldLayout(fields){
  return JSON.stringify({version:1,fields:fields.map(([id,label])=>
    extraFieldId.test(id)?{id,label}:{id}
  )});
}
function newFieldId(){
  const random=globalThis.crypto?.randomUUID?.().replace(/-/g,'') ||
    (Date.now().toString(36)+Math.random().toString(36).slice(2));
  return 'extra_'+random;
}

let state = {version:2, updatedAt:null, values:{}};
const openWindows = new Map();
let topZ = 1100;
let activeWindowKey = null;
let scrollWasLocked = false;

const saveStatus = document.getElementById('saveStatus');
const statusWrap = saveStatus?.closest('.status');
const windowLayer = document.getElementById('windowLayer');
windowLayer?.querySelector('#editorWindow')?.remove();

menuBtn?.addEventListener('click',()=>{
  const open=body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded',String(open));
});

document.querySelectorAll('.nav a').forEach(link=>link.addEventListener('click',()=>{
  body.classList.remove('menu-open');
  menuBtn?.setAttribute('aria-expanded','false');
}));

function setStatus(text,statusClass=''){
  if(saveStatus) saveStatus.textContent=text;
  if(statusWrap){
    statusWrap.classList.remove('saved','saving','error');
    if(statusClass) statusWrap.classList.add(statusClass);
  }
}

function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const parsed=JSON.parse(raw);
    state={version:2,updatedAt:parsed.updatedAt||null,values:{...(parsed.values||{})}};
    if(state.updatedAt){
      const date=new Date(state.updatedAt);
      if(!Number.isNaN(date.getTime())) setStatus(`Concept opgeslagen · ${date.toLocaleDateString('nl-NL')}`,'saved');
    }
  }catch(err){
    setStatus('Opgeslagen concept kon niet worden geladen','error');
  }
}

function persistState(message='Onderdeel opgeslagen'){
  state.version=2;
  state.updatedAt=new Date().toISOString();
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    setStatus(message,'saved');
    return true;
  }catch(err){
    setStatus('Opslaan mislukt','error');
    return false;
  }
}

function topicValues(topic){
  return visibleTopicFields(topic).map(([id,label])=>({id,label:fieldHeading(id,label),value:String(state.values[id]||'').trim()}));
}

function headingRows(win){
  const rows=[];
  for(const [id,original] of win.editorFields){
    const control=win.el.querySelector(`[data-modal-heading="${id}"]`);
    const value=control?.value?.trim() || '';
    if(!value){
      setStatus('Vul voor elk tekstvak een kopje in.','error');
      control?.focus();
      return null;
    }
    if(value!==fieldHeading(id,original)) rows.push({id:fieldHeadingKey(id),value});
  }
  return rows;
}
function editorRows(win){
  const headings=headingRows(win);
  if(!headings) return null;
  const rows=[];
  for(const [id] of win.editorFields){
    const field=win.el.querySelector(`[data-modal-field="${id}"]`);
    if(!field) return null;
    rows.push({id,value:field.value||''});
  }
  rows.push(...headings,{id:topicFieldLayoutKey(win.topic),value:serializeFieldLayout(win.editorFields)});
  return rows;
}

function isTopicFilled(topic){
  return topicValues(topic).some(item=>item.value);
}

function renderChapters(){
  groups.forEach((group,groupIndex)=>{
    const target=document.getElementById(`topics-${groupIndex+1}`);
    if(!target) return;
    let filledCount=0;

    target.innerHTML=group.topics.map((topic,topicIndex)=>{
      const values=topicValues(topic);
      const filled=values.some(item=>item.value);
      if(filled) filledCount++;
      const content=filled
        ? values.filter(item=>item.value).map(item=>`<div class="saved-field"><strong>${esc(item.label)}</strong><p>${esc(item.value)}</p></div>`).join('')
        : '<p class="topic-empty">Nog niet ingevuld. Voeg hier de tekst voor dit onderdeel toe.</p>';
      const number=`${group.n}.${topicIndex+1}`;
      const key=`${groupIndex}-${topicIndex}`;
      const alreadyOpen=openWindows.has(key);
      return `<article class="topic-card ${filled?'filled':''}" data-topic-card="${key}">
        <div class="topic-card-head">
          <div class="topic-card-title"><span class="topic-index">Onderdeel ${number}</span><h4>${esc(topic.title)}</h4></div>
          <span class="topic-state">${filled?'Ingevuld':'Nog leeg'}</span>
        </div>
        <div class="topic-content">${content}</div>
        <button class="topic-edit-btn" type="button" data-edit-topic="${key}">${alreadyOpen?'Venster openen':(filled?'Aanpassen':'Invullen')}</button>
      </article>`;
    }).join('');

    const progress=document.getElementById(`progress-${groupIndex+1}`);
    if(progress) progress.textContent=`${filledCount} van ${group.topics.length} onderdelen ingevuld`;
  });

  document.querySelectorAll('[data-edit-topic]').forEach(button=>{
    button.addEventListener('click',()=>{
      const [groupIndex,topicIndex]=button.dataset.editTopic.split('-').map(Number);
      openEditor(groupIndex,topicIndex);
    });
  });
}

function makeWindowKey(groupIndex,topicIndex){
  return `${groupIndex}-${topicIndex}`;
}

function lockPageScroll(locked){
  if(locked===scrollWasLocked) return;
  scrollWasLocked=locked;
  document.documentElement.style.overflow=locked?'hidden':'';
  body.style.overflow=locked?'hidden':'';
  document.documentElement.style.overscrollBehavior=locked?'none':'';
  body.style.overscrollBehavior=locked?'none':'';
}

function syncPageScrollLock(){
  const hasExpanded=[...openWindows.values()].some(win=>!win.minimized);
  lockPageScroll(hasExpanded);
  if(windowLayer) windowLayer.hidden=openWindows.size===0;
}

function bringToFront(win,focus=true){
  topZ+=1;
  win.z=topZ;
  win.el.style.zIndex=String(topZ);
  activeWindowKey=win.key;
  openWindows.forEach(other=>other.el.classList.toggle('is-active',other.key===win.key));
  if(focus && !win.minimized){
    requestAnimationFrame(()=>win.el.querySelector('textarea')?.focus({preventScroll:true}));
  }
}

function centerFloatingWindow(win,cascade=true){
  const el=win.el;
  el.style.right='auto';
  el.style.bottom='auto';
  el.style.left='12px';
  el.style.top='72px';
  requestAnimationFrame(()=>{
    const rect=el.getBoundingClientRect();
    const expandedCount=[...openWindows.values()].filter(item=>!item.minimized).length;
    const offset=cascade?Math.min(70,Math.max(0,expandedCount-1)*22):0;
    const left=Math.max(8,(window.innerWidth-rect.width)/2+offset);
    const top=Math.max(58,(window.innerHeight-rect.height)/2+offset/2);
    const next=clampWindowPosition(el,left,top);
    el.style.left=`${next.left}px`;
    el.style.top=`${next.top}px`;
  });
}

function clampWindowPosition(el,left,top){
  const rect=el.getBoundingClientRect();
  const width=Math.min(rect.width,window.innerWidth-16);
  const height=Math.min(rect.height,window.innerHeight-16);
  const maxLeft=Math.max(8,window.innerWidth-width-8);
  const maxTop=Math.max(58,window.innerHeight-height-8);
  return {
    left:Math.min(Math.max(8,left),maxLeft),
    top:Math.min(Math.max(58,top),maxTop)
  };
}

function windowHasUnsavedChanges(win){
  if(!win.dirty) return false;
  const original=visibleTopicFields(win.topic);
  if(serializeFieldLayout(win.editorFields)!==serializeFieldLayout(original)) return true;
  return win.editorFields.some(([id,label])=>{
    const field=win.el.querySelector(`[data-modal-field="${id}"]`);
    const heading=win.el.querySelector(`[data-modal-heading="${id}"]`);
    return (field?.value||'') !== (state.values[id]||'') ||
      (heading?.value||'').trim() !== fieldHeading(id,label);
  });
}

function setWindowDirty(win,dirty=true){
  win.dirty=dirty;
  const hint=win.el.querySelector('[data-window-save-hint]');
  if(!hint) return;
  if(dirty){
    hint.textContent='Wijzigingen zijn nog niet opgeslagen.';
    hint.classList.remove('saved');
  }else{
    hint.textContent='Opgeslagen.';
    hint.classList.add('saved');
  }
}

function editorFieldMarkup(field,key){
  const [id,label,help]=field;
  return `<div class="modal-field" data-editor-field="${esc(id)}">
    <div class="modal-heading-control">
      <label for="modal-heading-${key}-${esc(id)}">Kopje aanpassen</label>
      <input type="text" id="modal-heading-${key}-${esc(id)}" data-modal-heading="${esc(id)}" maxlength="120" value="${esc(fieldHeading(id,label))}">
      <button type="button" class="modal-remove-heading" data-remove-heading="${esc(id)}" title="Kopje en tekstvak verwijderen" aria-label="Kopje verwijderen">Verwijderen</button>
    </div>
    <label for="modal-${key}-${esc(id)}" data-modal-heading-preview="${esc(id)}">${esc(fieldHeading(id,label))}${help?`<small>${esc(help)}</small>`:''}</label>
    <textarea id="modal-${key}-${esc(id)}" data-modal-field="${esc(id)}"></textarea>
  </div>`;
}
function windowMarkup(group,topic,groupIndex,topicIndex,key){
  const fields=visibleTopicFields(topic).map(field=>editorFieldMarkup(field,key)).join('');
  return `<section class="editor-window" data-editor-window="${key}" role="dialog" aria-modal="false" aria-labelledby="window-title-${key}">
    <header class="window-bar" data-window-drag-handle>
      <div class="window-title-wrap">
        <span class="window-kicker">Hoofdstuk ${group.n} · onderdeel ${topicIndex+1}</span>
        <strong id="window-title-${key}">${esc(topic.title)}</strong>
      </div>
      <div class="window-controls">
        <button class="window-control" data-window-minimize type="button" aria-label="Minimaliseren" title="Minimaliseren">−</button>
        <button class="window-control close" data-window-close type="button" aria-label="Sluiten" title="Sluiten">×</button>
      </div>
    </header>
    <div class="window-body">
      <p class="window-help">Werk alleen dit onderdeel uit. Klik op Opslaan om de tekst direct bij “${esc(topic.title)}” in het portfolio te tonen.</p>
      <div class="modal-fields">${fields}</div>
      <button class="modal-add-heading" type="button" data-add-heading>+ Kopje toevoegen</button>
      <p class="modal-fields-note">Je kunt kopjes toevoegen of verwijderen. Wijzigingen worden pas definitief zichtbaar na Opslaan.</p>
    </div>
    <footer class="window-footer">
      <span class="window-save-hint ${isTopicFilled(topic)?'saved':''}" data-window-save-hint>${isTopicFilled(topic)?'Bestaande tekst geladen.':'Dit onderdeel is nog leeg.'}</span>
      <div class="window-actions">
        <button class="text-button" data-window-cancel type="button">Sluiten</button>
        <button class="save-large" data-window-save type="button">Opslaan</button>
      </div>
    </footer>
  </section>`;
}

function attachWindowEvents(win){
  const el=win.el;
  const handle=el.querySelector('[data-window-drag-handle]');
  const minimize=el.querySelector('[data-window-minimize]');

  el.addEventListener('pointerdown',()=>bringToFront(win,false));
  const wireField=row=>{
    const field=row.querySelector('[data-modal-field]');
    if(field){
      field.value=state.values[field.dataset.modalField]||'';
      field.addEventListener('input',()=>setWindowDirty(win,true));
    }
    const input=row.querySelector('[data-modal-heading]');
    input?.addEventListener('input',()=>{
      const preview=row.querySelector('[data-modal-heading-preview]');
      if(preview?.firstChild) preview.firstChild.textContent=input.value.trim();
      setWindowDirty(win,true);
    });
  };
  el.querySelectorAll('[data-editor-field]').forEach(wireField);
  el.querySelector('[data-add-heading]')?.addEventListener('click',()=>{
    if(win.editorFields.length>=40){
      window.alert('Maximaal 40 kopjes per onderdeel.');
      return;
    }
    const field=[newFieldId(),'Nieuw kopje',''];
    win.editorFields.push(field);
    const wrapper=document.createElement('div');
    wrapper.innerHTML=editorFieldMarkup(field,win.key);
    const row=wrapper.firstElementChild;
    el.querySelector('.modal-fields').appendChild(row);
    wireField(row);
    setWindowDirty(win,true);
    row.querySelector('[data-modal-heading]')?.focus();
    row.querySelector('[data-modal-heading]')?.select();
  });
  el.querySelector('.modal-fields')?.addEventListener('click',event=>{
    const button=event.target.closest('[data-remove-heading]');
    if(!button) return;
    const id=button.dataset.removeHeading;
    const row=button.closest('[data-editor-field]');
    const label=row?.querySelector('[data-modal-heading]')?.value?.trim()||'dit kopje';
    const content=row?.querySelector('[data-modal-field]')?.value?.trim()||'';
    const warning=content
      ? `Kopje “${label}” en de tekst eronder verdwijnen uit dit onderdeel. De eerder opgeslagen tekst blijft veilig bewaard. Doorgaan?`
      : `Kopje “${label}” verwijderen?`;
    if(!window.confirm(warning)) return;
    win.editorFields=win.editorFields.filter(field=>field[0]!==id);
    row?.remove();
    setWindowDirty(win,true);
  });

  el.querySelector('[data-window-close]')?.addEventListener('click',()=>closeWindow(win,false));
  el.querySelector('[data-window-cancel]')?.addEventListener('click',()=>closeWindow(win,false));
  el.querySelector('[data-window-save]')?.addEventListener('click',()=>saveWindow(win));
  minimize?.addEventListener('click',()=>toggleMinimize(win));

  handle?.addEventListener('pointerdown',event=>{
    if(event.target.closest('button')||win.minimized) return;
    bringToFront(win,false);
    const rect=el.getBoundingClientRect();
    win.dragState={pointerId:event.pointerId,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};
    handle.setPointerCapture(event.pointerId);
    body.classList.add('window-dragging');
    el.style.right='auto';
    el.style.bottom='auto';
  });
  handle?.addEventListener('pointermove',event=>{
    if(!win.dragState||win.dragState.pointerId!==event.pointerId) return;
    const next=clampWindowPosition(el,event.clientX-win.dragState.offsetX,event.clientY-win.dragState.offsetY);
    el.style.left=`${next.left}px`;
    el.style.top=`${next.top}px`;
  });
  const stopDrag=event=>{
    if(!win.dragState) return;
    if(event && win.dragState.pointerId!==event.pointerId) return;
    try{handle.releasePointerCapture(win.dragState.pointerId);}catch(_err){}
    win.dragState=null;
    if(![...openWindows.values()].some(item=>item.dragState)) body.classList.remove('window-dragging');
  };
  handle?.addEventListener('pointerup',stopDrag);
  handle?.addEventListener('pointercancel',stopDrag);
}

function openEditor(groupIndex,topicIndex){
  const group=groups[groupIndex];
  const topic=group?.topics[topicIndex];
  if(!group||!topic||!windowLayer) return;
  const key=makeWindowKey(groupIndex,topicIndex);

  const existing=openWindows.get(key);
  if(existing){
    if(existing.minimized) restoreWindow(existing);
    bringToFront(existing,true);
    return;
  }

  const wrapper=document.createElement('div');
  wrapper.innerHTML=windowMarkup(group,topic,groupIndex,topicIndex,key).trim();
  const el=wrapper.firstElementChild;
  windowLayer.appendChild(el);

  const win={key,el,groupIndex,topicIndex,group,topic,editorFields:visibleTopicFields(topic),dirty:false,minimized:false,restorePosition:null,dragState:null,z:0};
  openWindows.set(key,win);
  attachWindowEvents(win);
  windowLayer.hidden=false;
  bringToFront(win,false);
  centerFloatingWindow(win,true);
  syncPageScrollLock();
  renderChapters();
  setTimeout(()=>el.querySelector('textarea')?.focus({preventScroll:true}),90);
}

function closeWindow(win,force=false){
  if(!win||!openWindows.has(win.key)) return;
  if(!force&&windowHasUnsavedChanges(win)){
    const ok=window.confirm(`Je hebt wijzigingen in “${win.topic.title}” die nog niet zijn opgeslagen. Toch sluiten?`);
    if(!ok) return;
  }
  win.el.remove();
  openWindows.delete(win.key);
  if(activeWindowKey===win.key){
    const remaining=[...openWindows.values()].sort((a,b)=>b.z-a.z);
    activeWindowKey=remaining[0]?.key||null;
    if(remaining[0]) bringToFront(remaining[0],false);
  }
  layoutMinimizedWindows();
  syncPageScrollLock();
  renderChapters();
}

function saveWindow(win){
  if(!win||!openWindows.has(win.key)) return;
  const rows=editorRows(win);
  if(!rows) return;
  const previous={...state.values};
  rows.forEach(row=>{state.values[row.id]=row.value;});
  if(!persistState(`${win.topic.title} opgeslagen`)){
    state.values=previous;
    return;
  }
  setWindowDirty(win,false);
  const cardSelector=`[data-topic-card="${win.groupIndex}-${win.topicIndex}"]`;
  renderChapters();
  closeWindow(win,true);
  if(![...openWindows.values()].some(item=>!item.minimized)){
    requestAnimationFrame(()=>document.querySelector(cardSelector)?.scrollIntoView({behavior:'smooth',block:'center'}));
  }
}

function toggleMinimize(win){
  if(!win||!openWindows.has(win.key)) return;
  if(win.minimized) restoreWindow(win);
  else minimizeWindow(win);
}

function minimizeWindow(win){
  const rect=win.el.getBoundingClientRect();
  win.restorePosition={left:rect.left,top:rect.top};
  win.minimized=true;
  win.el.classList.add('minimized');
  const button=win.el.querySelector('[data-window-minimize]');
  if(button){button.textContent='□';button.setAttribute('aria-label','Herstellen');button.title='Herstellen';}
  layoutMinimizedWindows();
  syncPageScrollLock();
}

function restoreWindow(win){
  win.minimized=false;
  win.el.classList.remove('minimized');
  win.el.style.right='auto';
  win.el.style.bottom='auto';
  const button=win.el.querySelector('[data-window-minimize]');
  if(button){button.textContent='−';button.setAttribute('aria-label','Minimaliseren');button.title='Minimaliseren';}
  const next=clampWindowPosition(win.el,win.restorePosition?.left??20,win.restorePosition?.top??80);
  win.el.style.left=`${next.left}px`;
  win.el.style.top=`${next.top}px`;
  bringToFront(win,true);
  layoutMinimizedWindows();
  syncPageScrollLock();
}

function layoutMinimizedWindows(){
  const minimized=[...openWindows.values()].filter(win=>win.minimized).sort((a,b)=>a.z-b.z);
  if(!minimized.length) return;
  const itemWidth=Math.min(340,Math.max(240,window.innerWidth-24));
  const gap=10;
  const rowHeight=54;
  const usableHeight=Math.max(rowHeight,window.innerHeight-90);
  const rows=Math.max(1,Math.floor(usableHeight/rowHeight));
  minimized.forEach((win,index)=>{
    const row=index%rows;
    const col=Math.floor(index/rows);
    win.el.style.left='auto';
    win.el.style.top='auto';
    win.el.style.right=`${12+col*(itemWidth+gap)}px`;
    win.el.style.bottom=`${12+row*rowHeight}px`;
  });
}

window.addEventListener('resize',()=>{
  openWindows.forEach(win=>{
    if(win.minimized) return;
    const rect=win.el.getBoundingClientRect();
    const next=clampWindowPosition(win.el,rect.left,rect.top);
    win.el.style.left=`${next.left}px`;
    win.el.style.top=`${next.top}px`;
  });
  layoutMinimizedWindows();
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&openWindows.size){
    const target=[...openWindows.values()].sort((a,b)=>b.z-a.z)[0];
    if(target) closeWindow(target,false);
  }
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&openWindows.size){
    const target=activeWindowKey?openWindows.get(activeWindowKey):[...openWindows.values()].sort((a,b)=>b.z-a.z)[0];
    if(target&&!target.minimized){
      event.preventDefault();
      saveWindow(target);
    }
  }
});

function exportBackup(){
  const data=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`portfolio-tineke-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById('exportBtn')?.addEventListener('click',exportBackup);
document.getElementById('importBtn')?.addEventListener('click',()=>document.getElementById('importFile')?.click());
document.getElementById('importFile')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    if(!data||typeof data.values!=='object') throw new Error('invalid');
    state={version:2,updatedAt:new Date().toISOString(),values:{...data.values}};
    if(persistState('Back-up teruggezet')){
      renderChapters();
      openWindows.forEach(win=>{
        if(windowHasUnsavedChanges(win)) return;
        // Reopen editors to reflect potentially changed field lists and headings.
        closeWindow(win,true);
      });
    }
  }catch(err){
    setStatus('Back-up is niet geldig','error');
  }
  event.target.value='';
});

// Recalculate active navigation from document order so dynamically added chapters
// (including the evidence register) and drag-reordered chapters are included.
let navigationFrame=0;
function updateActiveNavigation(){
  navigationFrame=0;
  const sections=[...document.querySelectorAll('main > section[id], main > .admin-notes-row > section[id], main > .admin-notes-row > .hero[id]')];
  if(!sections.length)return;
  const threshold=Math.max(105,window.innerHeight*.27);
  let active=sections[0];
  for(const section of sections){
    if(section.getBoundingClientRect().top<=threshold)active=section;
    else break;
  }
  // Near the bottom, select the final chapter even if it never crosses
  // the usual active-section threshold in the viewport.
  const atBottom=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-12;
  if(atBottom)active=sections.at(-1);
  const href='#'+active.id;
  document.querySelectorAll('.nav a[href^="#"]').forEach(link=>{
    const selected=link.getAttribute('href')===href;
    link.classList.toggle('active',selected);
    if(selected)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleActiveNavigation(){
  if(navigationFrame)return;
  navigationFrame=requestAnimationFrame(updateActiveNavigation);
}
window.addEventListener('scroll',scheduleActiveNavigation,{passive:true});
window.addEventListener('resize',scheduleActiveNavigation,{passive:true});
window.addEventListener('hashchange',scheduleActiveNavigation);
document.addEventListener('portfolio:structure-changed',scheduleActiveNavigation);
document.addEventListener('portfolio:files-loaded',scheduleActiveNavigation);
document.querySelector('.nav')?.addEventListener('click',()=>setTimeout(scheduleActiveNavigation,100));
scheduleActiveNavigation();

loadState();
renderChapters();
syncPageScrollLock();