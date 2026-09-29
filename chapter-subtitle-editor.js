(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const style=document.createElement('style');
  style.textContent=`
    .chapter-subtitle-line{display:flex;align-items:center;gap:6px;min-width:0}
    .chapter-subtitle-line .subtitle{min-width:0}
    .chapter-subtitle-edit{flex:0 0 auto;width:25px;height:25px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:#7b8b82;font:inherit;font-size:.82rem;line-height:1;cursor:pointer;opacity:.72;transition:.16s ease}
    .chapter-subtitle-edit:hover,.chapter-subtitle-edit:focus-visible{background:#edf3ef;color:#1f5e4a;opacity:1;outline:none}
    body:not(.can-edit) .chapter-subtitle-edit{display:none!important}
    .chapter-subtitle-overlay{position:fixed;inset:0;z-index:4100;background:rgba(18,34,28,.48);display:grid;place-items:center;padding:20px}
    .chapter-subtitle-dialog{width:min(520px,calc(100vw - 30px));background:#fff;border:1px solid #dce5df;border-radius:18px;box-shadow:0 28px 90px rgba(13,35,27,.34);overflow:hidden}
    .chapter-subtitle-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;background:linear-gradient(135deg,#1d5745,#286b55);color:#fff}
    .chapter-subtitle-head strong{font-family:Georgia,serif;font-size:1.05rem}
    .chapter-subtitle-close{width:32px;height:32px;border:1px solid rgba(255,255,255,.2);border-radius:9px;background:rgba(255,255,255,.1);color:#fff;font-size:1.2rem;cursor:pointer}
    .chapter-subtitle-body{display:grid;gap:10px;padding:17px}
    .chapter-subtitle-body label{font-size:.82rem;font-weight:850;color:#405047}
    .chapter-subtitle-body textarea{width:100%;min-height:96px;resize:vertical;border:1px solid #ced9d2;border-radius:11px;background:#fff;color:#263b32;padding:10px 11px;font:inherit;line-height:1.5;box-sizing:border-box}
    .chapter-subtitle-body textarea:focus{outline:2px solid rgba(31,94,74,.16);border-color:#7ca08e}
    .chapter-subtitle-message{min-height:1.2em;margin:0;color:#66746e;font-size:.77rem}
    .chapter-subtitle-message.error{color:#98433a}
    .chapter-subtitle-actions{display:flex;justify-content:flex-end;gap:8px}
    .chapter-subtitle-actions button{border-radius:10px;padding:9px 12px;font:inherit;font-size:.79rem;font-weight:850;cursor:pointer}
    .chapter-subtitle-cancel{border:1px solid #dce7df;background:#eef3ef;color:#1f5e4a}
    .chapter-subtitle-save{border:0;background:#1f5e4a;color:#fff}
    .chapter-subtitle-save:disabled{opacity:.55;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  const chapterNumber=section=>String(section?.dataset?.group||'').padStart(2,'0');
  const storageId=section=>`chapter_subtitle_${chapterNumber(section)}`;

  function decorateSection(section){
    if(!(section instanceof Element) || section.dataset.subtitleEditable==='1') return;
    const heading=section.querySelector(':scope > .chapter-header .chapter-heading');
    const subtitle=heading?.querySelector(':scope > .subtitle');
    if(!heading||!subtitle) return;

    section.dataset.subtitleEditable='1';
    const line=document.createElement('div');
    line.className='chapter-subtitle-line';
    subtitle.before(line);
    line.appendChild(subtitle);

    const button=document.createElement('button');
    button.type='button';
    button.className='chapter-subtitle-edit';
    button.dataset.chapterSubtitleEdit='1';
    button.setAttribute('aria-label',`Subtekst van hoofdstuk ${chapterNumber(section)} aanpassen`);
    button.title='Subtekst aanpassen';
    button.textContent='✎';
    line.appendChild(button);
    button.addEventListener('click',()=>openEditor(section,subtitle));
  }

  function decorateAll(){
    document.querySelectorAll('section.portfolio-group[data-group]').forEach(decorateSection);
  }

  function closeExisting(){
    document.querySelector('.chapter-subtitle-overlay')?.remove();
  }

  function openEditor(section,subtitle){
    if(!document.body.classList.contains('can-edit')) return;
    closeExisting();

    const number=chapterNumber(section);
    const title=section.querySelector('.chapter-heading h3')?.textContent?.trim()||`Hoofdstuk ${number}`;
    const overlay=document.createElement('div');
    overlay.className='chapter-subtitle-overlay';
    overlay.innerHTML=`
      <section class="chapter-subtitle-dialog" role="dialog" aria-modal="true" aria-label="Subtekst aanpassen">
        <header class="chapter-subtitle-head">
          <strong>Subtekst hoofdstuk ${number}</strong>
          <button class="chapter-subtitle-close" type="button" aria-label="Sluiten">×</button>
        </header>
        <div class="chapter-subtitle-body">
          <label for="chapter-subtitle-input">${title}</label>
          <textarea id="chapter-subtitle-input" maxlength="240"></textarea>
          <p class="chapter-subtitle-message" data-subtitle-message></p>
          <div class="chapter-subtitle-actions">
            <button class="chapter-subtitle-cancel" type="button" data-subtitle-cancel>Annuleren</button>
            <button class="chapter-subtitle-save" type="button" data-subtitle-save>Opslaan</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    const textarea=overlay.querySelector('textarea');
    const message=overlay.querySelector('[data-subtitle-message]');
    const save=overlay.querySelector('[data-subtitle-save]');
    textarea.value=subtitle.textContent.trim();

    let keyHandler=null;
    const close=()=>{
      if(keyHandler) document.removeEventListener('keydown',keyHandler);
      overlay.remove();
    };
    keyHandler=event=>{if(event.key==='Escape') close();};
    document.addEventListener('keydown',keyHandler);
    overlay.querySelector('.chapter-subtitle-close')?.addEventListener('click',close);
    overlay.querySelector('[data-subtitle-cancel]')?.addEventListener('click',close);

    save?.addEventListener('click',async()=>{
      const value=textarea.value.trim();
      if(!value){
        message.textContent='Vul een subtekst in.';
        message.classList.add('error');
        textarea.focus();
        return;
      }

      save.disabled=true;
      message.classList.remove('error');
      message.textContent='Opslaan…';
      try{
        const {data:sessionData}=await client.auth.getSession();
        if(!sessionData?.session) throw new Error('Je bent niet meer ingelogd. Log opnieuw in.');
        const {error}=await client.from('portfolio_content').upsert([{id:storageId(section),value}],{onConflict:'id'});
        if(error) throw error;
        subtitle.textContent=value;
        if(typeof state!=='undefined'&&state?.values) state.values[storageId(section)]=value;
        if(typeof persistState==='function') persistState(`Subtekst hoofdstuk ${number} opgeslagen op website`);
        else if(typeof setStatus==='function') setStatus(`Subtekst hoofdstuk ${number} opgeslagen op website`,'saved');
        close();
      }catch(err){
        console.error('Hoofdstuksubtekst opslaan mislukt:',err);
        message.textContent='Opslaan mislukt: '+String(err?.message||err);
        message.classList.add('error');
        save.disabled=false;
      }
    });

    requestAnimationFrame(()=>{
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length,textarea.value.length);
    });
  }

  async function loadSavedSubtitles(){
    const sections=[...document.querySelectorAll('section.portfolio-group[data-group]')];
    const ids=sections.map(storageId);
    if(!ids.length) return;
    try{
      const {data,error}=await client.from('portfolio_content').select('id,value').in('id',ids);
      if(error) throw error;
      const byId=new Map((data||[]).map(row=>[row.id,String(row.value||'').trim()]));
      sections.forEach(section=>{
        const value=byId.get(storageId(section));
        if(!value) return;
        const subtitle=section.querySelector('.chapter-heading .subtitle');
        if(subtitle) subtitle.textContent=value;
      });
    }catch(err){
      console.error('Hoofdstuksubteksten laden mislukt:',err);
    }
  }

  decorateAll();
  loadSavedSubtitles();

  new MutationObserver(()=>decorateAll()).observe(document.body,{childList:true,subtree:true});
})();
