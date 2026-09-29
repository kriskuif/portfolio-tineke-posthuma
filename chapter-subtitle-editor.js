(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const STATIC_SECTIONS=[
    {selector:'#over',key:'over',name:'Over dit portfolio'},
    {selector:'#overzicht',key:'overzicht',name:'Portfolio-overzicht'}
  ];

  const style=document.createElement('style');
  style.textContent=`
    .chapter-edit-line{display:flex;align-items:center;gap:6px;min-width:0}
    .chapter-title-line{align-items:flex-start}
    .chapter-title-line h3,.chapter-edit-line .subtitle{min-width:0}
    .chapter-inline-edit{flex:0 0 auto;width:25px;height:25px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:#7b8b82;font:inherit;font-size:.82rem;line-height:1;cursor:pointer;opacity:.72;transition:.16s ease}
    .chapter-title-line .chapter-inline-edit{margin-top:3px}
    .chapter-inline-edit:hover,.chapter-inline-edit:focus-visible{background:#edf3ef;color:#1f5e4a;opacity:1;outline:none}
    body:not(.can-edit) .chapter-inline-edit{display:none!important}

    .chapter-overview-edit-wrap{display:flex;align-items:flex-start;gap:5px;min-width:0}
    .chapter-overview-edit-wrap>p{flex:1;min-width:0}
    .chapter-overview-edit-wrap .chapter-inline-edit{margin-top:-3px}

    .chapter-field-overlay{position:fixed;inset:0;z-index:4100;background:rgba(18,34,28,.48);display:grid;place-items:center;padding:20px}
    .chapter-field-dialog{width:min(520px,calc(100vw - 30px));background:#fff;border:1px solid #dce5df;border-radius:18px;box-shadow:0 28px 90px rgba(13,35,27,.34);overflow:hidden}
    .chapter-field-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .chapter-field-head strong{font-family:Georgia,serif;font-size:1.05rem}
    .chapter-field-close{width:32px;height:32px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:rgba(255,255,255,.1);color:#fff;font-size:1.2rem;cursor:pointer}
    .chapter-field-body{display:grid;gap:10px;padding:17px}
    .chapter-field-body label{font-size:.82rem;font-weight:850;color:#405047}
    .chapter-field-body input,.chapter-field-body textarea{width:100%;border:1px solid #ced9d2;border-radius:11px;background:#fff;color:#263b32;padding:10px 11px;font:inherit;line-height:1.5;box-sizing:border-box}
    .chapter-field-body textarea{min-height:96px;resize:vertical}
    .chapter-field-body input:focus,.chapter-field-body textarea:focus{outline:2px solid rgba(31,94,74,.16);border-color:#7ca08e}
    .chapter-field-message{min-height:1.2em;margin:0;color:#66746e;font-size:.77rem}
    .chapter-field-message.error{color:#98433a}
    .chapter-field-actions{display:flex;justify-content:flex-end;gap:8px}
    .chapter-field-actions button{border-radius:10px;padding:9px 12px;font:inherit;font-size:.79rem;font-weight:850;cursor:pointer}
    .chapter-field-cancel{border:1px solid #dce7df;background:#eef3ef;color:#1f5e4a}
    .chapter-field-save{border:0;background:#1f5e4a;color:#fff}
    .chapter-field-save:disabled{opacity:.55;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  const chapterNumber=section=>String(section?.dataset?.group||'').padStart(2,'0');
  const chapterIndex=section=>Math.max(0,Number(section?.dataset?.group||0)-1);
  const chapterStorageId=(section,kind)=>`chapter_${kind}_${chapterNumber(section)}`;
  const staticStorageId=(key,kind)=>`section_${kind}_${key}`;

  function overviewCard(section){
    const n=Number(section?.dataset?.group||0);
    if(!n) return null;
    return [...document.querySelectorAll('#overzicht .journey-card')]
      .find(card=>card.querySelector(`a[href="#hoofdstuk-${n}"]`))||null;
  }

  function navLabelForHref(href){
    const link=document.querySelector(`.nav a[href="${href}"]`);
    return link?.querySelector('span:last-child')||null;
  }

  function navLabel(section){
    const n=Number(section?.dataset?.group||0);
    return n?navLabelForHref(`#hoofdstuk-${n}`):null;
  }

  function applyTitle(section,value){
    const clean=String(value||'').trim();
    if(!clean) return;
    const title=section.querySelector(':scope > .chapter-header .chapter-heading h3');
    if(title) title.textContent=clean;
    const cardTitle=overviewCard(section)?.querySelector('h4');
    if(cardTitle) cardTitle.textContent=clean;
    const nav=navLabel(section);
    if(nav) nav.textContent=clean;
    try{
      if(typeof groups!=='undefined'&&groups[chapterIndex(section)]) groups[chapterIndex(section)].title=clean;
    }catch(_err){}
  }

  function applySubtitle(section,value){
    const clean=String(value||'').trim();
    if(!clean) return;
    const subtitle=section.querySelector(':scope > .chapter-header .chapter-heading .subtitle');
    if(subtitle) subtitle.textContent=clean;
  }

  function applyOverview(section,value){
    const clean=String(value||'').trim();
    if(!clean) return;
    const text=overviewCard(section)?.querySelector(':scope > p');
    if(text) text.textContent=clean;
  }

  function applyStaticTitle(config,value){
    const clean=String(value||'').trim();
    if(!clean) return;
    const section=document.querySelector(config.selector);
    const title=section?.querySelector(':scope > .section-header h3');
    if(title) title.textContent=clean;
    const nav=navLabelForHref(config.selector);
    if(nav) nav.textContent=clean;
  }

  function applyStaticSubtitle(config,value){
    const clean=String(value||'').trim();
    if(!clean) return;
    const subtitle=document.querySelector(`${config.selector} > .section-header .subtitle`);
    if(subtitle) subtitle.textContent=clean;
  }

  function makeEditButton(label,onClick,kind=''){
    const button=document.createElement('button');
    button.type='button';
    button.className='chapter-inline-edit';
    if(kind) button.dataset.chapterFieldEdit=kind;
    button.setAttribute('aria-label',label);
    button.title=label;
    button.textContent='✎';
    button.addEventListener('click',onClick);
    return button;
  }

  function decorateSection(section){
    if(!(section instanceof Element)) return;
    const heading=section.querySelector(':scope > .chapter-header .chapter-heading');
    const title=heading?.querySelector(':scope > h3');
    const subtitle=heading?.querySelector(':scope > .subtitle');
    if(!heading||!title||!subtitle) return;

    if(section.dataset.titleEditable!=='1'){
      section.dataset.titleEditable='1';
      const line=document.createElement('div');
      line.className='chapter-edit-line chapter-title-line';
      title.before(line);
      line.appendChild(title);
      line.appendChild(makeEditButton(
        `Titel van hoofdstuk ${chapterNumber(section)} aanpassen`,
        ()=>openChapterEditor(section,'title',title),
        'title'
      ));
    }

    if(section.dataset.subtitleEditable!=='1'){
      section.dataset.subtitleEditable='1';
      const line=document.createElement('div');
      line.className='chapter-edit-line chapter-subtitle-line';
      subtitle.before(line);
      line.appendChild(subtitle);
      line.appendChild(makeEditButton(
        `Subtekst van hoofdstuk ${chapterNumber(section)} aanpassen`,
        ()=>openChapterEditor(section,'subtitle',subtitle),
        'subtitle'
      ));
    }
  }

  function decorateOverview(section){
    const card=overviewCard(section);
    const text=card?.querySelector(':scope > p');
    if(!card||!text||card.dataset.overviewEditable==='1') return;
    card.dataset.overviewEditable='1';
    const wrap=document.createElement('div');
    wrap.className='chapter-overview-edit-wrap';
    text.before(wrap);
    wrap.appendChild(text);
    wrap.appendChild(makeEditButton(
      `Overzichtstekst van hoofdstuk ${chapterNumber(section)} aanpassen`,
      ()=>openChapterEditor(section,'overview',text),
      'overview'
    ));
  }

  function decorateStaticSection(config){
    const section=document.querySelector(config.selector);
    const header=section?.querySelector(':scope > .section-header');
    const title=header?.querySelector('h3');
    const subtitle=header?.querySelector('.subtitle');
    if(!section||!header||!title||!subtitle) return;

    if(section.dataset.staticTitleEditable!=='1'){
      section.dataset.staticTitleEditable='1';
      const line=document.createElement('div');
      line.className='chapter-edit-line chapter-title-line';
      title.before(line);
      line.appendChild(title);
      line.appendChild(makeEditButton(
        `Titel van ${config.name} aanpassen`,
        ()=>openStaticEditor(config,'title',title)
      ));
    }

    if(section.dataset.staticSubtitleEditable!=='1'){
      section.dataset.staticSubtitleEditable='1';
      const line=document.createElement('div');
      line.className='chapter-edit-line chapter-subtitle-line';
      subtitle.before(line);
      line.appendChild(subtitle);
      line.appendChild(makeEditButton(
        `Subtekst van ${config.name} aanpassen`,
        ()=>openStaticEditor(config,'subtitle',subtitle)
      ));
    }
  }

  function decorateAll(){
    document.querySelectorAll('section.portfolio-group[data-group]').forEach(section=>{
      decorateSection(section);
      decorateOverview(section);
    });
    STATIC_SECTIONS.forEach(decorateStaticSection);
  }

  function closeExisting(){
    document.querySelector('.chapter-field-overlay')?.remove();
  }

  function fieldLabel(kind,isStatic=false){
    if(kind==='title') return isStatic?'Titel':'Hoofdstuktitel';
    if(kind==='overview') return 'Tekst in Portfolio-overzicht';
    return isStatic?'Subtekst':'Subtekst onder de hoofdstuktitel';
  }

  function openFieldEditor({kind,target,storageId,contextLabel,apply,statusLabel}){
    if(!document.body.classList.contains('can-edit')) return;
    closeExisting();

    const overlay=document.createElement('div');
    overlay.className='chapter-field-overlay';
    overlay.innerHTML=`
      <section class="chapter-field-dialog" role="dialog" aria-modal="true" aria-label="${fieldLabel(kind,true)} aanpassen">
        <header class="chapter-field-head">
          <strong>${fieldLabel(kind,true)} aanpassen</strong>
          <button class="chapter-field-close" type="button" aria-label="Sluiten">×</button>
        </header>
        <div class="chapter-field-body">
          <label data-chapter-field-label></label>
          <div data-chapter-field-control></div>
          <p class="chapter-field-message" data-chapter-field-message></p>
          <div class="chapter-field-actions">
            <button class="chapter-field-cancel" type="button" data-chapter-field-cancel>Annuleren</button>
            <button class="chapter-field-save" type="button" data-chapter-field-save>Opslaan</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    overlay.querySelector('[data-chapter-field-label]').textContent=contextLabel;
    const controlHost=overlay.querySelector('[data-chapter-field-control]');
    const control=document.createElement(kind==='title'?'input':'textarea');
    if(kind==='title'){
      control.type='text';
      control.maxLength=90;
    }else{
      control.maxLength=300;
    }
    control.value=target?.textContent?.trim()||'';
    controlHost.appendChild(control);

    const message=overlay.querySelector('[data-chapter-field-message]');
    const save=overlay.querySelector('[data-chapter-field-save]');

    let keyHandler=null;
    const close=()=>{
      if(keyHandler) document.removeEventListener('keydown',keyHandler);
      overlay.remove();
    };
    keyHandler=event=>{if(event.key==='Escape') close();};
    document.addEventListener('keydown',keyHandler);
    overlay.querySelector('.chapter-field-close')?.addEventListener('click',close);
    overlay.querySelector('[data-chapter-field-cancel]')?.addEventListener('click',close);

    save?.addEventListener('click',async()=>{
      const value=control.value.trim();
      if(!value){
        message.textContent='Vul eerst tekst in.';
        message.classList.add('error');
        control.focus();
        return;
      }

      save.disabled=true;
      message.classList.remove('error');
      message.textContent='Opslaan…';
      try{
        const {data:sessionData}=await client.auth.getSession();
        if(!sessionData?.session) throw new Error('Je bent niet meer ingelogd. Log opnieuw in.');
        const {error}=await client.from('portfolio_content').upsert([{id:storageId,value}],{onConflict:'id'});
        if(error) throw error;

        apply(value);
        if(typeof state!=='undefined'&&state?.values) state.values[storageId]=value;
        if(typeof persistState==='function') persistState(`${statusLabel} opgeslagen op website`);
        else if(typeof setStatus==='function') setStatus(`${statusLabel} opgeslagen op website`,'saved');
        close();
      }catch(err){
        console.error('Portfoliotekst opslaan mislukt:',err);
        message.textContent='Opslaan mislukt: '+String(err?.message||err);
        message.classList.add('error');
        save.disabled=false;
      }
    });

    requestAnimationFrame(()=>{
      control.focus();
      if(typeof control.setSelectionRange==='function') control.setSelectionRange(control.value.length,control.value.length);
    });
  }

  function openChapterEditor(section,kind,target){
    const number=chapterNumber(section);
    const currentTitle=section.querySelector('.chapter-heading h3')?.textContent?.trim()||`Hoofdstuk ${number}`;
    const statusLabel=kind==='title'?`Titel hoofdstuk ${number}`:kind==='overview'?`Overzichtstekst hoofdstuk ${number}`:`Subtekst hoofdstuk ${number}`;
    openFieldEditor({
      kind,
      target,
      storageId:chapterStorageId(section,kind),
      contextLabel:`Hoofdstuk ${number} · ${currentTitle}`,
      statusLabel,
      apply:value=>{
        if(kind==='title') applyTitle(section,value);
        else if(kind==='overview') applyOverview(section,value);
        else applySubtitle(section,value);
      }
    });
  }

  function openStaticEditor(config,kind,target){
    openFieldEditor({
      kind,
      target,
      storageId:staticStorageId(config.key,kind),
      contextLabel:config.name,
      statusLabel:`${kind==='title'?'Titel':'Subtekst'} ${config.name}`,
      apply:value=>{
        if(kind==='title') applyStaticTitle(config,value);
        else applyStaticSubtitle(config,value);
      }
    });
  }

  async function loadSavedFields(){
    const sections=[...document.querySelectorAll('section.portfolio-group[data-group]')];
    const chapterIds=sections.flatMap(section=>['title','subtitle','overview'].map(kind=>chapterStorageId(section,kind)));
    const staticIds=STATIC_SECTIONS.flatMap(config=>['title','subtitle'].map(kind=>staticStorageId(config.key,kind)));
    const ids=[...chapterIds,...staticIds];
    if(!ids.length) return;

    try{
      const {data,error}=await client.from('portfolio_content').select('id,value').in('id',ids);
      if(error) throw error;
      const byId=new Map((data||[]).map(row=>[row.id,String(row.value||'').trim()]));

      sections.forEach(section=>{
        const title=byId.get(chapterStorageId(section,'title'));
        const subtitle=byId.get(chapterStorageId(section,'subtitle'));
        const overview=byId.get(chapterStorageId(section,'overview'));
        if(title) applyTitle(section,title);
        if(subtitle) applySubtitle(section,subtitle);
        if(overview) applyOverview(section,overview);
      });

      STATIC_SECTIONS.forEach(config=>{
        const title=byId.get(staticStorageId(config.key,'title'));
        const subtitle=byId.get(staticStorageId(config.key,'subtitle'));
        if(title) applyStaticTitle(config,title);
        if(subtitle) applyStaticSubtitle(config,subtitle);
      });
    }catch(err){
      console.error('Bewerkbare portfolioteksten laden mislukt:',err);
    }
  }

  decorateAll();
  loadSavedFields();

  let mutationQueued=false;
  new MutationObserver(()=>{
    if(mutationQueued) return;
    mutationQueued=true;
    requestAnimationFrame(()=>{
      mutationQueued=false;
      decorateAll();
    });
  }).observe(document.body,{childList:true,subtree:true});
})();
