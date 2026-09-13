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

menuBtn?.addEventListener('click',()=>{
  const open=body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded',String(open));
});

function buildEditor(){
  const list=document.getElementById('editorList');
  if(!list) return;
  list.innerHTML=groups.map((group,index)=>{
    const topics=group.topics.map(topic=>{
      const fields=topic.fields.map(f=>`<label>${esc(f[1])}<small>${esc(f[2])}</small><textarea id="${esc(f[0])}" data-save></textarea></label>`).join('');
      return `<div class="topic-block"><div class="topic-heading">${esc(topic.title)}</div><div class="field-grid">${fields}</div></div>`;
    }).join('');
    return `<details class="edit-card" data-group="${index+1}" ${index===0?'open':''}><summary><span class="edit-num">${group.n}</span><span><strong>${esc(group.title)}</strong><small>${esc(group.sub)}</small></span><span class="edit-state">Nog leeg</span></summary><div class="edit-body">${topics}</div></details>`;
  }).join('');
}

buildEditor();

const fields=[...document.querySelectorAll('[data-save]')];
const saveStatus=document.getElementById('saveStatus');
const statusWrap=saveStatus?.closest('.status');
let saveTimer;

function getState(){
  const values={};
  fields.forEach(field=>values[field.id]=field.value);
  return {version:1,updatedAt:new Date().toISOString(),values};
}

function setStatus(text,state=''){
  if(saveStatus) saveStatus.textContent=text;
  if(statusWrap){
    statusWrap.classList.remove('saved','saving','error');
    if(state) statusWrap.classList.add(state);
  }
}

function saveNow(showMessage=true){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(getState()));
    setStatus(showMessage?'Opgeslagen in deze browser':'Concept opgeslagen','saved');
  }catch(err){
    setStatus('Opslaan mislukt','error');
  }
  updateUI();
}

function loadSaved(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const data=JSON.parse(raw);
    Object.entries(data.values||{}).forEach(([id,value])=>{
      const field=document.getElementById(id);
      if(field) field.value=value ?? '';
    });
    if(data.updatedAt){
      const date=new Date(data.updatedAt);
      if(!Number.isNaN(date.getTime())) setStatus(`Concept opgeslagen · ${date.toLocaleDateString('nl-NL')}`,'saved');
    }
  }catch(err){
    setStatus('Opgeslagen concept kon niet worden geladen','error');
  }
}

function groupValues(group){
  return group.topics.flatMap(topic=>topic.fields.map(f=>({id:f[0],label:f[1],topic:topic.title,value:(document.getElementById(f[0])?.value||'').trim()})));
}

function updatePreviews(){
  groups.forEach((group,index)=>{
    const target=document.getElementById(`preview-${index+1}`);
    if(!target) return;
    const filled=groupValues(group).filter(item=>item.value);
    if(!filled.length){
      target.innerHTML='<div class="preview-empty">Nog niet ingevuld. Gebruik “Dit hoofdstuk invullen” om hier inhoud toe te voegen.</div>';
      return;
    }
    target.innerHTML=filled.map(item=>`<article class="preview-item"><h4>${esc(item.label)}</h4><p>${esc(item.value)}</p></article>`).join('');
  });
}

function updateCompletion(){
  let started=0;
  document.querySelectorAll('.edit-card').forEach((card,index)=>{
    const values=groupValues(groups[index]);
    const has=values.some(item=>item.value);
    card.classList.toggle('has-content',has);
    const state=card.querySelector('.edit-state');
    if(state) state.textContent=has?'Gestart':'Nog leeg';
    if(has) started++;
  });
  const progress=document.getElementById('progressText');
  if(progress) progress.textContent=`${started} van 6 hoofdstukken gestart`;
}

function updateUI(){
  updateCompletion();
  updatePreviews();
}

loadSaved();
updateUI();

fields.forEach(field=>field.addEventListener('input',()=>{
  setStatus('Bezig met opslaan…','saving');
  updateUI();
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>saveNow(false),450);
}));

document.getElementById('saveBtn')?.addEventListener('click',()=>saveNow(true));
document.getElementById('saveBottomBtn')?.addEventListener('click',()=>saveNow(true));

function exportBackup(){
  const data=JSON.stringify(getState(),null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const stamp=new Date().toISOString().slice(0,10);
  a.href=url;a.download=`portfolio-tineke-backup-${stamp}.json`;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
document.getElementById('exportBtn')?.addEventListener('click',exportBackup);

document.getElementById('importBtn')?.addEventListener('click',()=>document.getElementById('importFile')?.click());
document.getElementById('importFile')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    Object.entries(data.values||{}).forEach(([id,value])=>{
      const field=document.getElementById(id);
      if(field) field.value=value ?? '';
    });
    saveNow(true);
  }catch(err){
    setStatus('Back-up is niet geldig','error');
  }
  event.target.value='';
});

document.querySelectorAll('[data-open-group]').forEach(link=>link.addEventListener('click',()=>{
  const num=link.getAttribute('data-open-group');
  const card=document.querySelector(`.edit-card[data-group="${num}"]`);
  if(card) card.open=true;
}));

const navLinks=[...document.querySelectorAll('.nav a')];
navLinks.forEach(link=>link.addEventListener('click',()=>{
  body.classList.remove('menu-open');
  menuBtn?.setAttribute('aria-expanded','false');
}));

const observed=[...document.querySelectorAll('#start, .portfolio-group, #invullen')];
const observer=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(!visible) return;
  const href=`#${visible.target.id}`;
  navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===href));
},{rootMargin:'-15% 0px -65% 0px',threshold:[0,.1,.35]});
observed.forEach(section=>observer.observe(section));
