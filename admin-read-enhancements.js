(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const DWELL_MS=3000;
  const VISIBILITY_KEY='portfolio-admin-notes-visible-v2';
  const LOGIN_MARKER_KEY='portfolio-admin-notes-login-user-v1';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const seenSince=new Map();
  let dueTimer=null;
  let scanQueued=false;
  let session=null;
  let editor=null;
  let channel=null;
  let marking=false;

  function clearDueTimer(){
    if(dueTimer){clearTimeout(dueTimer);dueTimer=null;}
  }

  function resetSeen(){
    clearDueTimer();
    seenSince.clear();
  }

  function notesVisible(){
    return document.body.classList.contains('admin-notes-visible') && document.visibilityState==='visible';
  }

  function currentUserId(){
    return session?.user?.id||'';
  }

  function currentEmail(){
    return String(session?.user?.email||'').trim().toLowerCase();
  }

  function forceNotesOff(attempt=0){
    try{localStorage.setItem(VISIBILITY_KEY,'0');}catch(_err){}
    document.body.classList.remove('admin-notes-visible');
    const input=document.querySelector('[data-admin-notes-toggle]');
    if(input){
      if(input.checked){
        input.checked=false;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }
      return;
    }
    if(attempt<24) setTimeout(()=>forceNotesOff(attempt+1),50);
  }

  function handleAuthStateChange(event,newSession){
    const uid=String(newSession?.user?.id||'');
    if(event==='SIGNED_OUT'){
      try{sessionStorage.removeItem(LOGIN_MARKER_KEY);}catch(_err){}
      forceNotesOff();
    }else if(event==='SIGNED_IN'&&uid){
      let previous='';
      try{previous=sessionStorage.getItem(LOGIN_MARKER_KEY)||'';}catch(_err){}
      if(previous!==uid){
        try{sessionStorage.setItem(LOGIN_MARKER_KEY,uid);}catch(_err){}
        forceNotesOff();
      }
    }
    setTimeout(refreshIdentity,0);
  }

  function elementVisible(el){
    if(!notesVisible()||!el?.isConnected) return false;
    const panel=el.closest('.admin-chat-panel');
    const container=el.closest('.admin-chat-messages');
    if(!panel||!container||getComputedStyle(panel).display==='none') return false;
    const er=el.getBoundingClientRect();
    const cr=container.getBoundingClientRect();
    const top=Math.max(er.top,cr.top,0);
    const bottom=Math.min(er.bottom,cr.bottom,window.innerHeight);
    const visible=Math.max(0,bottom-top);
    return er.height>0 && visible/er.height>=0.6;
  }

  function visibleUnreadIds(){
    const ids=[];
    document.querySelectorAll('.admin-chat-message.is-unread[data-admin-message-id]').forEach(el=>{
      if(elementVisible(el)) ids.push(String(el.dataset.adminMessageId||''));
    });
    return [...new Set(ids.filter(Boolean))];
  }

  async function markRead(ids){
    if(marking||!session?.user||!editor) return;
    const unique=[...new Set(ids.map(String).filter(Boolean))];
    if(!unique.length) return;
    marking=true;
    try{
      const rows=unique.map(id=>({
        message_id:id,
        reader_user_id:currentUserId(),
        reader_email:currentEmail(),
        reader_name:String(editor.display_name||'').trim()||'Beheerder',
        read_at:new Date().toISOString()
      }));
      const {error}=await client.from('portfolio_admin_message_reads').upsert(rows,{
        onConflict:'message_id,reader_user_id',
        ignoreDuplicates:true
      });
      if(error && error.code!=='23505') throw error;
      unique.forEach(id=>seenSince.delete(id));
    }catch(err){
      console.error('Leesstatus bijwerken mislukt:',err);
    }finally{
      marking=false;
      queueScan(100);
    }
  }

  function scheduleDue(){
    clearDueTimer();
    if(!seenSince.size) return;
    const now=Date.now();
    let wait=DWELL_MS;
    seenSince.forEach(start=>{wait=Math.min(wait,Math.max(0,DWELL_MS-(now-start)));});
    dueTimer=setTimeout(()=>{
      dueTimer=null;
      scan();
    },Math.max(20,wait));
  }

  function scan(){
    scanQueued=false;
    if(!session?.user||!editor||!notesVisible()){
      resetSeen();
      return;
    }

    const visible=new Set(visibleUnreadIds());
    const now=Date.now();

    [...seenSince.keys()].forEach(id=>{
      if(!visible.has(id)) seenSince.delete(id);
    });
    visible.forEach(id=>{
      if(!seenSince.has(id)) seenSince.set(id,now);
    });

    const due=[];
    seenSince.forEach((start,id)=>{
      if(visible.has(id) && now-start>=DWELL_MS) due.push(id);
    });

    if(due.length){
      markRead(due);
      return;
    }
    scheduleDue();
  }

  function queueScan(delay=0){
    if(scanQueued) return;
    scanQueued=true;
    if(delay){setTimeout(scan,delay);return;}
    requestAnimationFrame(scan);
  }

  async function refreshIdentity(){
    const {data}=await client.auth.getSession();
    session=data?.session||null;
    editor=null;
    resetSeen();

    if(session?.user?.email){
      const {data:row}=await client.from('portfolio_editors')
        .select('display_name,is_active,read_receipts_enabled')
        .ilike('email',currentEmail())
        .maybeSingle();
      if(row?.is_active!==false) editor=row||null;
    }
    queueScan(80);
  }

  document.addEventListener('click',event=>{
    const message=event.target.closest?.('.admin-chat-message.is-unread[data-admin-message-id]');
    if(!message) return;
    if(event.target.closest?.('button,a,input,textarea,select,label')) return;
    const id=String(message.dataset.adminMessageId||'');
    if(id) markRead([id]);
  },true);

  document.addEventListener('scroll',()=>queueScan(),true);
  window.addEventListener('resize',()=>queueScan(),{passive:true});
  window.addEventListener('focus',()=>queueScan(80));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible') queueScan(80);
    else resetSeen();
  });

  client.auth.onAuthStateChange(handleAuthStateChange);
  refreshIdentity();

  channel=client.channel('portfolio-admin-read-enhancements')
    .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_messages'},()=>queueScan(100))
    .on('postgres_changes',{event:'*',schema:'public',table:'portfolio_admin_message_reads'},()=>queueScan(100))
    .subscribe();
})();

(() => {
  'use strict';

  const SUPABASE_URL='https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY='sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  if(!client) return;

  const config={
    feedback:{fieldId:'s9_feedback',title:'Feedback praktijkbegeleider',part:'3'},
    lessonprep:{fieldId:'s17_lesvoorbereidingen',title:'Lesvoorbereidingen',part:'4'}
  };
  let editorCounter=0;

  const style=document.createElement('style');
  style.textContent=`
    .chapter5-standard-overlay{position:fixed;inset:0;z-index:4600;display:grid;place-items:center;padding:16px;pointer-events:none}
    .chapter5-standard-window{position:relative!important;left:auto!important;top:auto!important;width:min(760px,calc(100vw - 32px));max-height:min(82vh,780px);pointer-events:auto}
    .chapter5-standard-window.is-minimized{max-height:none;width:min(760px,calc(100vw - 32px))}
    .chapter5-standard-window.is-minimized .window-body,.chapter5-standard-window.is-minimized .window-footer{display:none}
    .chapter5-standard-list{display:grid;gap:18px}
    .chapter5-standard-entry{display:grid;gap:12px;padding:0 0 18px;border-bottom:1px solid #e4ebe6}
    .chapter5-standard-entry:last-child{border-bottom:0;padding-bottom:2px}
    .chapter5-standard-entry .modal-field input{width:100%;border:1px solid #cbd8d0;border-radius:12px;background:#fff;color:#26352e;font:inherit;padding:11px 12px;box-sizing:border-box}
    .chapter5-standard-entry .modal-field input:focus{outline:2px solid rgba(31,94,74,.18);border-color:#6e9985}
    .chapter5-standard-remove{justify-self:end;border:0;background:transparent;color:#8d5148;padding:2px 0;font:inherit;font-size:.76rem;font-weight:800;cursor:pointer}
    .chapter5-standard-add{justify-self:start;margin-top:2px}
    .chapter5-standard-message{margin:0;min-height:18px;color:#66746e;font-size:.78rem}
    .chapter5-standard-message.error{color:#9a4138}
    .chapter5-repeat-entry .chapter5-rich-body{color:#53635b;line-height:1.55;overflow-wrap:anywhere}
    .chapter5-repeat-entry .chapter5-rich-body p{margin:.25em 0}
    .chapter5-repeat-entry .chapter5-rich-body ul,.chapter5-repeat-entry .chapter5-rich-body ol{margin:.35em 0 .35em 1.4em;padding-left:.7em}
    .chapter5-repeat-entry .chapter5-rich-body a[data-portfolio-file-id],.chapter5-repeat-entry .chapter5-rich-body a[data-portfolio-file-ids]{color:#1f5e4a;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px;font-weight:750}
    @media(max-width:700px){.chapter5-standard-overlay{padding:8px}.chapter5-standard-window{width:calc(100vw - 16px)!important;max-height:90vh}}
  `;
  document.head.appendChild(style);

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function parseEntries(raw){
    const value=String(raw||'').trim();
    if(!value) return [];
    try{
      const parsed=JSON.parse(value);
      const list=Array.isArray(parsed)?parsed:Array.isArray(parsed?.entries)?parsed.entries:[];
      return list.map(item=>({title:String(item?.title||'').trim(),body:String(item?.body||'').trim()})).filter(item=>item.title||item.body);
    }catch(_err){
      return [{title:'',body:value}];
    }
  }

  function serializeEntries(list){
    const clean=list.map(item=>({title:String(item?.title||'').trim(),body:String(item?.body||'').trim()})).filter(item=>item.title||item.body);
    return clean.length?JSON.stringify({version:1,entries:clean}):'';
  }

  function currentEntries(category){
    const fieldId=config[category]?.fieldId;
    if(!fieldId) return [];
    try{
      if(typeof state!=='undefined' && state?.values) return parseEntries(state.values[fieldId]);
    }catch(_err){}
    return [];
  }

  function richBody(value){
    const rich=window.portfolioRichText;
    if(rich?.isRich?.(value)) return rich.sanitize(value);
    return esc(value).replace(/\n/g,'<br>');
  }

  function makeEntry(item={title:'',body:''}){
    const section=document.createElement('section');
    section.className='chapter5-standard-entry';
    const key=`chapter5-repeat-${Date.now()}-${++editorCounter}`;
    section.innerHTML=`
      <div class="modal-field">
        <label>Titel<small>Geef deze invoer een korte, duidelijke titel.</small></label>
        <input type="text" maxlength="200" data-repeat-title value="${esc(item.title||'')}" placeholder="Typ hier de titel">
      </div>
      <div class="modal-field">
        <label>Hoofdtekst<small>Werk de invoer hier uit. Je kunt dezelfde opmaak gebruiken als in de andere portfolio-onderdelen.</small></label>
        <textarea data-modal-field="${key}" data-repeat-body>${esc(item.body||'')}</textarea>
      </div>
      <button type="button" class="chapter5-standard-remove" data-repeat-remove>Verwijderen</button>`;
    section.querySelector('[data-repeat-remove]')?.addEventListener('click',()=>{
      const list=section.parentElement;
      if(!list) return;
      if(list.children.length===1){
        section.querySelector('[data-repeat-title]').value='';
        const textarea=section.querySelector('[data-repeat-body]');
        if(textarea){
          textarea.value='';
          textarea.dispatchEvent(new Event('input',{bubbles:true}));
          const editor=section.querySelector('.rich-editor');
          if(editor) editor.innerHTML='';
        }
        section.querySelector('[data-repeat-title]')?.focus();
      }else{
        section.remove();
      }
    });
    return section;
  }

  function openStandardEditor(category){
    const cfg=config[category];
    if(!cfg || !document.body.classList.contains('can-edit')) return;
    document.querySelector('.chapter5-standard-overlay')?.remove();

    const overlay=document.createElement('div');
    overlay.className='chapter5-standard-overlay';
    overlay.innerHTML=`
      <section class="editor-window chapter5-standard-window" role="dialog" aria-modal="false" aria-label="${esc(cfg.title)}">
        <header class="window-bar">
          <div class="window-title-wrap">
            <span class="window-kicker">Hoofdstuk 05 · onderdeel ${cfg.part}</span>
            <strong>${esc(cfg.title)}</strong>
          </div>
          <div class="window-controls">
            <button class="window-control" data-repeat-minimize type="button" aria-label="Minimaliseren" title="Minimaliseren">−</button>
            <button class="window-control close" data-repeat-close type="button" aria-label="Sluiten" title="Sluiten">×</button>
          </div>
        </header>
        <div class="window-body">
          <p class="window-help">Voeg hier één of meer invoeren toe. Iedere invoer bestaat uit een titel en een hoofdtekst.</p>
          <div class="modal-fields chapter5-standard-list" data-repeat-list></div>
          <button class="text-button chapter5-standard-add" type="button" data-repeat-add>Nieuwe invoer +</button>
          <p class="chapter5-standard-message" data-repeat-message></p>
        </div>
        <footer class="window-footer">
          <span class="window-save-hint" data-repeat-hint>${currentEntries(category).length?'Bestaande invoer geladen.':'Dit onderdeel is nog leeg.'}</span>
          <div class="window-actions">
            <button class="text-button" data-repeat-cancel type="button">Sluiten</button>
            <button class="save-large" data-repeat-save type="button">Opslaan</button>
          </div>
        </footer>
      </section>`;
    document.body.appendChild(overlay);

    const win=overlay.querySelector('.chapter5-standard-window');
    const list=overlay.querySelector('[data-repeat-list]');
    const initial=currentEntries(category);
    (initial.length?initial:[{title:'',body:''}]).forEach(item=>list.appendChild(makeEntry(item)));

    const close=()=>overlay.remove();
    overlay.querySelector('[data-repeat-close]')?.addEventListener('click',close);
    overlay.querySelector('[data-repeat-cancel]')?.addEventListener('click',close);
    overlay.querySelector('[data-repeat-minimize]')?.addEventListener('click',event=>{
      const minimized=win.classList.toggle('is-minimized');
      event.currentTarget.textContent=minimized?'+':'−';
      event.currentTarget.title=minimized?'Herstellen':'Minimaliseren';
      event.currentTarget.setAttribute('aria-label',minimized?'Herstellen':'Minimaliseren');
    });
    overlay.querySelector('[data-repeat-add]')?.addEventListener('click',()=>{
      const item=makeEntry();
      list.appendChild(item);
      item.querySelector('[data-repeat-title]')?.focus();
      item.scrollIntoView({behavior:'smooth',block:'nearest'});
    });

    requestAnimationFrame(()=>list.querySelector('[data-repeat-title]')?.focus());

    overlay.querySelector('[data-repeat-save]')?.addEventListener('click',async event=>{
      const saveButton=event.currentTarget;
      const message=overlay.querySelector('[data-repeat-message]');
      const draft=[...list.querySelectorAll('.chapter5-standard-entry')].map(item=>({
        title:item.querySelector('[data-repeat-title]')?.value?.trim()||'',
        body:item.querySelector('[data-repeat-body]')?.value?.trim()||''
      }));

      if(draft.some(item=>(item.title&&!item.body)||(!item.title&&item.body))){
        message.textContent='Vul bij elke invoer zowel een titel als de hoofdtekst in.';
        message.classList.add('error');
        return;
      }

      const clean=draft.filter(item=>item.title&&item.body);
      saveButton.disabled=true;
      message.classList.remove('error');
      message.textContent='Opslaan…';
      try{
        const {data:sessionData}=await client.auth.getSession();
        if(!sessionData?.session) throw new Error('Je bent niet meer ingelogd. Log opnieuw in.');
        const value=serializeEntries(clean);
        const {error}=await client.from('portfolio_content').upsert([{id:cfg.fieldId,value}],{onConflict:'id'});
        if(error) throw error;

        if(typeof state!=='undefined' && state?.values) state.values[cfg.fieldId]=value;
        if(typeof persistState==='function') persistState(`${cfg.title} opgeslagen op website`);
        else if(typeof setStatus==='function') setStatus(`${cfg.title} opgeslagen op website`,'saved');
        if(typeof renderChapters==='function') renderChapters();
        setTimeout(renderCards,0);
        message.textContent='Opgeslagen.';
        setTimeout(close,300);
      }catch(err){
        console.error(`${cfg.title} opslaan mislukt:`,err);
        message.textContent='Opslaan mislukt: '+String(err?.message||err);
        message.classList.add('error');
        saveButton.disabled=false;
      }
    });
  }

  function renderCards(){
    Object.entries(config).forEach(([category,cfg])=>{
      const cardKey=category==='feedback'?'4-2':'4-3';
      const card=document.querySelector(`[data-topic-card="${cardKey}"]`);
      const content=card?.querySelector('.topic-content');
      if(!card||!content) return;
      const list=currentEntries(category);
      if(!list.length) return;
      const html=`<div class="chapter5-repeat-list">${list.map(item=>`<article class="chapter5-repeat-entry">${item.title?`<h5>${esc(item.title)}</h5>`:''}${item.body?`<div class="chapter5-rich-body">${richBody(item.body)}</div>`:''}</article>`).join('')}</div>`;
      if(content.innerHTML!==html) content.innerHTML=html;
    });
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-repeatable-editor]');
    if(!button) return;
    const category=button.dataset.repeatableEditor;
    if(!config[category]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openStandardEditor(category);
  },true);

  const topics=document.getElementById('topics-5');
  if(topics){
    let queued=false;
    new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        renderCards();
      });
    }).observe(topics,{childList:true,subtree:true});
  }
  setTimeout(renderCards,0);
})();
