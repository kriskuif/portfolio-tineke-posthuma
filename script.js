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
      ['s3_begin','Beginsituatie','Wat kunnen de deelnemers nu? Waar liggen kansen en aandachtspunten?'],
      ['s3_behoeften','Behoeften','Wat willen de deelnemers bereiken en wat hebben zij van jou nodig?']
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
  {n:'05',title:'Evaluatie & feedback',sub:'Terugkijken, feedback verwerken en bijstellen.',topics:[
    {title:'Evaluatie en bijstelling',fields:[
      ['s8_evaluatie','Evaluatie','Wat ging goed en wat kon beter?'],
      ['s8_bijstelling','Bijstelling','Wat verander je in een volgende training of periode?']
    ]},
    {title:'Feedback praktijkbegeleider',fields:[['s9_feedback','Feedback','Welke feedback heb je gekregen en wat heb je ermee gedaan?']]},
    {title:'Aansturen van assisterend kader',fields:[['s10_kader','Aansturing','Hoe stuur je assistenten aan, verdeel je taken en bewaak je afspraken?']]}
  ]},
  {n:'06',title:'Ontwikkeling & reflectie',sub:'Wat heb ik geleerd en wat neem ik mee?',topics:[
    {title:'Mijn ontwikkeling als trainer',fields:[['s13_ontwikkeling','Mijn ontwikkeling','Wat heb je geleerd en welke veranderingen zie je in je trainerhandelen?']]},
    {title:'Eindreflectie',fields:[['s14_reflectie','Eindreflectie','Wat neem je mee uit de opleiding en hoe wil je je verder ontwikkelen?']]},
    {title:'Bewijsstukkenregister',fields:[['s15_register','Bewijsstukkenregister','Noteer titel/bestand, datum, onderdeel en een korte toelichting.']]},
    {title:'Bijlagen',fields:[['s16_bijlagen','Bijlagen','Noteer hier welke bijlagen bij het portfolio horen.']]}
  ]}
];

const esc = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

let state = {version:2, updatedAt:null, values:{}};
let activeGroupIndex = null;
let activeTopicIndex = null;
let modalDirty = false;
let dragState = null;
let restorePosition = null;

const saveStatus = document.getElementById('saveStatus');
const statusWrap = saveStatus?.closest('.status');
const windowLayer = document.getElementById('windowLayer');
const editorWindow = document.getElementById('editorWindow');
const windowDragHandle = document.getElementById('windowDragHandle');
const windowTitle = document.getElementById('windowTitle');
const windowKicker = document.getElementById('windowKicker');
const windowHelp = document.getElementById('windowHelp');
const modalFields = document.getElementById('modalFields');
const windowSaveHint = document.getElementById('windowSaveHint');
const minimizeBtn = document.getElementById('minimizeBtn');

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
  return topic.fields.map(([id,label])=>({id,label,value:String(state.values[id]||'').trim()}));
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
      return `<article class="topic-card ${filled?'filled':''}" data-topic-card="${groupIndex}-${topicIndex}">
        <div class="topic-card-head">
          <div class="topic-card-title"><span class="topic-index">Onderdeel ${number}</span><h4>${esc(topic.title)}</h4></div>
          <span class="topic-state">${filled?'Ingevuld':'Nog leeg'}</span>
        </div>
        <div class="topic-content">${content}</div>
        <button class="topic-edit-btn" type="button" data-edit-topic="${groupIndex}-${topicIndex}">${filled?'Aanpassen':'Invullen'}</button>
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

function centerWindow(){
  if(!editorWindow) return;
  editorWindow.style.right='auto';
  editorWindow.style.bottom='auto';
  editorWindow.style.left='16px';
  editorWindow.style.top='90px';
  requestAnimationFrame(()=>{
    const rect=editorWindow.getBoundingClientRect();
    const left=Math.max(12,(window.innerWidth-rect.width)/2);
    const top=Math.max(72,(window.innerHeight-rect.height)/2);
    editorWindow.style.left=`${left}px`;
    editorWindow.style.top=`${top}px`;
  });
}

function markModalDirty(){
  modalDirty=true;
  if(windowSaveHint){
    windowSaveHint.textContent='Wijzigingen zijn nog niet opgeslagen.';
    windowSaveHint.classList.remove('saved');
  }
}

function openEditor(groupIndex,topicIndex){
  const group=groups[groupIndex];
  const topic=group?.topics[topicIndex];
  if(!group||!topic) return;

  activeGroupIndex=groupIndex;
  activeTopicIndex=topicIndex;
  modalDirty=false;
  restorePosition=null;

  windowKicker.textContent=`Hoofdstuk ${group.n} · onderdeel ${topicIndex+1}`;
  windowTitle.textContent=topic.title;
  windowHelp.textContent=`Werk alleen dit onderdeel uit. Klik op Opslaan om de tekst direct onder “${topic.title}” in het portfolio te tonen.`;
  modalFields.innerHTML=topic.fields.map(([id,label,help])=>`<div class="modal-field"><label for="modal-${esc(id)}">${esc(label)}<small>${esc(help)}</small></label><textarea id="modal-${esc(id)}" data-modal-field="${esc(id)}"></textarea></div>`).join('');

  modalFields.querySelectorAll('[data-modal-field]').forEach(field=>{
    field.value=state.values[field.dataset.modalField]||'';
    field.addEventListener('input',markModalDirty);
  });

  windowSaveHint.textContent=isTopicFilled(topic)?'Bestaande tekst geladen.':'Dit onderdeel is nog leeg.';
  windowSaveHint.classList.toggle('saved',isTopicFilled(topic));
  editorWindow.classList.remove('minimized');
  minimizeBtn.textContent='−';
  minimizeBtn.setAttribute('aria-label','Minimaliseren');
  minimizeBtn.title='Minimaliseren';
  windowLayer.hidden=false;
  centerWindow();
  setTimeout(()=>modalFields.querySelector('textarea')?.focus(),80);
}

function hasUnsavedModalChanges(){
  if(!modalDirty||activeGroupIndex===null||activeTopicIndex===null) return false;
  const topic=groups[activeGroupIndex].topics[activeTopicIndex];
  return topic.fields.some(([id])=>{
    const field=modalFields.querySelector(`[data-modal-field="${id}"]`);
    return (field?.value||'') !== (state.values[id]||'');
  });
}

function closeEditor(force=false){
  if(!force && hasUnsavedModalChanges()){
    const ok=window.confirm('Je hebt wijzigingen die nog niet zijn opgeslagen. Toch sluiten?');
    if(!ok) return;
  }
  windowLayer.hidden=true;
  editorWindow.classList.remove('minimized');
  activeGroupIndex=null;
  activeTopicIndex=null;
  modalDirty=false;
  dragState=null;
  restorePosition=null;
}

function saveActiveTopic(){
  if(activeGroupIndex===null||activeTopicIndex===null) return;
  const topic=groups[activeGroupIndex].topics[activeTopicIndex];
  topic.fields.forEach(([id])=>{
    const field=modalFields.querySelector(`[data-modal-field="${id}"]`);
    state.values[id]=field?.value||'';
  });
  if(!persistState(`${topic.title} opgeslagen`)) return;
  const savedGroupIndex=activeGroupIndex;
  const savedTopicIndex=activeTopicIndex;
  modalDirty=false;
  renderChapters();
  closeEditor(true);
  document.querySelector(`[data-topic-card="${savedGroupIndex}-${savedTopicIndex}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
}

function toggleMinimize(){
  if(windowLayer.hidden) return;
  const minimized=editorWindow.classList.toggle('minimized');
  if(minimized){
    const rect=editorWindow.getBoundingClientRect();
    restorePosition={left:rect.left,top:rect.top};
    editorWindow.style.left='auto';
    editorWindow.style.top='auto';
    editorWindow.style.right='18px';
    editorWindow.style.bottom='18px';
    minimizeBtn.textContent='□';
    minimizeBtn.setAttribute('aria-label','Herstellen');
    minimizeBtn.title='Herstellen';
  }else{
    editorWindow.style.right='auto';
    editorWindow.style.bottom='auto';
    editorWindow.style.left=`${Math.max(8,restorePosition?.left??20)}px`;
    editorWindow.style.top=`${Math.max(60,restorePosition?.top??90)}px`;
    minimizeBtn.textContent='−';
    minimizeBtn.setAttribute('aria-label','Minimaliseren');
    minimizeBtn.title='Minimaliseren';
  }
}

function clampWindowPosition(left,top){
  const rect=editorWindow.getBoundingClientRect();
  const maxLeft=Math.max(8,window.innerWidth-Math.min(rect.width,window.innerWidth-16)-8);
  const maxTop=Math.max(58,window.innerHeight-Math.min(rect.height,window.innerHeight-16)-8);
  return {
    left:Math.min(Math.max(8,left),maxLeft),
    top:Math.min(Math.max(58,top),maxTop)
  };
}

windowDragHandle?.addEventListener('pointerdown',event=>{
  if(event.target.closest('button')) return;
  const rect=editorWindow.getBoundingClientRect();
  dragState={pointerId:event.pointerId,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top};
  windowDragHandle.setPointerCapture(event.pointerId);
  body.classList.add('window-dragging');
  editorWindow.style.right='auto';
  editorWindow.style.bottom='auto';
});

windowDragHandle?.addEventListener('pointermove',event=>{
  if(!dragState||dragState.pointerId!==event.pointerId) return;
  const next=clampWindowPosition(event.clientX-dragState.offsetX,event.clientY-dragState.offsetY);
  editorWindow.style.left=`${next.left}px`;
  editorWindow.style.top=`${next.top}px`;
});

function stopDragging(event){
  if(!dragState) return;
  if(event && dragState.pointerId!==event.pointerId) return;
  try{windowDragHandle.releasePointerCapture(dragState.pointerId);}catch(_err){}
  dragState=null;
  body.classList.remove('window-dragging');
}
windowDragHandle?.addEventListener('pointerup',stopDragging);
windowDragHandle?.addEventListener('pointercancel',stopDragging);

window.addEventListener('resize',()=>{
  if(windowLayer.hidden||editorWindow.classList.contains('minimized')) return;
  const rect=editorWindow.getBoundingClientRect();
  const next=clampWindowPosition(rect.left,rect.top);
  editorWindow.style.left=`${next.left}px`;
  editorWindow.style.top=`${next.top}px`;
});

document.getElementById('closeBtn')?.addEventListener('click',()=>closeEditor(false));
document.getElementById('cancelBtn')?.addEventListener('click',()=>closeEditor(false));
document.getElementById('topicSaveBtn')?.addEventListener('click',saveActiveTopic);
minimizeBtn?.addEventListener('click',toggleMinimize);

document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!windowLayer.hidden) closeEditor(false);
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&!windowLayer.hidden){
    event.preventDefault();
    saveActiveTopic();
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
    if(persistState('Back-up teruggezet')) renderChapters();
  }catch(err){
    setStatus('Back-up is niet geldig','error');
  }
  event.target.value='';
});

const navLinks=[...document.querySelectorAll('.nav a')];
const observed=[...document.querySelectorAll('main section[id]')];
const observer=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(!visible) return;
  const href=`#${visible.target.id}`;
  navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===href));
},{rootMargin:'-15% 0px -65% 0px',threshold:[0,.1,.35]});
observed.forEach(section=>observer.observe(section));

loadState();
renderChapters();
