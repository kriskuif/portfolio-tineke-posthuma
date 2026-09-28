(() => {
  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const BUCKET = 'portfolio-assets';
  const OBJECT_PATH = 'profile/tineke-profile';
  const PASSPORT_OBJECT_PATH = 'profile/tineke-passphoto';
  const DEFAULT_SRC = 'https://yvxiuslhypwbjkpmtfwy.supabase.co/storage/v1/object/public/portfolio-assets/profile/tineke-profile';
  const MAX_BYTES = 5 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const style = document.createElement('style');
  style.textContent = `
    .passport-photo-host{display:flow-root}
    .passport-photo-slot{float:left;position:relative;width:220px;aspect-ratio:4/5;margin:2px 22px 14px 0;border:1px solid #cfddd4;border-radius:15px;overflow:hidden;background:linear-gradient(145deg,#f4f7f5,#e8efeb);box-shadow:0 6px 18px rgba(35,55,47,.07)}
    .passport-photo-slot img{display:block;width:100%;height:100%;object-fit:cover;background:#eef3ef}
    .passport-photo-button{position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;background:transparent;color:#456055;font:inherit;cursor:pointer}
    .passport-photo-placeholder{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;color:#63746c;font-size:.78rem;font-weight:800;line-height:1.45}
    .passport-photo-placeholder span{display:grid;gap:8px;place-items:center}
    .passport-photo-placeholder b{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#dfeae3;color:#28634d;font-size:1.35rem;font-weight:700}
    .passport-photo-edit-hint{position:absolute;left:9px;right:9px;bottom:9px;padding:7px 9px;border-radius:9px;background:rgba(24,72,56,.9);color:#fff;text-align:center;font-size:.7rem;font-weight:850;opacity:0;transform:translateY(4px);transition:.16s ease;pointer-events:none}
    body.can-edit .passport-photo-slot:hover .passport-photo-edit-hint,body.can-edit .passport-photo-slot:focus-within .passport-photo-edit-hint{opacity:1;transform:translateY(0)}
    body:not(.can-edit) .passport-photo-button{cursor:default;pointer-events:none}
    body:not(.can-edit) .passport-photo-edit-hint{display:none}
    body:not(.can-edit) .passport-photo-slot.is-empty{display:none}
    .passport-photo-status{position:absolute;left:9px;right:9px;top:9px;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.93);color:#405047;text-align:center;font-size:.68rem;font-weight:800;box-shadow:0 3px 12px rgba(35,55,47,.1)}
    @media(max-width:700px){.passport-photo-slot{width:150px;margin-right:15px;margin-bottom:10px;border-radius:13px}}
  `;
  document.head.appendChild(style);

  function heroImage(){
    return document.querySelector('.hero-photo-card img');
  }

  function prepareCorsImage(img){
    if (!img) return img;
    img.crossOrigin = 'anonymous';
    img.setAttribute('crossorigin', 'anonymous');
    return img;
  }

  function setCorsSrc(img, url){
    if (!img || !url) return;
    prepareCorsImage(img);
    img.src = url;
  }

  function publicUrl(cacheBust = ''){
    const { data } = client.storage.from(BUCKET).getPublicUrl(OBJECT_PATH);
    const base = data?.publicUrl || '';
    if (!base) return '';
    return cacheBust ? `${base}?v=${encodeURIComponent(cacheBust)}` : base;
  }

  function passportPublicUrl(cacheBust = ''){
    const { data } = client.storage.from(BUCKET).getPublicUrl(PASSPORT_OBJECT_PATH);
    const base = data?.publicUrl || '';
    if (!base) return '';
    return cacheBust ? `${base}?v=${encodeURIComponent(cacheBust)}` : base;
  }

  function showStoredPhoto(cacheBust = Date.now()){
    const img = heroImage();
    if (!img) return;
    prepareCorsImage(img);
    const url = publicUrl(cacheBust);
    if (!url) return;
    const probe = prepareCorsImage(new Image());
    probe.onload = () => {
      setCorsSrc(img, url);
      img.dataset.profilePhotoSource = 'supabase';
    };
    probe.onerror = () => {
      img.removeAttribute('src');
      img.alt = 'Profielfoto tijdelijk niet beschikbaar';
    };
    probe.src = url;
  }

  function setPassportSlotImage(slot, url){
    if (!slot || !url) return;
    const img = slot.querySelector('[data-passport-image]');
    const placeholder = slot.querySelector('[data-passport-placeholder]');
    if (!img) return;
    setCorsSrc(img, url);
    img.hidden = false;
    if (placeholder) placeholder.hidden = true;
    slot.classList.remove('is-empty');
  }

  function loadPassportPhoto(slot, cacheBust = Date.now()){
    if (!slot) return;
    const url = passportPublicUrl(cacheBust);
    if (!url) return;
    const probe = prepareCorsImage(new Image());
    probe.onload = () => setPassportSlotImage(slot, url);
    probe.onerror = () => {
      slot.classList.add('is-empty');
      const img = slot.querySelector('[data-passport-image]');
      const placeholder = slot.querySelector('[data-passport-placeholder]');
      if (img) {
        img.hidden = true;
        img.removeAttribute('src');
      }
      if (placeholder) placeholder.hidden = false;
    };
    probe.src = url;
  }

  async function uploadPassportPhoto(slot, file){
    if (!file || !slot) return;
    const status = slot.querySelector('[data-passport-status]');
    const input = slot.querySelector('[data-passport-input]');
    if (!ALLOWED_TYPES.has(file.type)) {
      if (status) {
        status.hidden = false;
        status.textContent = 'Kies een JPG-, PNG- of WebP-afbeelding.';
      }
      if (input) input.value = '';
      return;
    }
    if (file.size > MAX_BYTES) {
      if (status) {
        status.hidden = false;
        status.textContent = 'De foto is groter dan 5 MB.';
      }
      if (input) input.value = '';
      return;
    }

    if (status) {
      status.hidden = false;
      status.textContent = 'Pasfoto uploaden…';
    }

    try {
      const { error } = await client.storage.from(BUCKET).upload(PASSPORT_OBJECT_PATH, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '60'
      });
      if (error) throw error;
      setPassportSlotImage(slot, passportPublicUrl(Date.now()));
      if (status) status.textContent = 'Pasfoto opgeslagen.';
      setTimeout(() => {
        if (status) status.hidden = true;
      }, 1400);
    } catch (err) {
      console.error('Pasfoto uploaden mislukt:', err);
      if (status) status.textContent = `Uploaden mislukt: ${err?.message || 'onbekende fout'}`;
    } finally {
      if (input) input.value = '';
    }
  }

  function ensurePassportPhotoSlot(){
    const card = document.querySelector('[data-topic-card="0-0"]');
    if (!card || card.querySelector('[data-passport-photo-slot]')) return;
    const content = card.querySelector('.topic-content');
    if (!content) return;
    const host = content.querySelector('.saved-field') || content;
    host.classList.add('passport-photo-host');

    const slot = document.createElement('div');
    slot.className = 'passport-photo-slot is-empty';
    slot.dataset.passportPhotoSlot = '';
    slot.innerHTML = `
      <img data-passport-image crossorigin="anonymous" alt="Pasfoto Tineke Posthuma" hidden>
      <div class="passport-photo-placeholder" data-passport-placeholder><span><b>＋</b>Pasfoto toevoegen</span></div>
      <button class="passport-photo-button" type="button" data-passport-button aria-label="Pasfoto uploaden of wijzigen"></button>
      <span class="passport-photo-edit-hint">Pasfoto uploaden / wijzigen</span>
      <span class="passport-photo-status" data-passport-status hidden></span>
      <input type="file" accept="image/jpeg,image/png,image/webp" data-passport-input hidden>
    `;
    host.prepend(slot);

    const button = slot.querySelector('[data-passport-button]');
    const input = slot.querySelector('[data-passport-input]');
    button?.addEventListener('click', () => {
      if (!document.body.classList.contains('can-edit')) return;
      input?.click();
    });
    input?.addEventListener('change', () => uploadPassportPhoto(slot, input.files?.[0] || null));
    loadPassportPhoto(slot);
  }

  function injectSettingsCard(overlay){
    if (!overlay || overlay.querySelector('[data-profile-photo-card]')) return;
    const grid = overlay.querySelector('.settings-grid');
    if (!grid) return;

    const currentSrc = heroImage()?.src || DEFAULT_SRC;
    const card = document.createElement('article');
    card.className = 'settings-card wide';
    card.dataset.profilePhotoCard = '';
    card.innerHTML = `
      <h4>Profielfoto</h4>
      <p>Wijzig de foto die bovenaan het portfolio staat. De opgeslagen foto wordt centraal bewaard en is daarna voor iedere bezoeker zichtbaar.</p>
      <div style="display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;align-items:start">
        <div>
          <img data-profile-preview crossorigin="anonymous" src="${currentSrc}" alt="Voorbeeld profielfoto" style="display:block;width:150px;max-height:190px;object-fit:cover;border-radius:14px;border:1px solid #dfe5df;background:#fff">
        </div>
        <div class="settings-form">
          <label>Nieuwe foto
            <input type="file" accept="image/jpeg,image/png,image/webp" data-profile-file>
          </label>
          <small style="color:#66746e;line-height:1.45">JPG, PNG of WebP, maximaal 5 MB. Controleer het voorbeeld voordat je opslaat.</small>
          <div class="settings-actions" style="margin-top:4px">
            <button class="settings-btn" type="button" data-save-profile-photo disabled>Foto opslaan</button>
          </div>
          <p class="settings-message" data-profile-message></p>
        </div>
      </div>`;

    const exportCard = grid.querySelector('[data-export-html]')?.closest('.settings-card');
    if (exportCard) grid.insertBefore(card, exportCard);
    else grid.appendChild(card);

    const input = card.querySelector('[data-profile-file]');
    const preview = prepareCorsImage(card.querySelector('[data-profile-preview]'));
    const save = card.querySelector('[data-save-profile-photo]');
    const message = card.querySelector('[data-profile-message]');
    let selected = null;
    let previewObjectUrl = null;

    input?.addEventListener('change', () => {
      selected = input.files?.[0] || null;
      save.disabled = true;
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
      if (!selected) {
        setCorsSrc(preview, heroImage()?.src || DEFAULT_SRC);
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
        const hero = heroImage();
        if (hero) {
          setCorsSrc(hero, url);
          hero.dataset.profilePhotoSource = 'supabase';
        }
        setCorsSrc(preview, url);
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
        save.disabled = true;
      }
    });

  }

  const observer = new MutationObserver(() => {
    document.querySelectorAll('.settings-overlay').forEach(injectSettingsCard);
    ensurePassportPhotoSlot();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  prepareCorsImage(heroImage());
  showStoredPhoto();
  ensurePassportPhotoSlot();
})();