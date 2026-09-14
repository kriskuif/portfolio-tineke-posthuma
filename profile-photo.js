(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET = 'portfolio-assets';
  const OBJECT_PATH = 'profile/tineke-profile';
  const FALLBACK_SRC = 'assets/images/tineke-met-zoon.jpg?v=20260913-2145';
  const MAX_BYTES = 5 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  function heroImage(){
    return document.querySelector('.hero-photo-card img');
  }

  function publicUrl(cacheBust = ''){
    const { data } = client.storage.from(BUCKET).getPublicUrl(OBJECT_PATH);
    const base = data?.publicUrl || '';
    if (!base) return '';
    return cacheBust ? `${base}?v=${encodeURIComponent(cacheBust)}` : base;
  }

  function showStoredPhoto(cacheBust = Date.now()){
    const img = heroImage();
    if (!img) return;
    const url = publicUrl(cacheBust);
    if (!url) return;
    const probe = new Image();
    probe.onload = () => {
      img.src = url;
      img.dataset.profilePhotoSource = 'supabase';
    };
    probe.onerror = () => {
      if (!img.dataset.profilePhotoSource) img.src = FALLBACK_SRC;
    };
    probe.src = url;
  }

  function restoreFallback(){
    const img = heroImage();
    if (!img) return;
    img.src = FALLBACK_SRC;
    delete img.dataset.profilePhotoSource;
  }

  function injectSettingsCard(overlay){
    if (!overlay || overlay.querySelector('[data-profile-photo-card]')) return;
    const grid = overlay.querySelector('.settings-grid');
    if (!grid) return;

    const currentSrc = heroImage()?.src || FALLBACK_SRC;
    const card = document.createElement('article');
    card.className = 'settings-card wide';
    card.dataset.profilePhotoCard = '';
    card.innerHTML = `
      <h4>Profielfoto</h4>
      <p>Wijzig de foto die bovenaan het portfolio staat. De opgeslagen foto wordt centraal bewaard en is daarna voor iedere bezoeker zichtbaar.</p>
      <div style="display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;align-items:start">
        <div>
          <img data-profile-preview src="${currentSrc}" alt="Voorbeeld profielfoto" style="display:block;width:150px;max-height:190px;object-fit:cover;border-radius:14px;border:1px solid #dfe5df;background:#fff">
        </div>
        <div class="settings-form">
          <label>Nieuwe foto
            <input type="file" accept="image/jpeg,image/png,image/webp" data-profile-file>
          </label>
          <small style="color:#66746e;line-height:1.45">JPG, PNG of WebP, maximaal 5 MB. Controleer het voorbeeld voordat je opslaat.</small>
          <div class="settings-actions" style="margin-top:4px">
            <button class="settings-btn" type="button" data-save-profile-photo disabled>Foto opslaan</button>
            <button class="settings-btn secondary" type="button" data-reset-profile-photo>Standaardfoto herstellen</button>
          </div>
          <p class="settings-message" data-profile-message></p>
        </div>
      </div>`;

    const exportCard = grid.querySelector('[data-export-html]')?.closest('.settings-card');
    if (exportCard) grid.insertBefore(card, exportCard);
    else grid.appendChild(card);

    const input = card.querySelector('[data-profile-file]');
    const preview = card.querySelector('[data-profile-preview]');
    const save = card.querySelector('[data-save-profile-photo]');
    const reset = card.querySelector('[data-reset-profile-photo]');
    const message = card.querySelector('[data-profile-message]');
    let selected = null;
    let previewObjectUrl = null;

    input?.addEventListener('change', () => {
      selected = input.files?.[0] || null;
      save.disabled = true;
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
      if (!selected) {
        preview.src = heroImage()?.src || FALLBACK_SRC;
        message.textContent = '';
        return;
      }
      if (!ALLOWED_TYPES.has(selected.type)) {
        message.textContent = 'Kies een JPG-, PNG- of WebP-afbeelding.';
        input.value = '';
        selected = null;
        return;
      }
      if (selected.size > MAX_BYTES) {
        message.textContent = 'Deze afbeelding is groter dan 5 MB. Kies een kleinere afbeelding.';
        input.value = '';
        selected = null;
        return;
      }
      previewObjectUrl = URL.createObjectURL(selected);
      preview.src = previewObjectUrl;
      save.disabled = false;
      message.textContent = 'Voorbeeld geladen. Klik op “Foto opslaan” om deze voor iedereen te publiceren.';
    });

    save?.addEventListener('click', async () => {
      if (!selected) return;
      save.disabled = true;
      input.disabled = true;
      reset.disabled = true;
      message.textContent = 'Foto uploaden…';
      try {
        const { error } = await client.storage.from(BUCKET).upload(OBJECT_PATH, selected, {
          upsert: true,
          contentType: selected.type,
          cacheControl: '60'
        });
        if (error) throw error;
        const stamp = Date.now();
        const url = publicUrl(stamp);
        if (heroImage()) {
          heroImage().src = url;
          heroImage().dataset.profilePhotoSource = 'supabase';
        }
        preview.src = url;
        input.value = '';
        selected = null;
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
        message.textContent = 'De profielfoto is opgeslagen en is nu centraal zichtbaar voor bezoekers.';
      } catch (err) {
        console.error(err);
        message.textContent = `Opslaan is mislukt: ${err?.message || 'onbekende fout'}`;
      } finally {
        input.disabled = false;
        reset.disabled = false;
        save.disabled = true;
      }
    });

    reset?.addEventListener('click', async () => {
      const approved = window.confirm('De centraal opgeslagen profielfoto wordt verwijderd. Daarna wordt de oorspronkelijke standaardfoto weer voor iedereen getoond. Doorgaan?');
      if (!approved) return;
      save.disabled = true;
      input.disabled = true;
      reset.disabled = true;
      message.textContent = 'Standaardfoto herstellen…';
      try {
        const { error } = await client.storage.from(BUCKET).remove([OBJECT_PATH]);
        if (error) throw error;
        restoreFallback();
        preview.src = heroImage()?.src || FALLBACK_SRC;
        input.value = '';
        selected = null;
        message.textContent = 'De standaardfoto is hersteld.';
      } catch (err) {
        console.error(err);
        message.textContent = `Herstellen is mislukt: ${err?.message || 'onbekende fout'}`;
      } finally {
        input.disabled = false;
        reset.disabled = false;
      }
    });
  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll('.settings-overlay').forEach(injectSettingsCard);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  showStoredPhoto();
})();