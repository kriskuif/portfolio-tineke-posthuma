(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const THEME_CACHE_KEY = 'portfolio-tineke-theme-v1';
  const THEME_ROW_ID = '__portfolio_theme';

  const themes = [
    {id:'natuurlijk',name:'Natuurlijk',description:'Groen, crème en rustig.'},
    {id:'wandelgids',name:'Bos & Blad',description:'Mosgroen, warm papier en bladstructuren.'},
    {id:'tijdschrift',name:'Herfstpad',description:'Roest, koper en goud.'},
    {id:'dagboek',name:'Routekaart',description:'Blauwgroen en topografische lijnen.'},
    {id:'minimal',name:'Duin & Zee',description:'Zand, lucht en zeeblauw.'}
  ];
  const allowed = new Set(themes.map(theme => theme.id));
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  let saveInProgress = false;

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

  function currentTheme(){
    const value = document.documentElement.dataset.portfolioTheme;
    return allowed.has(value) ? value : 'natuurlijk';
  }

  function applyTheme(id,{cache=true}={}){
    const next = allowed.has(id) ? id : 'natuurlijk';
    document.documentElement.dataset.portfolioTheme = next;
    if(document.body) document.body.dataset.portfolioTheme = next;
    if(cache){
      try{ localStorage.setItem(THEME_CACHE_KEY,next); }catch(_err){}
    }
    syncTopbar(next);
    return next;
  }

  function adjacentTheme(direction){
    const currentIndex = Math.max(0,themes.findIndex(theme => theme.id === currentTheme()));
    const nextIndex = (currentIndex + direction + themes.length) % themes.length;
    return themes[nextIndex].id;
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

  function syncTopbar(id=currentTheme()){
    const control = document.querySelector('[data-theme-switcher]');
    if(!control) return;
    const info = themeInfo(id);
    const name = control.querySelector('[data-theme-name]');
    const description = control.querySelector('[data-theme-desc]');
    if(name) name.textContent = info.name;
    if(description) description.textContent = info.description;
    control.querySelectorAll('[data-theme-menu-choice]').forEach(button => {
      const active = button.dataset.themeMenuChoice === id;
      button.classList.toggle('active',active);
      button.setAttribute('aria-selected',String(active));
    });
  }

  function setBusy(busy,message=''){
    saveInProgress = busy;
    const control = document.querySelector('[data-theme-switcher]');
    if(!control) return;
    control.classList.toggle('saving',busy);
    control.querySelectorAll('button').forEach(button => { button.disabled = busy; });
    const status = control.querySelector('[data-theme-save-status]');
    if(status) status.textContent = message;
  }

  async function chooseTheme(next){
    if(!allowed.has(next) || saveInProgress) return;
    if(!document.body.classList.contains('can-edit')) return;

    const previous = currentTheme();
    if(next === previous) return closeMenu();

    applyTheme(next);
    setBusy(true,'Opslaan…');
    try{
      await saveRemoteTheme(next);
      setBusy(false,'Opgeslagen');
      window.setTimeout(() => {
        const status = document.querySelector('[data-theme-save-status]');
        if(status) status.textContent = '';
      },1300);
      closeMenu();
    }catch(err){
      console.error('Thema opslaan mislukt:',err);
      applyTheme(previous);
      setBusy(false,'Opslaan mislukt');
    }
  }

  function openMenu(){
    const control = document.querySelector('[data-theme-switcher]');
    const menu = control?.querySelector('[data-theme-menu]');
    const currentButton = control?.querySelector('[data-theme-current]');
    if(!control || !menu) return;
    control.classList.add('open');
    menu.hidden = false;
    currentButton?.setAttribute('aria-expanded','true');
  }

  function closeMenu(){
    const control = document.querySelector('[data-theme-switcher]');
    const menu = control?.querySelector('[data-theme-menu]');
    const currentButton = control?.querySelector('[data-theme-current]');
    if(!control || !menu) return;
    control.classList.remove('open');
    menu.hidden = true;
    currentButton?.setAttribute('aria-expanded','false');
  }

  function toggleMenu(){
    const control = document.querySelector('[data-theme-switcher]');
    if(control?.classList.contains('open')) closeMenu();
    else openMenu();
  }

  function injectTopbarSwitcher(){
    const topbar = document.querySelector('.topbar');
    if(!topbar || topbar.querySelector('[data-theme-switcher]')) return;

    const control = document.createElement('div');
    control.className = 'theme-switcher';
    control.dataset.themeSwitcher = '';
    control.innerHTML = `
      <button class="theme-step" type="button" data-theme-prev aria-label="Vorig thema" title="Vorig thema">‹</button>
      <button class="theme-current" type="button" data-theme-current aria-haspopup="listbox" aria-expanded="false">
        <span class="theme-caption">Thema</span>
        <strong data-theme-name>Natuurlijk</strong>
      </button>
      <button class="theme-step" type="button" data-theme-next aria-label="Volgend thema" title="Volgend thema">›</button>
      <span class="theme-save-status" data-theme-save-status aria-live="polite"></span>
      <div class="theme-top-menu" data-theme-menu role="listbox" aria-label="Kies thema" hidden>
        ${themes.map(theme => `
          <button type="button" class="theme-top-choice" role="option" data-theme-menu-choice="${theme.id}" aria-selected="false">
            <span class="theme-swatch ${theme.id}" aria-hidden="true"></span>
            <span><strong>${theme.name}</strong><small>${theme.description}</small></span>
          </button>
        `).join('')}
      </div>
    `;

    const manageButton = topbar.querySelector('.manage-btn');
    if(manageButton) topbar.insertBefore(control,manageButton);
    else topbar.appendChild(control);

    control.querySelector('[data-theme-prev]')?.addEventListener('click',() => chooseTheme(adjacentTheme(-1)));
    control.querySelector('[data-theme-next]')?.addEventListener('click',() => chooseTheme(adjacentTheme(1)));
    control.querySelector('[data-theme-current]')?.addEventListener('click',toggleMenu);
    control.querySelectorAll('[data-theme-menu-choice]').forEach(button => {
      button.addEventListener('click',() => chooseTheme(button.dataset.themeMenuChoice));
    });

    document.addEventListener('pointerdown',event => {
      if(!control.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown',event => {
      if(event.key === 'Escape') closeMenu();
    });

    syncTopbar(currentTheme());
  }

  const initial = allowed.has(document.documentElement.dataset.portfolioTheme)
    ? document.documentElement.dataset.portfolioTheme
    : cachedTheme();
  applyTheme(initial,{cache:false});
  injectTopbarSwitcher();
  loadRemoteTheme();

  window.PortfolioThemes = {
    list:themes.map(theme => ({...theme})),
    current:currentTheme,
    apply:applyTheme,
    choose:chooseTheme
  };
})();