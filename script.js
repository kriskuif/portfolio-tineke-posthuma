const body = document.body;
const menuBtn = document.getElementById('menuBtn');
menuBtn?.addEventListener('click', () => {
  const open = body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

// Keep the hero photo straight to avoid rendering seams in some browsers.
const heroPhotoCard = document.querySelector('.hero-photo-card');
if (heroPhotoCard) heroPhotoCard.style.transform = 'none';

// ---------- Editable portfolio ----------
const STORAGE_KEY = 'portfolio-tineke-posthuma-v1';
const sectionsData = [
  {n:'01',title:'Mijn profiel als wandeltrainer',sub:'Introductie, motivatie en visie',fields:[
    ['s1_intro','Korte introductie','Wie ben je, welke ervaring heb je met wandelen en training geven, en in welke context geef je training?'],
    ['s1_motivatie','Motivatie','Waarom volg je Wandeltrainer 3? Wat wil je als trainer bereiken?'],
    ['s1_visie','Mijn visie','Wat vind jij belangrijk in een goede wandeltraining?']
  ]},
  {n:'02',title:'Persoonlijke leerdoelen',sub:'Startpunt, leerdoelen en succescriteria',fields:[
    ['s2_start','Startpunt','Welke vaardigheden beheers je al en waar wil je beter in worden?'],
    ['s2_leerdoelen','Leerdoelen','Formuleer 3–5 concrete leerdoelen.'],
    ['s2_succes','Succescriteria','Hoe weet je aan het einde dat je jouw leerdoelen hebt bereikt?']
  ]},
  {n:'03',title:'Beginsituatie en doelgroep',sub:'Groepsprofiel, startniveau en behoeften',fields:[
    ['s3_groep','Groepsprofiel','Beschrijf leeftijd, omvang, wandelervaring, niveau en motivatie.'],
    ['s3_begin','Beginsituatie','Wat kunnen de deelnemers nu? Waar liggen kansen en aandachtspunten?'],
    ['s3_behoeften','Behoeften','Wat willen de deelnemers bereiken en wat hebben zij van jou nodig?']
  ]},
  {n:'04',title:'Trainingsdoelen',sub:'Doelen voor de trainingsperiode',fields:[
    ['s4_doelen','Trainingsdoelen','Welke concrete doelen wil je met de groep bereiken?'],
    ['s4_onderbouwing','Onderbouwing en meetpunten','Waarom passen deze doelen bij de doelgroep en hoe volg je de voortgang?']
  ]},
  {n:'05',title:'Periodeplanning',sub:'Opbouw en samenhang van de trainingen',fields:[
    ['s5_planning','Periodeplanning','Beschrijf de opbouw van de periode, thema’s, belasting en progressie.']
  ]},
  {n:'06',title:'Trainingsvoorbereiding',sub:'Voorbereiding van afzonderlijke trainingen',fields:[
    ['s6_voorbereiding','Voorbereiding','Doel, warming-up, kern, afsluiting, materialen, organisatie en aandachtspunten.']
  ]},
  {n:'07',title:'Uitvoering en bewijs',sub:'Praktijkervaringen en bewijsstukken',fields:[
    ['s7_uitvoering','Uitvoering','Wat heb je uitgevoerd en hoe verliep de training in de praktijk?'],
    ['s7_bewijs','Bewijs','Noteer foto’s, documenten, observaties of andere bewijsstukken die hierbij horen.']
  ]},
  {n:'08',title:'Evaluatie en bijstelling',sub:'Wat werkte en wat pas je aan?',fields:[
    ['s8_evaluatie','Evaluatie','Wat ging goed en wat kon beter?'],
    ['s8_bijstelling','Bijstelling','Wat verander je in een volgende training of periode?']
  ]},
  {n:'09',title:'Feedback praktijkbegeleider',sub:'Ontvangen feedback en verwerking',fields:[
    ['s9_feedback','Feedback','Welke feedback heb je gekregen en wat heb je ermee gedaan?']
  ]},
  {n:'10',title:'Aansturen van assisterend kader',sub:'Samenwerken en delegeren',fields:[
    ['s10_kader','Aansturing','Hoe stuur je assistenten aan, verdeel je taken en bewaak je afspraken?']
  ]},
  {n:'11',title:'Veiligheid en risicoanalyse',sub:'Risico’s herkennen en beheersen',fields:[
    ['s11_veiligheid','Veiligheid en risicoanalyse','Welke risico’s zijn relevant en welke maatregelen neem je?']
  ]},
  {n:'12',title:'Communicatie en begeleiding',sub:'Uitleg, coaching en groepsdynamiek',fields:[
    ['s12_communicatie','Communicatie en begeleiding','Hoe geef je instructie, feedback en persoonlijke begeleiding?']
  ]},
  {n:'13',title:'Mijn ontwikkeling als trainer',sub:'Groei gedurende de opleiding',fields:[
    ['s13_ontwikkeling','Mijn ontwikkeling','Wat heb je geleerd en welke veranderingen zie je in je trainerhandelen?']
  ]},
  {n:'14',title:'Eindreflectie',sub:'Terugblik en volgende stap',fields:[
    ['s14_reflectie','Eindreflectie','Wat neem je mee uit de opleiding en hoe wil je je verder ontwikkelen?']
  ]},
  {n:'15',title:'Bewijsstukkenregister',sub:'Overzicht van bewijsstukken',fields:[
    ['s15_register','Bewijsstukkenregister','Noteer titel/bestand, datum, onderdeel en een korte toelichting.']
  ]},
  {n:'16',title:'Bijlagen',sub:'Verwijzingen en aanvullende stukken',fields:[
    ['s16_bijlagen','Bijlagen','Noteer hier welke bijlagen bij het portfolio horen.']
  ]}
];

function esc(s=''){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function buildEditor(){
  if (document.getElementById('invullen')) return;

  const style = document.createElement('style');
  style.textContent = `
    .top-actions{display:flex;align-items:center;gap:8px;margin-left:auto}.toplink{border:0;cursor:pointer;font-family:inherit;line-height:1.2}.toplink.secondary{background:#eef3ef;color:var(--forest);border:1px solid #dce7df}.screen-reader{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
    .editor-section{background:linear-gradient(180deg,#fff 0%,#fbfcfa 100%)}.editor-notice{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 17px;margin:-2px 0 18px;border-radius:15px;background:#f6f2e7;border:1px solid #ebe1cb}.editor-notice>div{display:flex;flex-direction:column;gap:3px}.editor-notice strong{color:#4b513f}.editor-notice span{font-size:.84rem;color:#716b58}.text-button{border:1px solid #d7d0bd;background:#fff;color:#4b5b50;border-radius:11px;padding:9px 12px;font:inherit;font-size:.8rem;font-weight:800;cursor:pointer;white-space:nowrap}
    .editor-list{display:grid;gap:10px}.edit-card{border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden;transition:.18s ease}.edit-card[open]{border-color:#bdd0c5;box-shadow:0 8px 24px rgba(35,55,47,.055)}.edit-card summary{list-style:none;display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:12px;padding:14px 15px;cursor:pointer;user-select:none}.edit-card summary::-webkit-details-marker{display:none}.edit-card summary:hover{background:#fafcf9}.edit-num{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#e6efe9;color:var(--forest);font-weight:950;font-size:.8rem}.edit-card summary strong{display:block;font-size:.92rem;color:#26372f}.edit-card summary small{display:block;margin-top:2px;color:var(--muted);font-size:.76rem;font-weight:500}.edit-state{font-size:.72rem;font-weight:850;color:#847d69;background:#f5f1e8;border-radius:999px;padding:5px 9px;white-space:nowrap}.edit-card.has-content .edit-state{background:#e8f2eb;color:#286047}
    .edit-body{border-top:1px solid #edf0ed;padding:16px;display:grid;gap:14px;background:#fcfdfb}.edit-body label{display:grid;gap:6px;font-weight:850;color:#30433a;font-size:.86rem}.edit-body label small{font-weight:500;color:var(--muted);font-size:.78rem;line-height:1.45}.edit-body textarea{width:100%;min-height:138px;resize:vertical;border:1px solid #cfdad3;border-radius:13px;padding:12px 13px;background:#fff;color:var(--ink);font:inherit;font-size:.92rem;line-height:1.55;outline:none;transition:border-color .16s,box-shadow .16s}.edit-body textarea:focus{border-color:#6e9b83;box-shadow:0 0 0 3px rgba(69,124,94,.10)}.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .editor-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:18px;padding:16px 17px;border-radius:16px;background:#eef4f0;border:1px solid #dbe7df}.editor-footer>div{display:flex;flex-direction:column;gap:2px}.editor-footer strong{color:#294f40}.editor-footer span{font-size:.8rem;color:var(--muted)}.save-large{border:0;border-radius:12px;background:var(--forest);color:#fff;padding:11px 16px;font:inherit;font-weight:850;cursor:pointer;white-space:nowrap}.status.saved .status-dot{background:#4f9a68}.status.saving .status-dot{background:#d3a849}.status.error .status-dot{background:#b95050}
    @media(max-width:980px){.top-actions .secondary{display:none}}@media(max-width:700px){.top-actions{gap:6px}.toplink{padding:8px 10px}.editor-notice,.editor-footer{align-items:flex-start;flex-direction:column}.field-grid{grid-template-columns:1fr}.edit-card summary{grid-template-columns:40px minmax(0,1fr)}.edit-state{grid-column:2;justify-self:start}.edit-body{padding:13px}.edit-body textarea{min-height:150px}}@media print{.editor-section{display:none!important}}
  `;
  document.head.appendChild(style);

  const nav = document.querySelector('.nav');
  const vervolgLink = nav?.querySelector('a[href="#vervolg"]');
  vervolgLink?.insertAdjacentHTML('beforebegin','<a href="#invullen"><span class="n">✎</span><span>Portfolio invullen</span></a>');

  const topbar = document.querySelector('.topbar');
  const statusText = topbar?.querySelector('.status span:last-child');
  if(statusText){statusText.id='saveStatus';statusText.textContent='Concept · nog niet gewijzigd';}
  topbar?.querySelector('.toplink')?.remove();
  topbar?.insertAdjacentHTML('beforeend','<div class="top-actions"><a class="toplink secondary" href="#invullen">Invullen</a><button class="toplink secondary" id="exportBtn" type="button">Back-up</button><button class="toplink" id="saveBtn" type="button">Opslaan</button></div><input class="screen-reader" id="importFile" type="file" accept="application/json">');

  const cards = sectionsData.map((section,i)=>{
    const fields = section.fields.map((f,j)=>`<label>${esc(f[1])}<small>${esc(f[2])}</small><textarea id="${esc(f[0])}" data-save ${i===0&&j===0?'placeholder="Schrijf hier je introductie..."':''}></textarea></label>`).join('');
    return `<details class="edit-card" data-section="${section.n}" ${i===0?'open':''}><summary><span class="edit-num">${section.n}</span><span><strong>${esc(section.title)}</strong><small>${esc(section.sub)}</small></span><span class="edit-state">Nog leeg</span></summary><div class="edit-body ${section.fields.length>1?'field-grid':''}">${fields}</div></details>`;
  }).join('');

  const editor = `<section class="section editor-section" id="invullen"><div class="section-header"><div class="section-num">✎</div><div><h3>Portfolio invullen</h3><p class="subtitle">Vul de onderdelen rustig aan. De invoer wordt automatisch in deze browser opgeslagen.</p></div></div><div class="editor-notice"><div><strong>Conceptopslag</strong><span>Je tekst blijft op dit apparaat en in deze browser bewaard. Gebruik <b>Back-up</b> om een bestand te bewaren of op een andere computer verder te gaan.</span></div><button class="text-button" id="importBtn" type="button">Back-up terugzetten</button></div><div class="editor-list">${cards}</div><div class="editor-footer"><div><strong id="progressText">0 van 16 onderdelen ingevuld</strong><span>Alles wordt automatisch opgeslagen terwijl je typt.</span></div><button class="save-large" id="saveBottomBtn" type="button">Nu opslaan</button></div></section>`;
  document.getElementById('vervolg')?.insertAdjacentHTML('beforebegin',editor);
}

buildEditor();

const links = [...document.querySelectorAll('.nav a')];
links.forEach(link => link.addEventListener('click', () => {
  body.classList.remove('menu-open');
  menuBtn?.setAttribute('aria-expanded','false');
}));

const sections = [...document.querySelectorAll('main section[id]')];
const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
  if (!visible) return;
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${visible.target.id}`));
}, {rootMargin:'-15% 0px -65% 0px', threshold:[0,.1,.4]});
sections.forEach(s => observer.observe(s));

const fields = [...document.querySelectorAll('[data-save]')];
const saveStatus = document.getElementById('saveStatus');
const statusWrap = saveStatus?.closest('.status');
let saveTimer;

function getState(){
  const values={}; fields.forEach(f=>values[f.id]=f.value);
  return {version:1,updatedAt:new Date().toISOString(),values};
}
function setStatus(text,state=''){
  if(saveStatus) saveStatus.textContent=text;
  if(statusWrap){statusWrap.classList.remove('saved','saving','error');if(state)statusWrap.classList.add(state);}
}
function updateCompletion(){
  const cards=[...document.querySelectorAll('.edit-card')]; let done=0;
  cards.forEach(card=>{
    const has=[...card.querySelectorAll('[data-save]')].some(f=>f.value.trim());
    card.classList.toggle('has-content',has);
    const state=card.querySelector('.edit-state'); if(state)state.textContent=has?'Ingevuld':'Nog leeg';
    if(has)done++;
  });
  const progress=document.getElementById('progressText'); if(progress)progress.textContent=`${done} van ${cards.length} onderdelen ingevuld`;
}
function saveNow(show=true){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(getState())); updateCompletion();
    if(show){const t=new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});setStatus(`Opgeslagen om ${t}`,'saved');}
    return true;
  }catch(e){console.error(e);setStatus('Opslaan mislukt','error');return false;}
}
function scheduleSave(){setStatus('Wijzigingen opslaan…','saving');clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveNow(true),550);}
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY); if(!raw){updateCompletion();return;}
    const state=JSON.parse(raw), values=state?.values||{};
    fields.forEach(f=>{if(Object.prototype.hasOwnProperty.call(values,f.id))f.value=values[f.id]??'';});
    updateCompletion();
    if(state.updatedAt){const d=new Date(state.updatedAt);const stamp=Number.isNaN(d.getTime())?'':d.toLocaleString('nl-NL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});setStatus(stamp?`Concept geladen · ${stamp}`:'Concept geladen','saved');}
  }catch(e){console.error(e);setStatus('Concept kon niet worden geladen','error');}
}
fields.forEach(f=>f.addEventListener('input',()=>{updateCompletion();scheduleSave();}));
[document.getElementById('saveBtn'),document.getElementById('saveBottomBtn')].filter(Boolean).forEach(b=>b.addEventListener('click',()=>saveNow(true)));

document.getElementById('exportBtn')?.addEventListener('click',()=>{
  saveNow(false); const blob=new Blob([JSON.stringify(getState(),null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url;a.download=`portfolio-tineke-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);setStatus('Back-up gedownload','saved');
});
const importBtn=document.getElementById('importBtn'), importFile=document.getElementById('importFile');
importBtn?.addEventListener('click',()=>importFile?.click());
importFile?.addEventListener('change',async()=>{
  const file=importFile.files?.[0]; if(!file)return;
  try{
    const parsed=JSON.parse(await file.text()); if(!parsed||typeof parsed.values!=='object')throw new Error('Ongeldige back-up');
    fields.forEach(f=>{if(Object.prototype.hasOwnProperty.call(parsed.values,f.id))f.value=parsed.values[f.id]??'';}); saveNow(false);updateCompletion();setStatus('Back-up teruggezet','saved');
  }catch(e){console.error(e);setStatus('Back-up kon niet worden ingelezen','error');alert('Dit bestand lijkt geen geldige portfolio-back-up te zijn.');}
  finally{importFile.value='';}
});
window.addEventListener('beforeunload',()=>{if(saveTimer){clearTimeout(saveTimer);saveNow(false);}});
loadState();
