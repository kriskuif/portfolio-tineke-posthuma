
(() => {
  'use strict';
  const URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const DATA_ID='portfolio_structure_v1';
  const client=window.supabase?.createClient?.(URL,KEY);
  if(!client || typeof groups==='undefined' || typeof renderChapters!=='function') return;

  const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const num=value=>String(value).padStart(2,'0');
  const keys=['ch1','ch2','ch3','ch4','ch5','ch6','ch7','evidence'];
  const chapterMap=new Map();
  const topicMap=new Map();
  const main=document.querySelector('main');
  const overview=document.querySelector('#overzicht .journey');
  const nav=document.querySelector('.nav');
  if(!main||!overview||!nav)return;

  // Keep stable chapter and field identifiers separate from visual numbering.
  keys.forEach((key,i)=>{
    const section=document.getElementById('hoofdstuk-'+(i+1));
    const link=nav.querySelector('a[href="#hoofdstuk-'+(i+1)+'"]');
    const card=[...overview.querySelectorAll('.journey-card')].find(el=>el.querySelector('a[href="#hoofdstuk-'+(i+1)+'"]'));
    if(!section||!link||!card) return;
    section.dataset.chapterKey=key;
    link.dataset.chapterKey=key;
    card.dataset.chapterKey=key;
    const group=i<7?groups[i]:{title:'Bewijsstukkenregister',sub:'Alle bewijsstukken geordend per soort.',topics:[]};
    group.chapterKey=key;
    for(const topic of group.topics){
      const id=String(topic.fields?.[0]?.[0]||'');
      if(!id)continue;
      topic.portfolioKey=id;
      topicMap.set(id,topic);
    }
    chapterMap.set(key,{section,link,card,group});
  });
  if(chapterMap.size!==8)return;

  const evidence=chapterMap.get('evidence').section;
  const automatic=evidence.querySelector('#evidence-register-topics');
  const extraList=document.createElement('div');
  extraList.className='topic-list';
  extraList.dataset.customEvidenceTopics='1';
  automatic?.before(extraList);

  const defaults=()=>({
    version:1,
    order:keys.slice(),
    topics:Object.fromEntries(keys.map(key=>[key,chapterMap.get(key).group.topics.map(topic=>topic.portfolioKey)])),
    custom:{},
    removed:[],
    removedMeta:{},
    permanent:[]
  });
  let current=defaults();
  const defaultTopicOwner=new Map();
  for(const key of keys)for(const id of current.topics[key])defaultTopicOwner.set(id,key);

  // Legacy archives only stored IDs. Keep them readable without guessing a
  // location for deleted custom topics, and preserve known default chapters.
  function validated(raw){
    if(!raw||raw.version!==1||!Array.isArray(raw.order)||!raw.topics||typeof raw.topics!=='object')
      throw Error('Ongeldige portfolio-indeling');
    const custom={};
    for(const [id,entry] of Object.entries(raw.custom||{})){
      if(!/^custom_[a-z0-9_-]{8,80}$/i.test(id))continue;
      const title=String(entry?.title||'').trim().slice(0,120);
      if(title)custom[id]={title};
    }
    const known=new Set([...topicMap.keys(),...Object.keys(custom)]);
    // Built-in topics must stay tombstoned so they don't reappear on reload.
    const permanent=[...new Set(Array.isArray(raw.permanent)?raw.permanent:[])]
      .filter(id=>topicMap.has(id));
    const permanentSet=new Set(permanent);
    const removed=[...new Set(Array.isArray(raw.removed)?raw.removed:[])]
      .filter(id=>known.has(id)&&!permanentSet.has(id));
    const removedSet=new Set(removed);
    const removedMeta={};
    for(const id of removed){
      const location=raw.removedMeta?.[id];
      const chapter=keys.includes(location?.chapter)?location.chapter:(defaultTopicOwner.get(id)||null);
      const position=Number.isSafeInteger(location?.position)&&location.position>=0?location.position:null;
      removedMeta[id]={
        chapter,
        position,
        before:typeof location?.before==='string'?location.before:null,
        after:typeof location?.after==='string'?location.after:null,
        deletedAt:typeof location?.deletedAt==='string'?location.deletedAt:null,
        legacy:!(location&&keys.includes(location.chapter))
      };
    }
    const order=[...new Set([...raw.order,...keys])].filter(key=>chapterMap.has(key));
    const topics=Object.fromEntries(keys.map(key=>[key,[]]));
    const seen=new Set();
    for(const key of keys)for(const id of (Array.isArray(raw.topics[key])?raw.topics[key]:[])){
      if(!known.has(id)||removedSet.has(id)||permanentSet.has(id)||seen.has(id))continue;
      seen.add(id);
      topics[key].push(id);
    }
    // Preserve newly shipped default topics, except ones explicitly archived
    // or permanently removed by the portfolio administrator.
    for(const [id,key] of defaultTopicOwner){
      if(!seen.has(id)&&!removedSet.has(id)&&!permanentSet.has(id)){
        topics[key].push(id);
        seen.add(id);
      }
    }
    return {version:1,order,topics,custom,removed,removedMeta,permanent};
  }
  function archiveTopic(layout,id,owner){
    const topics=layout.topics[owner];
    const position=topics.indexOf(id);
    if(position<0)return false;
    layout.removedMeta[id]={
      chapter:owner,
      position,
      before:topics[position+1]||null,
      after:topics[position-1]||null,
      deletedAt:new Date().toISOString(),
      legacy:false
    };
    topics.splice(position,1);
    if(!layout.removed.includes(id))layout.removed.push(id);
    return true;
  }
  function restoreTopic(layout,id,requestedChapter){
    if(!layout.removed.includes(id))return false;
    const location=layout.removedMeta[id]||{};
    const chapter=keys.includes(location.chapter)?location.chapter:requestedChapter;
    if(!keys.includes(chapter))return false;
    const topics=layout.topics[chapter];
    if(topics.includes(id))return false;
    let position=-1;
    if(location.before&&topics.includes(location.before))position=topics.indexOf(location.before);
    else if(location.after&&topics.includes(location.after))position=topics.indexOf(location.after)+1;
    else if(Number.isSafeInteger(location.position))position=Math.min(Math.max(0,location.position),topics.length);
    if(position<0)position=topics.length;
    topics.splice(position,0,id);
    layout.removed=layout.removed.filter(item=>item!==id);
    delete layout.removedMeta[id];
    return true;
  }
  function topicFor(id,layout){
    if(topicMap.has(id))return topicMap.get(id);
    const added=layout.custom[id];
    if(!added)return null;
    return {portfolioKey:id,title:added.title,fields:[[id,'Inhoud','Werk dit onderdeel uit.']]};
  }
  function titleOf(key){
    return chapterMap.get(key)?.section.querySelector('.chapter-heading h3')?.textContent?.trim()||chapterMap.get(key)?.group.title||key;
  }
  // Render the overview badges from the actual, saved topic order.
  // Overview cards are not separate content: they must never retain stale labels
  // after an item is added, removed, or moved between chapters.
  function syncOverviewTopics(){
    for(const key of keys){
      const item=chapterMap.get(key);
      if(!item)continue;
      const badges=item.card.querySelector('.mini-tags');
      if(!badges)continue;

      const names=item.group.topics.map(topic=>String(topic.title||'').trim()).filter(Boolean);
      if(key==='evidence'){
        // Evidence categories live in portfolio_files rather than groups.
        // Read the current register so that uploads/removals are reflected too.
        evidence.querySelectorAll('#evidence-register-topics .evidence-category-card .topic-card-title h4')
          .forEach(heading=>{
            const label=heading.textContent.trim();
            if(label)names.push(label);
          });
      }

      // Replace only the badges; keep the user's chapter title, overview
      // description, links, and any saved chapter metadata untouched.
      badges.replaceChildren();
      if(names.length){
        const fragment=document.createDocumentFragment();
        names.forEach(label=>{
          const badge=document.createElement('span');
          badge.textContent=label;
          fragment.appendChild(badge);
        });
        badges.appendChild(fragment);
      }else{
        const badge=document.createElement('span');
        badge.className='overview-empty-tag';
        badge.textContent='Nog geen onderdelen';
        badges.appendChild(badge);
      }
    }
  }
  function anchorNode(section){
    return section.parentElement?.classList.contains('admin-notes-row')?section.parentElement:section;
  }
  function renderLayout(layout){
    // Do not reassign stored field IDs or destroy sections containing notes.
    const nextGroups=[];
    layout.order.forEach((key,i)=>{
      const item=chapterMap.get(key),n=i+1;
      const group=item.group;
      group.n=num(n);
      group.topics=layout.topics[key].map(id=>topicFor(id,layout)).filter(Boolean);
      nextGroups.push(group);
      item.section.dataset.group=String(n);
      item.section.id='hoofdstuk-'+n;
      item.section.querySelector('.section-num').textContent=num(n);
      const progress=item.section.querySelector('.chapter-progress');
      if(progress)progress.id='progress-'+n;
      const list=item.section.querySelector('[data-custom-evidence-topics]')||item.section.querySelector('.topic-list');
      if(list && !list.id?.startsWith('evidence-register-'))list.id='topics-'+n;
      item.link.href='#hoofdstuk-'+n;
      item.link.querySelector('.n').textContent=num(n);
      item.link.querySelector('span:last-child').textContent=titleOf(key);
      item.card.querySelector('.num').textContent=num(n);
      item.card.querySelector('a').href='#hoofdstuk-'+n;
      item.card.querySelector('h4').textContent=titleOf(key);
    });
    groups.splice(0,groups.length,...nextGroups);
    // Move chapter wrappers rather than their inner sections (admin chat stays attached).
    const footer=main.querySelector(':scope > footer');
    layout.order.forEach(key=>{
      const item=chapterMap.get(key);
      const node=anchorNode(item.section);
      main.insertBefore(node,footer);
      nav.appendChild(item.link);
      overview.appendChild(item.card);
    });
    const subtitle=document.querySelector('#overzicht .section-header .subtitle');
    if(subtitle && /^\w+ hoofdstukken met de bijbehorende onderdelen\.$/i.test(subtitle.textContent.trim())){
      subtitle.textContent='Acht hoofdstukken met de bijbehorende onderdelen.';
    }
    renderChapters();
    syncOverviewTopics();
    // Dynamic evidence categories are rendered by the file manager separately.
    evidence.querySelectorAll('.evidence-category-card .topic-index').forEach((el,i)=>{
      el.textContent='Onderdeel '+num(Number(evidence.dataset.group))+'.'+(i+1+chapterMap.get('evidence').group.topics.length);
    });
    document.dispatchEvent(new CustomEvent('portfolio:structure-changed',{detail:{order:layout.order.slice()}}));
  }
  const css=document.createElement('style');
  css.textContent=`
    .structure-open{margin-left:auto;flex:0 0 auto;border:1px solid #c9ded0;background:#eef5ef;color:#255b44;border-radius:11px;padding:9px 12px;font:inherit;font-size:.79rem;font-weight:850;cursor:pointer}
    .structure-open:hover{background:#dcece2}
    body:not(.can-edit) .structure-open{display:none!important}
    .structure-layer{position:fixed;inset:0;z-index:5300;background:rgba(15,33,24,.62);padding:18px;display:grid;place-items:center}
    .structure-dialog{width:min(900px,100%);height:min(92dvh,950px);display:flex;flex-direction:column;background:#fff;border-radius:20px;box-shadow:0 26px 100px rgba(0,0,0,.32);overflow:hidden}
    .structure-head{background:#1f5e4a;color:#fff;padding:17px 19px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .structure-head strong{font:700 1.24rem Georgia,serif}.structure-head small{display:block;margin-top:3px;color:#e1f0e8;font-size:.74rem}
    .structure-close{border:1px solid #7da08a;border-radius:9px;background:transparent;color:#fff;padding:6px 11px;cursor:pointer;font-size:1rem}
    .structure-body{overflow:auto;padding:17px;flex:1;overscroll-behavior:contain}
    .structure-hint{margin:0 0 15px;color:#50645a;font-size:.84rem;line-height:1.5}
    .structure-list{display:grid;gap:13px}
    .structure-chapter{border:1px solid #dce7df;border-radius:15px;background:#fcfdfc;overflow:hidden}
    .structure-chapter.is-drop{outline:2px dashed #4a9670;outline-offset:2px}
    .structure-chapter-head{display:flex;align-items:center;gap:9px;padding:12px 12px;background:#edf5ef}
    .structure-badge{display:grid;place-items:center;flex:0 0 auto;min-width:30px;height:30px;border-radius:9px;background:#d5e9db;color:#205f42;font-size:.77rem;font-weight:900}
    .structure-chapter-name{flex:1;min-width:0;font-weight:850;color:#264a3a;font-size:.88rem;overflow-wrap:anywhere}
    .structure-handle{border:1px solid transparent;background:transparent;color:#7a9585;border-radius:8px;padding:5px 7px;cursor:grab;touch-action:pan-y;font:inherit;font-size:1.1rem;line-height:1}
    .structure-handle:hover,.structure-handle:focus-visible{border-color:#b4cfc0;background:#fff;color:#1f5e4a;outline:none}
    .structure-icon{border:1px solid #d4e2d8;background:white;color:#315b47;border-radius:9px;cursor:pointer;font:inherit;font-size:.74rem;font-weight:800;padding:7px 9px}
    .structure-icon:disabled{opacity:.3;cursor:not-allowed}
    .structure-topics{display:grid;gap:6px;padding:10px 12px}
    .structure-topic{display:flex;align-items:center;gap:8px;padding:8px 9px;border:1px solid #e2e9e4;border-radius:10px;background:#fff}
    .structure-topic.is-drop-before{border-top:3px solid #268458}
    .structure-topic.is-drop-after{border-bottom:3px solid #268458}
    .structure-topic-name{min-width:0;flex:1;font-size:.81rem;font-weight:750;color:#365044;overflow-wrap:anywhere}
    .structure-move-select{border:1px solid #d5e3d9;background:#fff;color:#486055;border-radius:8px;padding:6px;font:inherit;font-size:.72rem;max-width:154px}
    .structure-add{border:1px dashed #b3cbbc;border-radius:9px;background:#f7fbf8;color:#246849;padding:8px 11px;cursor:pointer;font:inherit;font-size:.76rem;font-weight:850;text-align:left}
    .structure-empty{font-size:.75rem;color:#89988e;padding:5px}
    .structure-foot{display:flex;gap:10px;align-items:center;justify-content:flex-end;padding:13px 18px;border-top:1px solid #e2e8e3;background:#fbfdfb}
    .structure-status{flex:1;margin:0;min-width:0;color:#667a6c;font-size:.76rem}
    .structure-button{border:0;border-radius:10px;background:#1f5e4a;color:white;padding:10px 14px;cursor:pointer;font:inherit;font-size:.8rem;font-weight:850}
    .structure-button.secondary{border:1px solid #d6e3d9;background:#fff;color:#315945}
    .structure-button:disabled{opacity:.5;cursor:not-allowed}
    .structure-sub-layer{position:absolute;inset:0;background:rgba(19,36,26,.42);display:grid;place-items:center;padding:15px}
    .structure-sub-dialog{width:min(430px,100%);padding:20px;border-radius:16px;background:white;box-shadow:0 16px 60px #1a302649}
    .structure-sub-dialog h4{margin:0 0 9px;color:#265640}.structure-sub-dialog p{margin:0 0 14px;color:#52665a;font-size:.83rem;line-height:1.5}
    .structure-sub-dialog input{box-sizing:border-box;width:100%;margin:0 0 15px;padding:11px;border:1px solid #cbdacf;border-radius:9px;font:inherit}
    .structure-sub-actions{display:flex;justify-content:flex-end;gap:8px}
    .structure-archive-toolbar{display:flex;align-items:center;justify-content:flex-end;margin:0 0 12px}
    .structure-archive-open{display:flex;align-items:center;gap:8px;border:1px solid #c7dbce;border-radius:10px;background:#eef6f0;color:#245b42;padding:9px 12px;font:inherit;font-size:.79rem;font-weight:850;cursor:pointer}
    .structure-archive-open:hover,.structure-archive-open:focus-visible{background:#deede3;outline:none}
    .structure-archive-counter{display:inline-grid;place-items:center;min-width:23px;height:23px;padding:0 4px;background:#d4e8db;border-radius:999px}
    .structure-archive-dialog{width:min(680px,100%);max-height:min(78dvh,720px);display:flex;flex-direction:column;padding:0;overflow:hidden}
    .structure-archive-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid #e0e8e1}
    .structure-archive-head h4{margin:0;color:#244d3b;font:700 1.15rem Georgia,serif}
    .structure-archive-list{overflow:auto;padding:12px 18px 17px;display:grid;gap:10px}
    .structure-archive-row{border:1px solid #dce7df;border-radius:12px;background:#fbfdfb;padding:12px;display:grid;gap:9px}
    .structure-archive-row strong{font-size:.85rem;color:#2a4a3a;overflow-wrap:anywhere}
    .structure-archive-row small{font-size:.74rem;color:#6b7a70}
    .structure-archive-row-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
    .structure-archive-row-actions button{border:1px solid #cbded1;border-radius:9px;background:#edf5f0;color:#28573d;padding:8px 10px;font:inherit;font-weight:850;font-size:.77rem;cursor:pointer}
    .structure-archive-row-actions button.structure-purge{border-color:#e8c8c5;background:#fff0ef;color:#983f38}
    .structure-archive-select{border:1px solid #cbded1;border-radius:9px;background:#fff;padding:8px;max-width:100%;font:inherit;font-size:.76rem}
    .structure-archive-note{margin:0;color:#526459;font-size:.8rem;line-height:1.5}
    .structure-archive-footer{padding:12px 18px;border-top:1px solid #e0e8e1;display:flex;justify-content:flex-end}

    /* Minimal chapter planner: clear hierarchy, generous spacing, no extra controls. */
    .structure-dialog{background:#f8faf8;border:1px solid #d9e5dc;box-shadow:0 24px 90px rgba(9,40,26,.30)}
    .structure-head{padding:19px 22px;background:linear-gradient(125deg,#18513e,#286b53)}
    .structure-body{padding:20px 22px 24px;background:#f8faf8}
    .structure-hint{padding:12px 15px;border:1px solid #deebe2;background:#fff;border-radius:12px;margin-bottom:12px;font-size:.79rem}
    .structure-list{gap:14px}
    .structure-chapter{background:#fff;border:1px solid #dbe7df;border-radius:16px;overflow:visible;box-shadow:0 4px 14px rgba(32,70,49,.045);transition:border-color .15s,box-shadow .15s}
    .structure-chapter:hover{border-color:#bdd5c4;box-shadow:0 6px 18px rgba(32,70,49,.07)}
    .structure-chapter-head{gap:12px;padding:13px 15px;background:#f0f6f1;border-radius:15px 15px 0 0;border-bottom:1px solid #e2ebe4}
    .structure-badge{min-width:32px;height:32px;border-radius:10px;background:#d7ebde;color:#1d6040}
    .structure-chapter-name{color:#244835;font-size:.9rem}
    .structure-topic-count{font-size:.7rem;color:#688275;background:#fff;border:1px solid #e0e9e2;border-radius:999px;padding:5px 9px;white-space:nowrap}
    .structure-handle{flex:0 0 auto;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;font-size:1.15rem;user-select:none}
    .structure-handle:hover,.structure-handle:focus-visible{background:#e5f1e9;color:#1f5e4a}
    .structure-handle:active{cursor:grabbing}
    .structure-topics{gap:7px;padding:12px 14px 14px}
    .structure-topic{gap:10px;padding:9px 11px;border-color:#e2eae4;border-radius:11px;transition:border-color .15s,background .15s,box-shadow .15s}
    .structure-topic:hover{background:#fafcfb;border-color:#c5d9cb;box-shadow:0 2px 9px rgba(28,71,46,.04)}
    .structure-topic-name{color:#344f40}
    .structure-topic.is-being-dragged,.structure-chapter.is-being-dragged{opacity:.36}
    .structure-icon{border-color:#dfebe2;color:#688372;font-size:.8rem;padding:6px 9px}
    .structure-icon:hover,.structure-icon:focus-visible{background:#fff1ef;border-color:#e9cfc9;color:#9b4f42}
    .structure-add{border-radius:11px;background:#f8fcf9;padding:10px 12px;transition:background .15s,border-color .15s}
    .structure-add:hover,.structure-add:focus-visible{background:#eaf4ed;border-color:#79aa87;outline:none}
    .structure-archive-toolbar{margin-bottom:14px}
    .structure-foot{background:#fff}
    .structure-drop-indicator{position:absolute;z-index:9;height:4px;border-radius:999px;background:#23a36b;box-shadow:0 0 0 3px rgba(45,151,99,.14);pointer-events:none;display:none}
    .structure-drop-indicator.visible{display:block}
    .structure-drop-indicator::before{content:'';position:absolute;left:-5px;top:-4px;width:12px;height:12px;border:3px solid #23a36b;background:#fff;border-radius:50%;box-sizing:border-box}
    .structure-drop-indicator::after{content:attr(data-label);position:absolute;right:5px;bottom:9px;background:#1c7750;color:#fff;padding:5px 9px;border-radius:8px;font-size:.69rem;font-weight:900;white-space:nowrap;box-shadow:0 3px 12px rgba(27,95,58,.16)}
    @media(max-width:680px){
      .structure-layer{padding:6px}.structure-dialog{height:96dvh;border-radius:13px}
      .structure-body{padding:10px}.structure-chapter-head{padding:9px 7px;gap:4px}
      .structure-topics{padding:7px;gap:7px}.structure-topic{padding:7px 4px;gap:4px;flex-wrap:wrap}
      .structure-topic-name{flex:1;min-width:140px}.structure-topic-count{font-size:.64rem;padding:4px 6px}
      .structure-icon{padding:6px}.structure-handle{padding:5px}
      .structure-foot{padding:9px;flex-wrap:wrap}.structure-status{flex-basis:100%}
    }
  `;
  document.head.appendChild(css);

  const sectionHeader=document.querySelector('#overzicht .section-header');
  const openButton=document.createElement('button');
  openButton.type='button';
  openButton.className='structure-open';
  openButton.textContent='Indeling aanpassen';
  openButton.setAttribute('aria-label','Hoofdstukken en onderdelen indelen');
  sectionHeader?.appendChild(openButton);

  async function fetchSaved(){
    const {data,error}=await client.from('portfolio_content').select('value').eq('id',DATA_ID).maybeSingle();
    if(error)throw error;
    return data?.value?validated(JSON.parse(data.value)):defaults();
  }

  function ask(layer,options){
    return new Promise(resolve=>{
      const shield=document.createElement('div');
      shield.className='structure-sub-layer';
      shield.innerHTML='<div class="structure-sub-dialog" role="dialog" aria-modal="true"><h4>'+esc(options.title)+'</h4><p>'+esc(options.text||'')+'</p>'+(options.input?'<input type="text" maxlength="120" placeholder="Naam van het onderdeel">':'')+'<div class="structure-sub-actions"><button type="button" class="structure-button secondary" data-no>Annuleren</button><button type="button" class="structure-button" data-yes>'+esc(options.confirm||'Toevoegen')+'</button></div></div>';
      layer.appendChild(shield);
      const finish=value=>{shield.remove();resolve(value);};
      shield.querySelector('[data-no]').addEventListener('click',()=>finish(null));
      shield.querySelector('[data-yes]').addEventListener('click',()=>{
        if(options.input){
          const text=shield.querySelector('input').value.trim();
          if(!text){shield.querySelector('input').focus();return;}
          finish(text);
        }else finish(true);
      });
      shield.querySelector('input')?.addEventListener('keydown',event=>{if(event.key==='Enter')shield.querySelector('[data-yes]').click();});
      shield.querySelector('input')?.focus();
    });
  }

  function editor(initial){
    const draft=validated(initial);
    let dirty=false,drag=null,dropIntent=null;
    const queuedPurge=new Map();
    const layer=document.createElement('div');
    layer.className='structure-layer';
    layer.innerHTML='<section class="structure-dialog" role="dialog" aria-modal="true" aria-label="Portfolio-indeling aanpassen"><header class="structure-head"><div><strong>Indeling aanpassen</strong><small>Hoofdstukken en onderdelen van het portfolio</small></div><button class="structure-close" data-close aria-label="Venster sluiten">×</button></header><div class="structure-body"><p class="structure-hint">Sleep aan de <strong>greep ⠿</strong> om hoofdstukken en onderdelen te verplaatsen. De groene lijn geeft de exacte plek aan. Klik op <strong>Opslaan</strong> om de indeling door te voeren.</p><div class="structure-archive-toolbar"><button type="button" class="structure-archive-open" data-view-archive>Verwijderde onderdelen <span class="structure-archive-counter" data-archive-count>0</span></button></div><div class="structure-list"></div></div><footer class="structure-foot"><p class="structure-status" role="status">Nog geen wijzigingen.</p><button type="button" class="structure-button secondary" data-cancel>Annuleren</button><button type="button" class="structure-button" data-save disabled>Opslaan</button></footer></section>';
    document.body.appendChild(layer);
    const list=layer.querySelector('.structure-list'),status=layer.querySelector('.structure-status'),save=layer.querySelector('[data-save]');
    const previousOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    function close(){document.documentElement.style.overflow=previousOverflow;layer.remove();document.removeEventListener('keydown',onKey);}
    function onKey(event){if(event.key==='Escape'&&!layer.querySelector('.structure-sub-layer'))tryClose();}
    document.addEventListener('keydown',onKey);
    function mark(){dirty=true;save.disabled=false;status.textContent='Wijzigingen nog niet opgeslagen.';}
    async function tryClose(){
      if(dirty&&!await ask(layer,{title:'Wijzigingen niet opslaan?',text:'De gewijzigde indeling gaat verloren als je dit venster sluit.',confirm:'Niet opslaan'}))return;
      close();
    }
    layer.querySelector('[data-close]').addEventListener('click',tryClose);
    layer.querySelector('[data-cancel]').addEventListener('click',tryClose);

    function cardHtml(key,index){
      const items=draft.topics[key];
      const inner=items.map(id=>{
        const topic=topicFor(id,draft);
        return '<div class="structure-topic" data-topic="'+esc(id)+'" data-owner="'+esc(key)+'">'+
          '<span class="structure-handle" draggable="true" data-drag-topic="'+esc(id)+'" role="button" tabindex="0" title="Sleep om te verplaatsen" aria-label="Onderdeel slepen of met pijltjestoetsen verplaatsen">⠿</span>'+
          '<span class="structure-topic-name">'+esc(topic?.title||id)+'</span>'+
          '<button class="structure-icon" data-delete-topic="'+esc(id)+'" title="Onderdeel verwijderen" aria-label="Onderdeel verwijderen">✕</button></div>';
      }).join('');
      return '<article class="structure-chapter" data-chapter="'+esc(key)+'">'+
        '<div class="structure-chapter-head"><span class="structure-handle" draggable="true" data-drag-chapter="'+esc(key)+'" tabindex="0" title="Sleep om te verplaatsen" aria-label="Hoofdstuk slepen of met pijltjestoetsen verplaatsen">⠿</span>'+
        '<span class="structure-badge">'+num(index+1)+'</span><span class="structure-chapter-name">'+esc(titleOf(key))+'</span>'+
        '<span class="structure-topic-count">'+items.length+' '+(items.length===1?'onderdeel':'onderdelen')+'</span></div>'+
        '<div class="structure-topics">'+(inner||'<span class="structure-empty">Geen onderdelen</span>')+
        '<button class="structure-add" data-add-topic="'+esc(key)+'">+ Onderdeel toevoegen</button>'+
        (key==='evidence'?'<span class="structure-empty">Bewijsstukcategorieën uit bestanden worden automatisch opgebouwd.</span>':'')+
        '</div></article>';
    }
    function render(){
      list.innerHTML=draft.order.map(cardHtml).join('');
      const counter=layer.querySelector('[data-archive-count]');
      if(counter)counter.textContent=String(draft.removed.length);
    }
    render();
    function showArchive(){
      if(layer.querySelector('[data-archive-dialog]'))return;
      const shield=document.createElement('div');
      shield.className='structure-sub-layer';
      shield.dataset.archiveDialog='1';
      shield.innerHTML='<section class="structure-sub-dialog structure-archive-dialog" role="dialog" aria-modal="true" aria-label="Verwijderde onderdelen"><header class="structure-archive-head"><h4>Verwijderde onderdelen</h4><button type="button" class="structure-icon" data-close-archive aria-label="Sluiten">✕</button></header><div class="structure-archive-list"></div><footer class="structure-archive-footer"><button type="button" class="structure-button secondary" data-close-archive>Sluiten</button></footer></section>';
      layer.appendChild(shield);
      const archiveList=shield.querySelector('.structure-archive-list');
      const archiveClose=()=>shield.remove();
      shield.querySelectorAll('[data-close-archive]').forEach(button=>button.addEventListener('click',archiveClose));
      shield.addEventListener('click',event=>{if(event.target===shield)archiveClose();});
      function renderArchive(){
        if(!draft.removed.length){
          archiveList.innerHTML='<p class="structure-archive-note">Er zijn geen verwijderde onderdelen.</p>';
          return;
        }
        archiveList.innerHTML='<p class="structure-archive-note">Kies per onderdeel. Herstellen zet het terug in het hoofdstuk waar het is verwijderd. Definitief verwijderen wordt pas uitgevoerd wanneer je de gewijzigde indeling opslaat.</p>'+
          draft.removed.map(id=>{
            const location=draft.removedMeta[id]||{};
            const topic=topicFor(id,draft);
            const known=keys.includes(location.chapter);
            const caption=known?('Hoofdstuk '+num(draft.order.indexOf(location.chapter)+1)+' · '+titleOf(location.chapter)+(location.legacy?' (oorspronkelijke standaardlocatie)':'')):'Oorspronkelijk hoofdstuk niet bewaard';
            const choose=known?'':'<select class="structure-archive-select" data-archive-chapter="'+esc(id)+'" aria-label="Hoofdstuk kiezen"><option value="">Kies een hoofdstuk…</option>'+draft.order.map(key=>'<option value="'+esc(key)+'">'+esc(num(draft.order.indexOf(key)+1)+' · '+titleOf(key))+'</option>').join('')+'</select>';
            return '<article class="structure-archive-row"><strong>'+esc(topic?.title||id)+'</strong><small>'+esc(caption)+'</small><div class="structure-archive-row-actions">'+choose+
              '<button type="button" data-archive-restore="'+esc(id)+'">Herstellen</button>'+
              '<button type="button" class="structure-purge" data-archive-purge="'+esc(id)+'">Definitief verwijderen</button></div></article>';
          }).join('');
      }
      renderArchive();
      archiveList.addEventListener('click',async event=>{
        const restore=event.target.closest('[data-archive-restore]');
        if(restore){
          const id=restore.dataset.archiveRestore;
          const selected=archiveList.querySelector('[data-archive-chapter="'+id+'"]')?.value;
          if(!restoreTopic(draft,id,selected)){
            status.textContent='Kies eerst het hoofdstuk waarin dit oude onderdeel terug moet komen.';
            return;
          }
          mark();render();renderArchive();
          return;
        }
        const purge=event.target.closest('[data-archive-purge]');
        if(!purge)return;
        const id=purge.dataset.archivePurge;
        const topic=topicFor(id,draft);
        if(!topic)return;
        const approved=await ask(layer,{
          title:'Onderdeel definitief verwijderen?',
          text:'“'+topic.title+'” verdwijnt voorgoed uit de verwijderlijst. Opgeslagen tekstvelden worden bij Opslaan ook uit de online opslag gewist. Dit kan niet ongedaan worden gemaakt. Afzonderlijk geüploade bestanden in het bewijsstukkenregister blijven bestaan.',
          confirm:'Definitief verwijderen'
        });
        if(!approved)return;
        queuedPurge.set(id,topic.fields.map(field=>field[0]));
        draft.removed=draft.removed.filter(value=>value!==id);
        delete draft.removedMeta[id];
        if(topicMap.has(id)){
          if(!draft.permanent.includes(id))draft.permanent.push(id);
        }else{
          delete draft.custom[id];
        }
        mark();render();renderArchive();
      });
    }
    layer.querySelector('[data-view-archive]').addEventListener('click',showArchive);
    function findOwner(id){return keys.find(key=>draft.topics[key].includes(id));}

    // Shared insertion-index logic for drag/drop and accessible keyboard movement.
    function placeChapterAt(id,boundary){
      const from=draft.order.indexOf(id);
      if(from<0)return false;
      const at=boundary-(from<boundary?1:0);
      if(at===from)return false;
      draft.order.splice(from,1);
      draft.order.splice(at,0,id);
      mark();render();
      return true;
    }
    function placeTopicAt(id,target,boundary){
      const owner=findOwner(id);
      if(!owner||!draft.topics[target])return false;
      const source=draft.topics[owner],from=source.indexOf(id);
      if(from<0)return false;
      const at=target===owner&&from<boundary?boundary-1:boundary;
      if(target===owner&&at===from)return false;
      source.splice(from,1);
      draft.topics[target].splice(at,0,id);
      mark();render();
      return true;
    }
    list.addEventListener('click',async event=>{
      const button=event.target.closest('button');if(!button||button.disabled)return;
      const field=Object.keys(button.dataset)[0],id=button.dataset[field];
      if(field==='addTopic'){
        const title=await ask(layer,{title:'Onderdeel toevoegen',text:'Geef het nieuwe onderdeel een naam.',input:true});
        if(!title)return;
        const newId='custom_'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/-/g,'');
        draft.custom[newId]={title};
        draft.topics[id].push(newId);
        mark();render();
      }
      if(field==='deleteTopic'){
        const owner=findOwner(id);if(!owner)return;
        const topic=topicFor(id,draft),hasContent=!!String(state?.values?.[topic?.fields?.[0]?.[0]]||'').trim();
        const okay=await ask(layer,{title:'Onderdeel verwijderen?',text:'“'+(topic?.title||id)+'” verdwijnt uit het portfolio. '+(hasContent?'Er is opgeslagen inhoud: deze wordt veilig bewaard en niet uit de database verwijderd.':'Ook eventueel later teruggevonden inhoud blijft bewaard.'),confirm:'Verwijderen'});
        if(!okay)return;
        if(archiveTopic(draft,id,owner)){
          mark();render();
        }
      }
    });

    // An absolute marker avoids layout jumps as the drag target changes.
    const indicator=document.createElement('div');
    indicator.className='structure-drop-indicator';
    indicator.setAttribute('aria-hidden','true');
    layer.appendChild(indicator);
    function clearDrag(){
      drag=null;
      dropIntent=null;
      indicator.classList.remove('visible');
      list.querySelectorAll('.is-being-dragged').forEach(node=>node.classList.remove('is-being-dragged'));
    }
    function showLine(y,rect,kind){
      const parent=layer.getBoundingClientRect();
      indicator.style.top=(y-parent.top-2)+'px';
      indicator.style.left=(rect.left-parent.left+(kind==='topic'?16:7))+'px';
      indicator.style.width=Math.max(90,rect.width-(kind==='topic'?32:14))+'px';
      indicator.dataset.label=kind==='topic'?'Onderdeel hier invoegen':'Hoofdstuk hier plaatsen';
      indicator.classList.add('visible');
    }
    function locateChapter(event){
      const hovered=event.target.closest?.('.structure-chapter');
      if(hovered&&list.contains(hovered))return hovered;
      const cards=[...list.querySelectorAll(':scope > .structure-chapter')];
      if(!cards.length)return null;
      const distance=rect=>event.clientY<rect.top?rect.top-event.clientY:Math.max(0,event.clientY-rect.bottom);
      return cards.reduce((best,card)=>distance(card.getBoundingClientRect())<distance(best.getBoundingClientRect())?card:best,cards[0]);
    }
    function updateDrop(event){
      if(!drag)return false;
      const chapter=locateChapter(event);
      if(!chapter)return false;
      const key=chapter.dataset.chapter;
      if(drag.kind==='chapter'){
        const rect=chapter.getBoundingClientRect();
        const after=event.clientY>rect.top+rect.height/2;
        const boundary=draft.order.indexOf(key)+(after?1:0);
        const from=draft.order.indexOf(drag.id);
        if(from<0||from===boundary||from+1===boundary){
          dropIntent=null;indicator.classList.remove('visible');
          return true;
        }
        dropIntent={kind:'chapter',id:drag.id,boundary};
        showLine(after?rect.bottom:rect.top,rect,'chapter');
        return true;
      }

      const topics=chapter.querySelector('.structure-topics');
      if(!topics)return false;
      const rows=[...topics.querySelectorAll(':scope > .structure-topic')];
      const hovered=event.target.closest?.('.structure-topic');
      const row=hovered&&rows.includes(hovered)?hovered:null;
      let boundary=0,y=topics.getBoundingClientRect().top;
      if(row){
        const rect=row.getBoundingClientRect();
        const after=event.clientY>rect.top+rect.height/2;
        boundary=rows.indexOf(row)+(after?1:0);
        y=after?rect.bottom:rect.top;
      }else if(rows.length){
        // Header, blank areas and gaps pick the nearest visible insertion slot.
        const slots=rows.map((item,i)=>({index:i,y:item.getBoundingClientRect().top}));
        slots.push({index:rows.length,y:rows.at(-1).getBoundingClientRect().bottom});
        const slot=slots.reduce((best,option)=>Math.abs(event.clientY-option.y)<Math.abs(event.clientY-best.y)?option:best);
        boundary=slot.index;
        y=slot.y;
      }else{
        y=topics.querySelector('.structure-add')?.getBoundingClientRect().top||topics.getBoundingClientRect().top;
      }
      const owner=findOwner(drag.id);
      const from=draft.topics[owner]?.indexOf(drag.id)??-1;
      if(!owner||from<0||(owner===key&&(from===boundary||from+1===boundary))){
        dropIntent=null;indicator.classList.remove('visible');
        return true;
      }
      dropIntent={kind:'topic',id:drag.id,chapter:key,boundary};
      showLine(y,topics.getBoundingClientRect(),'topic');
      return true;
    }
    list.addEventListener('dragstart',event=>{
      const topic=event.target.closest('[data-drag-topic]');
      const chapter=event.target.closest('[data-drag-chapter]');
      if(topic)drag={kind:'topic',id:topic.dataset.dragTopic};
      else if(chapter)drag={kind:'chapter',id:chapter.dataset.dragChapter};
      else return;
      event.dataTransfer.effectAllowed='move';
      event.dataTransfer.setData('text/plain',drag.kind+':'+drag.id);
      const source=event.target.closest(drag.kind==='topic'?'.structure-topic':'.structure-chapter');
      // Delay fading the original until Safari captures its drag preview.
      setTimeout(()=>{if(drag)source?.classList.add('is-being-dragged');},0);
    });
    list.addEventListener('dragover',event=>{
      if(!drag)return;
      if(updateDrop(event)){
        event.preventDefault();
        event.dataTransfer.dropEffect=dropIntent?'move':'none';
      }
    });
    list.addEventListener('drop',event=>{
      if(!drag)return;
      event.preventDefault();
      updateDrop(event);
      const destination=dropIntent;
      clearDrag();
      if(!destination)return;
      if(destination.kind==='chapter')placeChapterAt(destination.id,destination.boundary);
      else placeTopicAt(destination.id,destination.chapter,destination.boundary);
    });
    list.addEventListener('dragend',clearDrag);
    // Focused drag handles support Up/Down keys without visible arrows.
    list.addEventListener('keydown',event=>{
      if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
      const handle=event.target.closest?.('[data-drag-topic],[data-drag-chapter]');
      if(!handle)return;
      event.preventDefault();
      const step=event.key==='ArrowUp'?-1:1;
      const chapter=handle.dataset.dragChapter;
      const topic=handle.dataset.dragTopic;
      if(chapter){
        const from=draft.order.indexOf(chapter),to=from+step;
        if(to<0||to>=draft.order.length)return;
        if(placeChapterAt(chapter,step===-1?to:to+1))
          list.querySelector('[data-drag-chapter="'+chapter+'"]')?.focus();
      }else if(topic){
        const owner=findOwner(topic),from=draft.topics[owner]?.indexOf(topic)??-1,to=from+step;
        if(to<0||to>=draft.topics[owner].length)return;
        if(placeTopicAt(topic,owner,step===-1?to:to+1))
          list.querySelector('[data-drag-topic="'+topic+'"]')?.focus();
      }
    });
    layer.querySelector('[data-save]').addEventListener('click',async()=>{
      if(!dirty)return;
      save.disabled=true;status.textContent='Indeling online opslaan…';
      try{
        const {data:{session}}=await client.auth.getSession();
        if(!session||!document.body.classList.contains('can-edit'))throw Error('Log opnieuw in met een beheeraccount.');
        if(typeof openWindows!=='undefined'&&openWindows.size)throw Error('Sluit eerst alle geopende invulvensters voordat je de indeling opslaat.');
        const normalized=validated(draft);
        const protectedFields=new Set(Object.values(normalized.topics).flatMap(ids=>ids.flatMap(id=>
          (topicFor(id,normalized)?.fields||[]).map(field=>field[0])
        )));
        const purgeIds=[...new Set([...queuedPurge.values()].flat())];
        if(purgeIds.some(id=>protectedFields.has(id)))
          throw Error('Een te verwijderen tekstveld wordt nog gebruikt in een ander onderdeel.');
        const {error}=await client.from('portfolio_content')
          .upsert([{id:DATA_ID,value:JSON.stringify(normalized)}],{onConflict:'id'});
        if(error)throw error;
        // Save the structure before deleting texts. On a failed delete, roll
        // the structure back to the previous archived state.
        if(purgeIds.length){
          try{
            const {data:before,error:readError}=await client.from('portfolio_content')
              .select('id').in('id',purgeIds);
            if(readError)throw readError;
            const {data:deleted,error:deleteError}=await client.from('portfolio_content')
              .delete().in('id',purgeIds).select('id');
            if(deleteError)throw deleteError;
            const deletedIds=new Set((deleted||[]).map(row=>row.id));
            if((before||[]).some(row=>!deletedIds.has(row.id)))
              throw Error('Niet alle tekstvelden konden worden verwijderd. Controleer de beheerrechten.');
          }catch(deleteError){
            const rollback=await client.from('portfolio_content')
              .upsert([{id:DATA_ID,value:JSON.stringify(current)}],{onConflict:'id'});
            if(rollback.error)throw Error('Verwijderen is gedeeltelijk mislukt. Herlaad de pagina om de actuele indeling te controleren.');
            throw deleteError;
          }
          if(typeof state!=='undefined'&&state?.values){
            purgeIds.forEach(id=>{delete state.values[id];});
            if(typeof persistState==='function')persistState('Definitief verwijderde onderdelen opgeslagen');
          }
        }
        current=normalized;
        renderLayout(current);
        dirty=false;
        if(typeof setStatus==='function')setStatus('Portfolio-indeling opgeslagen','saved');
        close();
      }catch(error){status.textContent='Opslaan mislukt: '+String(error?.message||error);save.disabled=false;}
    });
  }
  openButton.addEventListener('click',async()=>{
    if(!document.body.classList.contains('can-edit'))return;
    if(document.querySelector('.structure-layer'))return;
    openButton.disabled=true;
    try{
      const remote=await fetchSaved();
      current=remote;
      if(typeof openWindows!=='undefined'&&openWindows.size)throw Error('Sluit eerst alle geopende invulvensters.');
      renderLayout(current);
      editor(current);
    }catch(err){window.alert('Indeling openen mislukt: '+String(err?.message||err));}
    finally{openButton.disabled=false;}
  });

  document.addEventListener('portfolio:files-loaded',syncOverviewTopics);
  document.addEventListener('portfolio:structure-changed',syncOverviewTopics);
  fetchSaved().then(layout=>{current=layout;renderLayout(layout);}).catch(error=>{
    console.error('Portfolio-indeling laden mislukt:',error);
    renderLayout(current);
  });
})();
