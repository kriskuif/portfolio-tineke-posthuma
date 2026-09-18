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

const esc = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
  return win.topic.fields.some(([id])=>{
    const field=win.el.querySelector(`[data-modal-field="${id}"]`);
    return (field?.value||'') !== (state.values[id]||'');
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

function windowMarkup(group,topic,groupIndex,topicIndex,key){
  const fields=topic.fields.map(([id,label,help])=>`<div class="modal-field"><label for="modal-${key}-${esc(id)}">${esc(label)}<small>${esc(help)}</small></label><textarea id="modal-${key}-${esc(id)}" data-modal-field="${esc(id)}"></textarea></div>`).join('');
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
  el.querySelectorAll('[data-modal-field]').forEach(field=>{
    field.value=state.values[field.dataset.modalField]||'';
    field.addEventListener('input',()=>setWindowDirty(win,true));
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

  const win={key,el,groupIndex,topicIndex,group,topic,dirty:false,minimized:false,restorePosition:null,dragState:null,z:0};
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
  win.topic.fields.forEach(([id])=>{
    const field=win.el.querySelector(`[data-modal-field="${id}"]`);
    state.values[id]=field?.value||'';
  });
  if(!persistState(`${win.topic.title} opgeslagen`)) return;
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
        win.topic.fields.forEach(([id])=>{
          const field=win.el.querySelector(`[data-modal-field="${id}"]`);
          if(field) field.value=state.values[id]||'';
        });
      });
    }
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
syncPageScrollLock();