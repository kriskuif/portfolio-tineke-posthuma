(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const THEME_CACHE_KEY = 'portfolio-tineke-theme-v1';
  const THEME_ROW_ID = '__portfolio_theme';

  const themes = [
    {
      id:'natuurlijk',
      name:'Natuurlijk',
      description:'De huidige rustige groene portfolio-opmaak.'
    },
    {
      id:'wandelgids',
      name:'Bos & Blad',
      description:'Diepgroen, mos en bladstructuren met klassieke typografie.'
    },
    {
      id:'tijdschrift',
      name:'Herfstpad',
      description:'Roest, koper en goud met een warme herfstachtige sfeer.'
    },
    {
      id:'dagboek',
      name:'Routekaart',
      description:'Koel blauwgroen met topografische lijnen en moderne typografie.'
    },
    {
      id:'minimal',
      name:'Duin & Zee',
      description:'Zand, lucht en zeeblauw met een lichte kustsfeer.'
    }
  ];
  const allowed = new Set(themes.map(theme => theme.id));
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);

  function cachedTheme(){
    try{
      const value = localStorage.getItem(THEME_CACHE_KEY);
      return allowed.has(value) ? value : 'natuurlijk';
    }catch(_err){
      return 'natuurlijk';
    }
  }

  function themeInfo(id){
    return themes.find(theme => theme.id === id) || themes[0];
  }

  function applyTheme(id,{cache=true}={}){
    const next = allowed.has(id) ? id : 'natuurlijk';
    document.documentElement.dataset.portfolioTheme = next;
    if(document.body) document.body.dataset.portfolioTheme = next;
    if(cache){
      try{ localStorage.setItem(THEME_CACHE_KEY,next); }catch(_err){}
    }
    document.querySelectorAll('[data-theme-control]').forEach(control => syncControl(control,next));
    return next;
  }

  function syncControl(control,id){
    const info = themeInfo(id);
    const current = control.querySelector('[data-theme-current]');
    const detail = control.querySelector('[data-theme-description]');
    if(current) current.textContent = info.name;
    if(detail) detail.textContent = info.description;
    control.querySelectorAll('[data-theme-choice]').forEach(button => {
      const active = button.dataset.themeChoice === id;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  async function loadRemoteTheme(){
    if(!client) return;
    try{
      const {data,error} = await client
        .from('portfolio_content')
        .select('id,value')
        .eq('id',THEME_ROW_ID)
        .maybeSingle();
      if(error) throw error;
      if(data?.value && allowed.has(data.value)) applyTheme(data.value);
    }catch(err){
      console.warn('Thema kon niet online worden geladen:',err);
    }
  }

  async function saveRemoteTheme(id){
    if(!client) throw new Error('Online opslag is niet beschikbaar.');
    const {data:sessionData} = await client.auth.getSession();
    if(!sessionData?.session) throw new Error('Log eerst in als beheerder.');

    const {error} = await client
      .from('portfolio_content')
      .upsert([{id:THEME_ROW_ID,value:id}],{onConflict:'id'});
    if(error) throw error;
  }

  function previewMarkup(id){
    return '<div class="theme-preview '+id+'" aria-hidden="true"><i></i><div class="theme-preview-main"><span class="theme-preview-line"></span><span class="theme-preview-line" style="width:68%"></span><span class="theme-preview-card"></span></div></div>';
  }

  function injectThemeControl(overlay){
    const body = overlay?.querySelector('.settings-window-body');
    if(!body || body.querySelector('[data-theme-control]')) return;

    const currentId = allowed.has(document.documentElement.dataset.portfolioTheme)
      ? document.documentElement.dataset.portfolioTheme
      : cachedTheme();
    const current = themeInfo(currentId);

    const control = document.createElement('div');
    control.className = 'theme-control';
    control.dataset.themeControl = '';
    control.innerHTML = `
      <button class="theme-trigger" type="button" data-theme-trigger aria-expanded="false">
        <span class="theme-trigger-icon">◐</span>
        <span class="theme-trigger-copy">
          <strong>Thema's · <span data-theme-current>${current.name}</span></strong>
          <span data-theme-description>${current.description}</span>
        </span>
        <span class="theme-trigger-arrow" aria-hidden="true">⌄</span>
      </button>
      <div class="theme-palette" data-theme-palette>
        <div class="theme-palette-grid">
          ${themes.map(theme => `
            <button class="theme-choice" type="button" data-theme-choice="${theme.id}" aria-pressed="${theme.id===currentId?'true':'false'}">
              ${previewMarkup(theme.id)}
              <strong>${theme.name}</strong>
              <small>${theme.description}</small>
            </button>
          `).join('')}
        </div>
        <div class="theme-save-state" data-theme-state>Kies een stijl; de basislay-out blijft hetzelfde en alleen de visuele sfeer verandert.</div>
      </div>
    `;
    body.insertBefore(control,body.firstChild);

    const trigger = control.querySelector('[data-theme-trigger]');
    const state = control.querySelector('[data-theme-state]');
    trigger?.addEventListener('click',() => {
      const open = control.classList.toggle('open');
      trigger.setAttribute('aria-expanded',String(open));
    });

    control.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click',async() => {
        if(!document.body.classList.contains('can-edit')){
          if(state) state.textContent = 'Alleen een beheerder kan het thema wijzigen.';
          return;
        }
        const next = button.dataset.themeChoice;
        if(!allowed.has(next)) return;

        const previous = allowed.has(document.documentElement.dataset.portfolioTheme)
          ? document.documentElement.dataset.portfolioTheme
          : 'natuurlijk';

        applyTheme(next);
        if(state) state.textContent = 'Thema opslaan…';
        control.querySelectorAll('[data-theme-choice]').forEach(choice => choice.disabled = true);
        try{
          await saveRemoteTheme(next);
          if(state) state.textContent = 'Opgeslagen. Dit thema is nu de openbare standaard.';
          setTimeout(() => {
            control.classList.remove('open');
            trigger?.setAttribute('aria-expanded','false');
          },450);
        }catch(err){
          console.error('Thema opslaan mislukt:',err);
          applyTheme(previous);
          if(state) state.textContent = 'Opslaan mislukt: '+(err?.message || 'onbekende fout');
        }finally{
          control.querySelectorAll('[data-theme-choice]').forEach(choice => choice.disabled = false);
        }
      });
    });

    syncControl(control,currentId);
  }

  const initial = allowed.has(document.documentElement.dataset.portfolioTheme)
    ? document.documentElement.dataset.portfolioTheme
    : cachedTheme();
  applyTheme(initial,{cache:false});

  const observer = new MutationObserver(() => {
    document.querySelectorAll('.settings-overlay').forEach(injectThemeControl);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  loadRemoteTheme();

  window.PortfolioThemes = {
    list:themes.map(theme => ({...theme})),
    current:() => document.documentElement.dataset.portfolioTheme || 'natuurlijk',
    apply:applyTheme
  };
})();