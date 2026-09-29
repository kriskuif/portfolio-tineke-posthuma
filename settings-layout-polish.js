(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY)||null;
  const layouts=new Map();
  let layoutsLoaded=false;

  const style=document.createElement('style');
  style.id='settings-layout-polish';
  style.textContent=`
    .settings-window{width:min(980px,calc(100vw - 28px))}
    .settings-card:has([data-current-password]){grid-column:1/-1}
    .settings-card:has([data-current-password]) .settings-form{
      display:grid;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr);
      grid-template-rows:auto auto;
      column-gap:18px;
      row-gap:10px;
      align-items:start;
    }
    .settings-card:has([data-current-password]) .settings-form>label:nth-child(1){grid-column:1;grid-row:1 / span 2}
    .settings-card:has([data-current-password]) .settings-form>label:nth-child(2){grid-column:2;grid-row:1}
    .settings-card:has([data-current-password]) .settings-form>label:nth-child(3){grid-column:2;grid-row:2}
    .settings-card:has([data-current-password]) .settings-actions{justify-content:flex-end;margin-top:14px!important}
    .settings-card:has([data-current-password]) .settings-message{text-align:right}

    .topic-list>.topic-card.layout-full{grid-column:1/-1!important}
    .topic-list>.topic-card.layout-half{grid-column:auto!important}
    .topic-card-head-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto}
    .topic-layout-wrap{position:relative;display:flex;align-items:center}
    .topic-layout-button{
      display:inline-flex;align-items:center;gap:5px;height:27px;border:1px solid #d9e3dd;border-radius:9px;
      background:#fff;color:#607068;padding:0 8px;font:inherit;font-size:.68rem;font-weight:800;cursor:pointer;
      transition:.15s ease;white-space:nowrap
    }
    .topic-layout-button:hover,.topic-layout-button:focus-visible{background:#eef4f0;border-color:#b8cbbf;color:#1f5e4a;outline:none}
    .topic-layout-icon{width:13px;height:11px;display:grid;grid-template-columns:1fr 1fr;gap:2px;align-items:stretch}
    .topic-layout-icon::before,.topic-layout-icon::after{content:'';border:1.4px solid currentColor;border-radius:2px}
    .topic-layout-button[data-effective='full'] .topic-layout-icon{display:block;border:1.4px solid currentColor;border-radius:2px;height:10px}
    .topic-layout-button[data-effective='full'] .topic-layout-icon::before,.topic-layout-button[data-effective='full'] .topic-layout-icon::after{display:none}
    body:not(.can-edit) .topic-layout-wrap{display:none!important}
    .topic-layout-popover{
      position:absolute;right:0;top:calc(100% + 7px);z-index:120;min-width:220px;padding:6px;background:#fff;
      border:1px solid #dce5df;border-radius:12px;box-shadow:0 16px 40px rgba(24,45,36,.18)
    }
    .topic-layout-popover[hidden]{display:none!important}
    .topic-layout-choice{width:100%;display:grid;grid-template-columns:22px 1fr 18px;gap:8px;align-items:center;border:0;border-radius:9px;background:transparent;color:#33453d;padding:8px 9px;text-align:left;font:inherit;cursor:pointer}
    .topic-layout-choice:hover,.topic-layout-choice:focus-visible{background:#f0f5f1;outline:none}
    .topic-layout-choice strong{display:block;font-size:.76rem;line-height:1.2}
    .topic-layout-choice small{display:block;margin-top:2px;color:#75837c;font-size:.66rem;line-height:1.25}
    .topic-layout-choice-mark{font-size:.78rem;color:#1f5e4a;font-weight:900;text-align:center}
    .topic-layout-choice-icon{width:20px;height:15px;display:grid;place-items:center;color:#587166}
    .topic-layout-choice-icon.half{grid-template-columns:1fr 1fr;gap:2px}
    .topic-layout-choice-icon.half::before,.topic-layout-choice-icon.half::after{content:'';height:11px;border:1.4px solid currentColor;border-radius:2px}
    .topic-layout-choice-icon.full::before{content:'';width:18px;height:11px;border:1.4px solid currentColor;border-radius:2px}
    .topic-layout-choice-icon.auto::before{content:'A';font-size:.7rem;font-weight:900}
    .topic-layout-saving{opacity:.55;pointer-events:none}

    @media(max-width:760px){
      .settings-window{width:min(900px,calc(100vw - 20px))}
      .settings-card:has([data-current-password]){grid-column:auto}
      .settings-card:has([data-current-password]) .settings-form{grid-template-columns:1fr;grid-template-rows:auto;gap:9px}
      .settings-card:has([data-current-password]) .settings-form>label:nth-child(1),
      .settings-card:has([data-current-password]) .settings-form>label:nth-child(2),
      .settings-card:has([data-current-password]) .settings-form>label:nth-child(3){grid-column:1;grid-row:auto}
      .settings-card:has([data-current-password]) .settings-actions{justify-content:flex-start}
      .settings-card:has([data-current-password]) .settings-message{text-align:left}
      .topic-layout-button span:last-child{display:none}
      .topic-layout-button{width:28px;padding:0;justify-content:center}
      .topic-layout-popover{right:-4px;min-width:210px}
    }
  `;
  document.head.appendChild(style);

  function layoutId(card){
    const raw=String(card?.dataset?.topicCard||'');
    const match=raw.match(/^(\d+)-(\d+)$/);
    if(!match) return '';
    const groupIndex=Number(match[1]);
    const topicIndex=Number(match[2]);
    const chapter=(typeof groups!=='undefined'&&groups[groupIndex]?.n)||String(groupIndex+1).padStart(2,'0');
    return `topic_layout_${chapter}_${String(topicIndex+1).padStart(2,'0')}`;
  }

  function cardsInList(list){
    return [...list.children].filter(el=>el instanceof Element&&el.matches('.topic-card[data-topic-card]'));
  }

  function applyListLayout(list){
    const cards=cardsInList(list);
    if(!cards.length) return;

    cards.forEach(card=>card.classList.remove('layout-full','layout-half'));
    let pending=null;

    cards.forEach(card=>{
      const id=layoutId(card);
      const choice=layouts.get(id)||'auto';
      card.dataset.layoutChoice=choice;

      if(choice==='full'){
        if(pending?.choice==='auto'){
          pending.card.classList.remove('layout-half');
          pending.card.classList.add('layout-full');
        }
        pending=null;
        card.classList.add('layout-full');
        return;
      }

      card.classList.add('layout-half');
      if(pending){
        pending=null;
      }else{
        pending={card,choice};
      }
    });

    if(pending?.choice==='auto'){
      pending.card.classList.remove('layout-half');
      pending.card.classList.add('layout-full');
    }

    cards.forEach(card=>{
      const button=card.querySelector('[data-topic-layout-button]');
      if(!button) return;
      const effective=card.classList.contains('layout-full')?'full':'half';
      button.dataset.effective=effective;
      const choice=card.dataset.layoutChoice||'auto';
      button.title=choice==='full'?'Indeling: breed':choice==='half'?'Indeling: naast elkaar':'Indeling: automatisch';
      button.setAttribute('aria-label',button.title+'. Klik om aan te passen.');
      card.querySelectorAll('[data-layout-choice]').forEach(option=>{
        const mark=option.querySelector('.topic-layout-choice-mark');
        if(mark) mark.textContent=option.dataset.layoutChoice===choice?'✓':'';
      });
    });
  }

  function applyAllLayouts(){
    document.querySelectorAll('.topic-list').forEach(applyListLayout);
  }

  function closePopovers(except=null){
    document.querySelectorAll('.topic-layout-popover').forEach(pop=>{
      if(pop!==except) pop.hidden=true;
    });
  }

  async function saveLayout(card,choice,wrap){
    const id=layoutId(card);
    if(!id||!client) return;
    wrap.classList.add('topic-layout-saving');
    try{
      const {data:sessionData}=await client.auth.getSession();
      if(!sessionData?.session) throw new Error('Je bent niet meer ingelogd.');
      const {error}=await client.from('portfolio_content').upsert([{id,value:choice}],{onConflict:'id'});
      if(error) throw error;
      layouts.set(id,choice);
      applyListLayout(card.closest('.topic-list'));
      if(typeof setStatus==='function') setStatus('Indeling opgeslagen op website','saved');
    }catch(err){
      console.error('Indeling opslaan mislukt:',err);
      if(typeof setStatus==='function') setStatus('Indeling opslaan mislukt','error');
      alert('Indeling opslaan mislukt: '+String(err?.message||err));
    }finally{
      wrap.classList.remove('topic-layout-saving');
    }
  }

  function decorateCard(card){
    if(!(card instanceof Element)||card.dataset.layoutControlReady==='1'||!layoutId(card)) return;
    const head=card.querySelector(':scope > .topic-card-head');
    const state=head?.querySelector(':scope > .topic-state');
    if(!head||!state) return;

    card.dataset.layoutControlReady='1';
    const actions=document.createElement('div');
    actions.className='topic-card-head-actions';
    state.before(actions);
    actions.appendChild(state);

    const wrap=document.createElement('div');
    wrap.className='topic-layout-wrap';
    wrap.innerHTML=`
      <button type="button" class="topic-layout-button" data-topic-layout-button>
        <span class="topic-layout-icon" aria-hidden="true"></span><span>Indeling</span>
      </button>
      <div class="topic-layout-popover" data-topic-layout-popover hidden>
        <button type="button" class="topic-layout-choice" data-layout-choice="auto">
          <span class="topic-layout-choice-icon auto" aria-hidden="true"></span>
          <span><strong>Automatisch</strong><small>Vult een losse laatste plek vanzelf.</small></span>
          <span class="topic-layout-choice-mark"></span>
        </button>
        <button type="button" class="topic-layout-choice" data-layout-choice="half">
          <span class="topic-layout-choice-icon half" aria-hidden="true"></span>
          <span><strong>Naast elkaar</strong><small>Half breed; koppelt met het volgende halve vlak.</small></span>
          <span class="topic-layout-choice-mark"></span>
        </button>
        <button type="button" class="topic-layout-choice" data-layout-choice="full">
          <span class="topic-layout-choice-icon full" aria-hidden="true"></span>
          <span><strong>Breed</strong><small>Gebruikt de volledige rij.</small></span>
          <span class="topic-layout-choice-mark"></span>
        </button>
      </div>`;
    actions.appendChild(wrap);

    const button=wrap.querySelector('[data-topic-layout-button]');
    const popover=wrap.querySelector('[data-topic-layout-popover]');
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const willOpen=popover.hidden;
      closePopovers(popover);
      popover.hidden=!willOpen;
    });
    popover.addEventListener('click',event=>event.stopPropagation());
    popover.querySelectorAll('[data-layout-choice]').forEach(option=>{
      option.addEventListener('click',async()=>{
        popover.hidden=true;
        await saveLayout(card,option.dataset.layoutChoice,wrap);
      });
    });
  }

  function decorateAll(){
    document.querySelectorAll('.topic-card[data-topic-card]').forEach(decorateCard);
    applyAllLayouts();
  }

  async function loadLayouts(){
    if(!client){layoutsLoaded=true;decorateAll();return;}
    try{
      const {data,error}=await client.from('portfolio_content').select('id,value').like('id','topic_layout_%');
      if(error) throw error;
      (data||[]).forEach(row=>{
        const value=String(row.value||'').trim();
        if(['auto','half','full'].includes(value)) layouts.set(row.id,value);
      });
    }catch(err){
      console.error('Opgeslagen indeling laden mislukt:',err);
    }finally{
      layoutsLoaded=true;
      decorateAll();
    }
  }

  document.addEventListener('click',()=>closePopovers());
  document.addEventListener('keydown',event=>{if(event.key==='Escape') closePopovers();});

  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      decorateAll();
    });
  }).observe(document.body,{childList:true,subtree:true});

  decorateAll();
  loadLayouts();
})();
