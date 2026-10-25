
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

    /* Coastal modern theme — confined to the structure editor, no behaviour changes. */
    .structure-layer{
      background:rgba(16,35,38,.62);
      padding:clamp(8px,2.5vw,28px);
      -webkit-backdrop-filter:blur(10px);
      backdrop-filter:blur(10px)
    }
    .structure-dialog{
      --structure-teal:#205d59;
      --structure-ink:#25443f;
      --structure-soft:#657a75;
      --structure-line:#e0e8e4;
      width:min(960px,100%);
      height:min(92dvh,940px);
      border:1px solid rgba(255,255,255,.86);
      border-radius:24px;
      background:#f7f9f7;
      box-shadow:0 38px 115px rgba(5,34,36,.29),0 3px 24px rgba(5,34,36,.08);
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      isolation:isolate
    }
    .structure-head{
      position:relative;
      isolation:isolate;
      overflow:hidden;
      flex:0 0 auto;
      align-items:center;
      padding:26px 30px 25px;
      background:linear-gradient(118deg,#173f46 0%,#1d5655 48%,#337467 100%);
      border-bottom:1px solid rgba(255,255,255,.16)
    }
    .structure-head::after{
      content:"";
      position:absolute;
      z-index:-1;
      width:330px;height:270px;
      right:55px;top:-128px;
      border-radius:50%;
      transform:rotate(-16deg);
      background:radial-gradient(ellipse at center,rgba(220,242,226,.14),transparent 72%);
      box-shadow:96px 48px 0 -48px rgba(223,237,224,.035);
      pointer-events:none
    }
    .structure-head-intro{display:grid;justify-items:start;gap:5px;min-width:0}
    .structure-eyebrow{
      font-size:.62rem;font-weight:850;letter-spacing:.15em;
      line-height:1.45;color:#d4e8df
    }
    .structure-eyebrow span{padding:0 5px;color:#d9c7a4}
    .structure-head strong{
      display:block;
      margin:0 0 1px;
      color:#fff;
      font:700 clamp(1.48rem,2.2vw,1.85rem)/1.17 Georgia,"Times New Roman",serif;
      letter-spacing:-.02em
    }
    .structure-head small{font-size:.82rem;font-weight:450;color:#dcece6}
    .structure-close{
      flex:0 0 auto;
      width:38px;height:38px;padding:0;
      display:grid;place-items:center;
      font-size:1.34rem;line-height:1;
      border:1px solid rgba(255,255,255,.27);
      border-radius:12px;
      background:rgba(255,255,255,.10);
      transition:background .17s,transform .17s,border-color .17s
    }
    .structure-close:hover,.structure-close:focus-visible{
      background:rgba(255,255,255,.22);
      border-color:rgba(255,255,255,.55);
      transform:rotate(4deg);
      outline:2px solid transparent
    }
    .structure-body{
      min-height:0;
      padding:22px clamp(15px,3.2vw,30px) 32px;
      background:
        radial-gradient(circle at 94% 2%,rgba(216,231,222,.50),transparent 33%),
        linear-gradient(145deg,#f8faf7 0%,#f7f9f8 60%,#f5f8f5 100%);
      scrollbar-color:#c2d5cc transparent;
      scrollbar-width:thin
    }
    .structure-hint{
      display:flex;align-items:center;gap:14px;
      margin:0 0 23px;
      padding:13px 16px;
      border:1px solid #dbe7e1;
      border-left:3px solid #7caea4;
      border-radius:14px;
      background:rgba(255,255,255,.92);
      box-shadow:0 2px 10px rgba(39,82,70,.03);
      color:#586d66
    }
    .structure-hint-icon{
      flex:0 0 auto;
      display:grid;place-items:center;
      width:35px;height:35px;
      border-radius:11px;
      background:#e7f1ed;
      border:1px solid #d6e8e0;
      color:#2e7065;
      font-size:1.2rem;line-height:1
    }
    .structure-hint p{margin:0;font-size:.79rem;line-height:1.55}
    .structure-hint strong{color:#254f47;font-weight:850}
    .structure-archive-toolbar{
      justify-content:space-between;
      align-items:center;gap:12px;
      margin-bottom:12px;
      min-height:43px
    }
    .structure-collection-title{display:grid;gap:2px}
    .structure-collection-title span{
      color:#48685e;font-size:.67rem;
      font-weight:900;letter-spacing:.115em
    }
    .structure-collection-title small{color:#84978c;font-size:.71rem}
    .structure-archive-open{
      gap:9px;
      padding:9px 12px;
      border:1px solid #d6e4dc;
      border-radius:12px;
      color:#2b6659;
      background:#fff;
      box-shadow:0 2px 8px rgba(24,71,55,.035);
      font-size:.74rem;font-weight:820;
      transition:background .18s,border-color .18s,transform .18s
    }
    .structure-archive-open::before{
      content:"↶";
      font-size:1.06rem;line-height:1;
      color:#64a18a
    }
    .structure-archive-open:hover,.structure-archive-open:focus-visible{
      border-color:#a5cdb8;background:#f2f8f4;
      transform:translateY(-1px);
      outline:none
    }
    .structure-archive-counter{
      background:#e5f2ea;
      border:1px solid #d5e9de;
      color:#1e654c;
      width:24px;min-width:24px;height:24px;padding:0;
      font-size:.74rem
    }
    .structure-list{gap:14px}
    .structure-chapter{
      --chapter-color:#56a89e;
      position:relative;
      overflow:visible;
      border-radius:17px;
      border:1px solid #dce7e2;
      border-top:3px solid var(--chapter-color);
      background:#fff;
      box-shadow:0 4px 17px rgba(34,74,58,.045),0 1px 3px rgba(34,74,58,.025);
      transition:border-color .18s,box-shadow .18s,transform .18s
    }
    .structure-chapter:nth-child(4n+2){--chapter-color:#adbd9d}
    .structure-chapter:nth-child(4n+3){--chapter-color:#78a5b9}
    .structure-chapter:nth-child(4n+4){--chapter-color:#c6ac7f}
    .structure-chapter:hover{
      border-color:#bdd6c8;
      border-top-color:var(--chapter-color);
      box-shadow:0 9px 28px rgba(30,70,56,.085),0 1px 4px rgba(34,74,58,.03)
    }
    .structure-chapter-head{
      gap:12px;
      padding:14px 17px;
      border-radius:14px 14px 0 0;
      border-bottom:1px solid #ebf0ec;
      background:linear-gradient(95deg,#fbfdfb 0%,#f9fbf9 52%,#f3f8f5 100%)
    }
    .structure-badge{
      min-width:38px;width:38px;height:38px;
      border-radius:12px;
      background:color-mix(in srgb,var(--chapter-color) 18%,white);
      border:1px solid color-mix(in srgb,var(--chapter-color) 23%,white);
      color:#2c5a4c;
      font-size:.82rem;
      font-variant-numeric:tabular-nums
    }
    .structure-chapter-name{
      font-size:.92rem;
      letter-spacing:-.014em;
      font-weight:850;line-height:1.3;color:#263f37
    }
    .structure-topic-count{
      padding:6px 10px;
      background:rgba(236,244,239,.75);
      border:1px solid #e0ebe3;
      border-radius:999px;
      color:#577667;font-size:.69rem;font-weight:760
    }
    .structure-handle{
      min-width:35px;
      width:35px;height:35px;
      border:1px solid transparent;
      border-radius:11px;
      color:#96aca0;
      font-size:1.28rem;
      cursor:grab;
      transition:background .15s,color .15s,border-color .15s,transform .15s
    }
    .structure-handle:hover,.structure-handle:focus-visible{
      background:#e9f3ed;
      border-color:#c4dfcf;
      color:#34745d;
      transform:scale(1.045);
      outline:2px solid transparent
    }
    .structure-handle:active{cursor:grabbing;transform:scale(.96)}
    .structure-topics{gap:8px;padding:13px 15px 15px}
    .structure-topic{
      min-height:46px;
      padding:8px 11px;
      gap:11px;
      border:1px solid #e4ebe7;
      border-radius:12px;
      background:linear-gradient(105deg,#fff 0%,#fff 82%,#fbfcfb 100%);
      box-shadow:0 1px 3px rgba(25,57,47,.024);
      transition:background .16s,border-color .16s,box-shadow .16s,transform .16s
    }
    .structure-topic:hover{
      border-color:#b9d6c6;
      background:#fbfefc;
      box-shadow:0 4px 12px rgba(37,87,60,.065);
      transform:translateY(-1px)
    }
    .structure-topic-name{font-size:.81rem;color:#3b5148;font-weight:730;line-height:1.4}
    .structure-icon{
      width:33px;height:33px;display:grid;place-items:center;
      padding:0;
      flex:0 0 auto;
      color:#8b9e95;
      border:1px solid transparent;
      background:transparent;border-radius:10px;
      transition:color .16s,background .16s,border-color .16s
    }
    .structure-icon:hover,.structure-icon:focus-visible{
      color:#a65347;
      border-color:#f0d6cf;background:#fff1ed;outline:none
    }
    .structure-add{
      padding:11px 14px;
      border:1px dashed #b9d6c5;
      border-radius:12px;
      background:linear-gradient(100deg,#f7fbf8,#f3f9f5);
      font-size:.78rem;
      color:#286c56;
      text-align:center;
      transition:background .18s,border-color .18s,transform .18s
    }
    .structure-add:hover,.structure-add:focus-visible{
      background:#e9f5ed;
      border-color:#81b29c;
      transform:translateY(-1px);
      outline:none
    }
    .structure-empty{padding:7px 12px;color:#899a91;line-height:1.5;font-size:.74rem}
    .structure-topic.is-being-dragged,.structure-chapter.is-being-dragged{
      opacity:.43;box-shadow:none
    }
    .structure-drop-indicator{
      height:4px;
      background:#17a974;
      box-shadow:0 0 0 4px rgba(23,169,116,.13),0 1px 5px rgba(10,99,65,.12)
    }
    .structure-drop-indicator::before{border-color:#17a974}
    .structure-drop-indicator::after{
      background:#146d55;
      border-radius:9px;
      padding:7px 11px;
      font-size:.72rem;
      letter-spacing:.015em
    }
    .structure-foot{
      padding:16px 25px;
      border-top:1px solid #e2e9e5;
      background:rgba(255,255,255,.97);
      box-shadow:0 -6px 22px rgba(27,56,43,.025);
      gap:10px
    }
    .structure-status{font-size:.77rem;font-weight:620;color:#819287;line-height:1.45}
    .structure-button{
      border-radius:11px;
      padding:10px 17px;
      font-size:.8rem;min-height:42px;
      background:linear-gradient(120deg,#1d6251,#247b61);
      box-shadow:0 3px 9px rgba(30,96,72,.11);
      transition:filter .16s,box-shadow .16s,transform .16s
    }
    .structure-button:not(:disabled):hover{
      filter:brightness(1.05);
      box-shadow:0 7px 16px rgba(30,96,72,.15);
      transform:translateY(-1px)
    }
    .structure-button.secondary{
      border:1px solid #d9e5dd;background:#fff;
      color:#456458;box-shadow:none
    }
    .structure-button.secondary:hover{background:#f3f8f5;box-shadow:none;filter:none}
    .structure-button:disabled{opacity:.52;box-shadow:none;transform:none}
    .structure-sub-layer{
      z-index:20;
      background:rgba(18,43,40,.39);
      -webkit-backdrop-filter:blur(5px);
      backdrop-filter:blur(5px)
    }
    .structure-sub-dialog{
      border:1px solid rgba(227,239,231,.95);
      border-radius:19px;
      box-shadow:0 24px 80px rgba(14,43,36,.23)
    }
    .structure-archive-dialog{
      border-radius:20px;
      background:#f9fbf9
    }
    .structure-archive-head{
      background:#fff;
      padding:19px 22px;
      border-radius:20px 20px 0 0
    }
    .structure-archive-head h4{font-size:1.23rem}
    .structure-archive-list{padding:18px 22px 22px}
    .structure-archive-row{
      padding:16px;border-radius:14px;
      background:#fff;box-shadow:0 2px 9px rgba(22,66,45,.035)
    }
    .structure-archive-row strong{font-size:.86rem}
    .structure-archive-row-actions button{
      border-radius:10px;padding:9px 12px;transition:background .16s
    }
    .structure-archive-row-actions button:hover{background:#deece3}
    .structure-archive-row-actions button.structure-purge:hover{background:#ffe2de}
    .structure-archive-footer{background:#fff;padding:14px 22px}
    @media(max-width:680px){
      .structure-layer{padding:7px}
      .structure-dialog{width:100%;height:97dvh;border-radius:18px}
      .structure-head{padding:19px 17px}
      .structure-head strong{font-size:1.48rem}
      .structure-head small{font-size:.74rem}
      .structure-body{padding:13px 12px 22px}
      .structure-hint{padding:12px;gap:9px;margin-bottom:16px}
      .structure-hint-icon{width:30px;height:30px}
      .structure-hint p{font-size:.74rem}
      .structure-archive-toolbar{align-items:center;gap:8px}
      .structure-collection-title span{font-size:.59rem}
      .structure-collection-title small{display:none}
      .structure-archive-open{padding:8px 9px;font-size:.67rem;gap:5px}
      .structure-archive-open::before{display:none}
      .structure-list{gap:11px}
      .structure-chapter{border-radius:14px}
      .structure-chapter-head{padding:9px 11px;gap:7px;border-radius:11px 11px 0 0}
      .structure-badge{width:32px;min-width:32px;height:32px;border-radius:9px;font-size:.75rem}
      .structure-chapter-name{font-size:.8rem}
      .structure-topic-count{padding:4px 6px;font-size:.62rem}
      .structure-topics{padding:9px 10px 11px;gap:6px}
      .structure-topic{flex-wrap:nowrap;gap:7px;padding:6px 8px}
      .structure-topic-name{min-width:0;flex:1;font-size:.76rem}
      .structure-handle{width:30px;min-width:30px;height:30px;padding:0}
      .structure-icon{width:30px;height:30px}
      .structure-foot{padding:11px 12px}
      .structure-status{font-size:.73rem}
      .structure-button{min-height:39px;padding:9px 12px}
      .structure-archive-list{padding:12px}
    }
    @media(prefers-reduced-motion:reduce){
      .structure-layer *, .structure-open{transition:none!important;animation:none!important}
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
    layer.innerHTML='<section class="structure-dialog" role="dialog" aria-modal="true" aria-label="Portfolio-indeling aanpassen"><header class="structure-head"><div class="structure-head-intro"><span class="structure-eyebrow">PORTFOLIOBEHEER <span aria-hidden="true">/</span> STRUCTUUR</span><strong>Indeling aanpassen</strong><small>Geef je portfolio de volgorde die bij je past.</small></div><button class="structure-close" data-close aria-label="Venster sluiten">×</button></header><div class="structure-body"><div class="structure-hint"><span class="structure-hint-icon" aria-hidden="true">⠿</span><p><strong>Verslepen om in te delen.</strong> Pak de greep bij een hoofdstuk of onderdeel. De groene lijn laat precies zien waar het terechtkomt.</p></div><div class="structure-archive-toolbar"><div class="structure-collection-title"><span>JOUW HOOFDSTUKKEN</span><small>Sleep om de volgorde aan te passen</small></div><button type="button" class="structure-archive-open" data-view-archive>Verwijderde onderdelen <span class="structure-archive-counter" data-archive-count>0</span></button></div><div class="structure-list"></div></div><footer class="structure-foot"><p class="structure-status" role="status">Nog geen wijzigingen.</p><button type="button" class="structure-button secondary" data-cancel>Annuleren</button><button type="button" class="structure-button" data-save disabled>Opslaan</button></footer></section>';
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
        // Include any dynamically added text blocks and their custom headings.
        const fieldIds=new Set([...topic.fields,...visibleTopicFields(topic)].map(field=>field[0]));
        queuedPurge.set(id,[topicFieldLayoutKey(topic),...[...fieldIds].flatMap(fieldId=>[fieldId,fieldHeadingKey(fieldId)])]);
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
        const protectedFields=new Set(Object.values(normalized.topics).flatMap(ids=>ids.flatMap(id=>{
          const topic=topicFor(id,normalized);
          if(!topic)return [];
          const fieldIds=new Set([...topic.fields,...visibleTopicFields(topic)].map(field=>field[0]));
          return [topicFieldLayoutKey(topic),...[...fieldIds].flatMap(fieldId=>[fieldId,fieldHeadingKey(fieldId)])];
        })));
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
