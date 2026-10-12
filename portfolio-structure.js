
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
    removed:[]
  });
  let current=defaults();
  const defaultTopicOwner=new Map();
  for(const key of keys)for(const id of current.topics[key])defaultTopicOwner.set(id,key);

  function validated(raw){
    if(!raw||raw.version!==1||!Array.isArray(raw.order)||!raw.topics||typeof raw.topics!=='object')throw Error('Ongeldige portfolio-indeling');
    const custom={};
    for(const [id,entry] of Object.entries(raw.custom||{})){
      if(!/^custom_[a-z0-9_-]{8,80}$/i.test(id))continue;
      const title=String(entry?.title||'').trim().slice(0,120);
      if(title)custom[id]={title};
    }
    const allTopicIds=new Set([...topicMap.keys(),...Object.keys(custom)]);
    const removed=new Set((Array.isArray(raw.removed)?raw.removed:[]).filter(id=>allTopicIds.has(id)));
    const order=[...new Set([...raw.order,...keys])].filter(key=>chapterMap.has(key));
    const topics=Object.fromEntries(keys.map(key=>[key,[]]));
    const seen=new Set();
    for(const key of keys)for(const id of (Array.isArray(raw.topics[key])?raw.topics[key]:[])){
      if(!allTopicIds.has(id)||removed.has(id)||seen.has(id))continue;
      seen.add(id);
      topics[key].push(id);
    }
    // New default sections introduced in future versions should not disappear.
    for(const [id,key] of defaultTopicOwner)if(!seen.has(id)&&!removed.has(id)){
      topics[key].push(id);
      seen.add(id);
    }
    return {version:1,order,topics,custom,removed:[...removed]};
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
    @media(max-width:680px){
      .structure-layer{padding:6px}.structure-dialog{height:96dvh;border-radius:13px}
      .structure-body{padding:10px}.structure-chapter-head{padding:9px 7px;gap:4px}
      .structure-topics{padding:7px;gap:7px}.structure-topic{padding:7px 4px;gap:4px;flex-wrap:wrap}
      .structure-topic-name{flex-basis:calc(100% - 68px)}.structure-move-select{max-width:100%;margin-left:36px;flex:1}
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
    let dirty=false,drag=null;
    const layer=document.createElement('div');
    layer.className='structure-layer';
    layer.innerHTML='<section class="structure-dialog" role="dialog" aria-modal="true" aria-label="Portfolio-indeling aanpassen"><header class="structure-head"><div><strong>Indeling aanpassen</strong><small>Hoofdstukken en onderdelen van het portfolio</small></div><button class="structure-close" data-close aria-label="Venster sluiten">×</button></header><div class="structure-body"><p class="structure-hint">Sleep aan de handgreep (⠿) om te verplaatsen. Gebruik de pijlen of de keuzelijst als slepen niet handig is. Wijzigingen verschijnen pas na <strong>Opslaan</strong> in het portfolio.</p><div class="structure-list"></div></div><footer class="structure-foot"><p class="structure-status" role="status">Nog geen wijzigingen.</p><button type="button" class="structure-button secondary" data-cancel>Annuleren</button><button type="button" class="structure-button" data-save disabled>Opslaan</button></footer></section>';
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
      const opts=draft.order.filter(ch=>ch!==key).map(ch=>'<option value="'+esc(ch)+'">'+esc(titleOf(ch))+'</option>').join('');
      const inner=items.map((id,j)=>{
        const topic=topicFor(id,draft);
        return '<div class="structure-topic" data-topic="'+esc(id)+'" data-owner="'+esc(key)+'">'+
          '<span class="structure-handle" draggable="true" data-drag-topic="'+esc(id)+'" role="button" tabindex="0" aria-label="Onderdeel slepen">⠿</span>'+
          '<span class="structure-topic-name">'+esc(topic?.title||id)+'</span>'+
          '<button class="structure-icon" data-up-topic="'+esc(id)+'" title="Omhoog" aria-label="Onderdeel omhoog" '+(j===0?'disabled':'')+'>↑</button>'+
          '<button class="structure-icon" data-down-topic="'+esc(id)+'" title="Omlaag" aria-label="Onderdeel omlaag" '+(j===items.length-1?'disabled':'')+'>↓</button>'+
          '<select class="structure-move-select" data-move-topic="'+esc(id)+'" aria-label="Naar ander hoofdstuk verplaatsen"><option value="">Verplaatsen naar…</option>'+opts+'</select>'+
          '<button class="structure-icon" data-delete-topic="'+esc(id)+'" title="Verwijderen" aria-label="Onderdeel verwijderen">✕</button></div>';
      }).join('');
      return '<article class="structure-chapter" data-chapter="'+esc(key)+'">'+
        '<div class="structure-chapter-head"><span class="structure-handle" draggable="true" data-drag-chapter="'+esc(key)+'" tabindex="0" aria-label="Hoofdstuk slepen">⠿</span>'+
        '<span class="structure-badge">'+num(index+1)+'</span><span class="structure-chapter-name">'+esc(titleOf(key))+'</span>'+
        '<button class="structure-icon" data-up-chapter="'+esc(key)+'" aria-label="Hoofdstuk omhoog" '+(index===0?'disabled':'')+'>↑</button>'+
        '<button class="structure-icon" data-down-chapter="'+esc(key)+'" aria-label="Hoofdstuk omlaag" '+(index===draft.order.length-1?'disabled':'')+'>↓</button></div>'+
        '<div class="structure-topics">'+(inner||'<span class="structure-empty">Geen onderdelen</span>')+
        '<button class="structure-add" data-add-topic="'+esc(key)+'">+ Onderdeel toevoegen</button>'+
        (key==='evidence'?'<span class="structure-empty">Bewijsstukcategorieën worden automatisch uit geüploade bestanden opgebouwd en blijven behouden.</span>':'')+
        '</div></article>';
    }
    function render(){
      list.innerHTML=draft.order.map(cardHtml).join('');
      const restore=draft.removed.length?'<button class="structure-add" type="button" data-restore-topics>↶ Verwijderde onderdelen herstellen ('+draft.removed.length+')</button>':'';
      list.insertAdjacentHTML('beforeend',restore);
    }
    render();
    function findOwner(id){return keys.find(key=>draft.topics[key].includes(id));}
    function shiftChapter(id,direction){const from=draft.order.indexOf(id),to=from+direction;if(from<0||to<0||to>=draft.order.length)return;draft.order.splice(from,1);draft.order.splice(to,0,id);mark();render();}
    function placeChapter(id,onto,before){const from=draft.order.indexOf(id);if(from<0||!draft.order.includes(onto)||id===onto)return;draft.order.splice(from,1);let at=draft.order.indexOf(onto)+(before?0:1);draft.order.splice(at,0,id);mark();render();}
    function moveTopic(id,target,beforeId,after=false){
      const owner=findOwner(id);if(!owner||!draft.topics[target])return;
      const source=draft.topics[owner];source.splice(source.indexOf(id),1);
      const to=draft.topics[target];
      const targetIndex=beforeId?to.indexOf(beforeId):-1;
      to.splice(targetIndex<0?to.length:targetIndex+(after?1:0),0,id);
      mark();render();
    }
    list.addEventListener('click',async event=>{
      const button=event.target.closest('button');if(!button||button.disabled)return;
      const field=Object.keys(button.dataset)[0],id=button.dataset[field];
      if(field==='upChapter')shiftChapter(id,-1);
      if(field==='downChapter')shiftChapter(id,1);
      if(field==='upTopic'||field==='downTopic'){
        const owner=findOwner(id),arr=draft.topics[owner],old=arr.indexOf(id),next=old+(field==='upTopic'?-1:1);
        if(next>=0&&next<arr.length){arr.splice(old,1);arr.splice(next,0,id);mark();render();}
      }
      if(field==='restoreTopics'){
        const deleted=draft.removed.slice();
        if(deleted.length){
          for(const topicId of deleted){
            const original=defaultTopicOwner.get(topicId)||'ch5';
            if(draft.topics[original]&&!draft.topics[original].includes(topicId))draft.topics[original].push(topicId);
          }
          draft.removed=[];
          mark();render();
        }
      }
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
        draft.topics[owner].splice(draft.topics[owner].indexOf(id),1);
        if(!draft.removed.includes(id))draft.removed.push(id);
        mark();render();
      }
    });
    list.addEventListener('change',event=>{
      const select=event.target.closest('[data-move-topic]');if(!select||!select.value)return;
      moveTopic(select.dataset.moveTopic,select.value);
    });
    list.addEventListener('dragstart',event=>{
      const topic=event.target.closest('[data-drag-topic]'),chapter=event.target.closest('[data-drag-chapter]');
      if(topic)drag={kind:'topic',id:topic.dataset.dragTopic};
      else if(chapter)drag={kind:'chapter',id:chapter.dataset.dragChapter};
      else return;
      event.dataTransfer.effectAllowed='move';
      event.dataTransfer.setData('text/plain',drag.kind+':'+drag.id);
    });
    list.addEventListener('dragover',event=>{
      if(!drag)return;
      const target=event.target.closest('.structure-chapter');
      if(!target)return;
      if(drag.kind==='chapter'&&target.dataset.chapter===drag.id)return;
      event.preventDefault();event.dataTransfer.dropEffect='move';
      list.querySelectorAll('.is-drop,.is-drop-before,.is-drop-after').forEach(el=>el.classList.remove('is-drop','is-drop-before','is-drop-after'));
      if(drag.kind==='chapter')target.classList.add('is-drop');
      else{
        const row=event.target.closest('.structure-topic');
        if(row&&row.dataset.topic!==drag.id)row.classList.add(event.clientY<row.getBoundingClientRect().top+row.offsetHeight/2?'is-drop-before':'is-drop-after');
        else target.classList.add('is-drop');
      }
    });
    list.addEventListener('drop',event=>{
      if(!drag)return;
      const target=event.target.closest('.structure-chapter');if(!target)return;
      event.preventDefault();
      if(drag.kind==='chapter')placeChapter(drag.id,target.dataset.chapter,event.clientY<target.getBoundingClientRect().top+target.offsetHeight/2);
      else{
        const row=event.target.closest('.structure-topic');
        if(row&&row.dataset.topic!==drag.id)moveTopic(drag.id,target.dataset.chapter,row.dataset.topic,event.clientY>=row.getBoundingClientRect().top+row.offsetHeight/2);
        else if(!row)moveTopic(drag.id,target.dataset.chapter);
      }
      drag=null;
      list.querySelectorAll('.is-drop,.is-drop-before,.is-drop-after').forEach(el=>el.classList.remove('is-drop','is-drop-before','is-drop-after'));
    });
    list.addEventListener('dragend',()=>{drag=null;list.querySelectorAll('.is-drop,.is-drop-before,.is-drop-after').forEach(el=>el.classList.remove('is-drop','is-drop-before','is-drop-after'));});
    layer.querySelector('[data-save]').addEventListener('click',async()=>{
      if(!dirty)return;
      save.disabled=true;status.textContent='Indeling online opslaan…';
      try{
        const {data:{session}}=await client.auth.getSession();
        if(!session||!document.body.classList.contains('can-edit'))throw Error('Log opnieuw in met een beheeraccount.');
        if(typeof openWindows!=='undefined'&&openWindows.size)throw Error('Sluit eerst alle geopende invulvensters voordat je de indeling opslaat.');
        const normalized=validated(draft);
        const {error}=await client.from('portfolio_content').upsert([{id:DATA_ID,value:JSON.stringify(normalized)}],{onConflict:'id'});
        if(error)throw error;
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
