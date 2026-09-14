(() => {
  'use strict';

  const SUPABASE_URL = 'https://yvxiuslhypwbjkpmtfwy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_YWB-oyzMgnZqE7YDX1lKyg_HDGcdLeU';
  const VISIBILITY_KEY = 'portfolio-admin-notes-visible-v2';
  const READ_DWELL_MS = 3000;
  const client = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);
  if (!client) return;

  const TARGETS = [
    { selector: '#start', key: 'admin:start', label: 'Start' },
    { selector: '#over', key: 'admin:over', label: 'Over dit portfolio' },
    { selector: '#overzicht', key: 'admin:overview', label: 'Portfolio-overzicht' },
    { selector: '#hoofdstuk-1', key: 'admin:chapter:1', label: 'Profiel & leerdoelen' },
    { selector: '#hoofdstuk-2', key: 'admin:chapter:2', label: 'Doelgroep & doelen' },
    { selector: '#hoofdstuk-3', key: 'admin:chapter:3', label: 'Planning & voorbereiding' },
    { selector: '#hoofdstuk-4', key: 'admin:chapter:4', label: 'Uitvoering & bewijs' },
    { selector: '#hoofdstuk-5', key: 'admin:chapter:5', label: 'Evaluatie & feedback' },
    { selector: '#hoofdstuk-6', key: 'admin:chapter:6', label: 'Ontwikkeling & reflectie' }
  ];
  const RIBBON = { key: 'admin:ribbon', label: 'Lint' };
  const ALLOWED_KEYS = new Set([...TARGETS.map(item => item.key), RIBBON.key]);

  const state = {
    session: null,
    editor: null,
    visible: localStorage.getItem(VISIBILITY_KEY) === '1',
    messages: [],
    reads: [],
    messageById: new Map(),
    readsByMessage: new Map(),
    refreshTimer: null,
    realtime: null,
    initialized: false,
    accessEpoch: 0,
    readPending: new Set(),
    readViewTimers: new Map(),
    visibleCheckScheduled: false
  };

  const style = document.createElement('style');
  style.id = 'admin-notes-v2-style';
  style.textContent = `
    .admin-notes-toggle{margin-left:auto;display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #d6e0da;border-radius:10px;background:#fff;color:#315546;font-size:.78rem;font-weight:800;white-space:nowrap;cursor:pointer;user-select:none}
    .admin-notes-toggle input{width:16px;height:16px;margin:0;accent-color:#1f5e4a;cursor:pointer}
    .admin-unread-badge{display:inline-flex;align-items:center;justify-content:center;min-height:20px;padding:2px 7px;border-radius:999px;background:#b24b45;color:#fff;font-size:.62rem;font-weight:900;line-height:1.15;white-space:nowrap}
    .admin-unread-badge[hidden]{display:none!important}

    .admin-notes-row{display:contents}
    .admin-chat-panel{display:none;min-width:0;border:1px solid #d7e2db;border-radius:14px;background:#f7faf8;overflow:hidden}
    body.admin-notes-visible .admin-chat-panel{display:flex;flex-direction:column}
    body.admin-notes-visible main{width:calc(100% - 32px);max-width:none;margin-left:16px;margin-right:16px}
    body.admin-notes-visible .admin-notes-row{display:grid;grid-template-columns:minmax(0,1180px) minmax(270px,1fr);gap:14px;align-items:stretch;margin:18px 0}
    body.admin-notes-visible .admin-notes-row>.section,
    body.admin-notes-visible .admin-notes-row>.hero{width:100%;margin:0;min-width:0}
    body.admin-notes-visible .admin-section-chat{width:100%;max-width:390px;min-height:0;height:100%;justify-self:stretch}

    .admin-chat-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex:0 0 auto;padding:9px 10px;border-bottom:1px solid #dce6df;background:#edf4ef;color:#285341}
    .admin-chat-head strong{font-size:.73rem;line-height:1.25}
    .admin-chat-count{flex:0 0 auto;font-size:.64rem;font-weight:850;color:#6d7e75}
    .admin-chat-count.has-unread{color:#9a403b}
    .admin-chat-messages{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;overflow:auto;padding:9px 10px;overscroll-behavior:contain;background:#fbfdfb}
    .admin-chat-message{padding:8px 2px;border-bottom:1px solid #e2e9e4;color:#35473e;transition:background .18s ease,border-color .18s ease,box-shadow .18s ease}
    .admin-chat-message:last-child{border-bottom:0}
    .admin-chat-message.is-unread{margin:4px 0;padding:9px 9px;border:1px solid #b8d4c4;border-left:4px solid #2d7459;border-radius:10px;background:#edf7f0;box-shadow:0 2px 7px rgba(31,94,74,.10)}
    .admin-chat-message.is-unread:last-child{border-bottom:1px solid #b8d4c4}
    .admin-chat-message p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.76rem;line-height:1.45}
    .admin-chat-author{font-weight:900;color:#24513f}
    .admin-chat-meta{display:flex;align-items:center;gap:7px;margin-top:3px;color:#7c8982;font-size:.59rem;font-weight:700}
    .admin-chat-new-label{display:inline-flex;align-items:center;padding:2px 6px;border-radius:999px;background:#2d7459;color:#fff;font-size:.56rem;font-weight:900;letter-spacing:.02em;text-transform:uppercase}
    .admin-chat-readby{color:#607a6e}
    .admin-chat-delete{margin-left:auto;border:0;background:transparent;color:#9a5b54;padding:0 2px;cursor:pointer;font:inherit;font-size:.66rem;opacity:.72}
    .admin-chat-delete:hover,.admin-chat-delete:focus-visible{opacity:1;outline:none;text-decoration:underline}
    .admin-chat-compose{display:grid;grid-template-columns:1fr auto;gap:6px;flex:0 0 auto;padding:8px;border-top:1px solid #dce6df;background:#fff}
    .admin-chat-compose textarea{width:100%;height:40px;min-height:40px;resize:none;padding:8px 9px;border:1px solid #cddbd2;border-radius:9px;background:#fff;color:#30443a;font:inherit;font-size:.73rem;line-height:1.3}
    .admin-chat-compose textarea:focus{outline:2px solid rgba(31,94,74,.14);border-color:#85aa97}
    .admin-chat-send{align-self:end;height:40px;border:0;border-radius:9px;background:#1f5e4a;color:#fff;padding:0 10px;font:inherit;font-size:.69rem;font-weight:850;cursor:pointer}
    .admin-chat-send:disabled{opacity:.5;cursor:not-allowed}
    .admin-chat-error{grid-column:1/-1;margin:0;color:#a0443b;font-size:.64rem;min-height:0}

    .admin-ribbon-notes{margin:0 0 12px;border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;max-height:260px}
    .admin-ribbon-notes .admin-chat-head{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.14);color:#fff}
    .admin-ribbon-notes .admin-chat-count{color:rgba(255,255,255,.72)}
    .admin-ribbon-notes .admin-chat-messages{min-height:78px;background:#dcebdc;color:#35473e}
    .admin-ribbon-notes .admin-chat-author{color:#174838}
    .admin-ribbon-notes .admin-chat-compose{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}
    .admin-ribbon-notes .admin-chat-send{background:#f1ead8;color:#174838}

    .admin-name-card .settings-form{margin-top:8px}

    @media(max-width:1789px){
      body.admin-notes-visible main{width:min(1180px,calc(100% - 42px));margin:0 auto;padding:28px 0 90px}
      body.admin-notes-visible .admin-notes-row{display:block;margin:18px 0}
      body.admin-notes-visible .admin-notes-row>.section,
      body.admin-notes-visible .admin-notes-row>.hero{margin:0}
      body.admin-notes-visible .admin-section-chat{width:100%;max-width:none;max-height:330px;margin-top:14px}
      body.admin-notes-visible .admin-section-chat .admin-chat-messages{min-height:100px;max-height:210px}
    }
    @media(max-width:700px){
      .admin-notes-toggle{font-size:.68rem;padding:6px 8px}
      .admin-notes-toggle>span:first-of-type{max-width:118px;white-space:normal;line-height:1.2}
      .admin-chat-compose{grid-template-columns:1fr}
      .admin-chat-send{justify-self:end;padding:0 12px}
    }
  `;
  document.head.appendChild(style);

  function escapeText(value) {
    return String(value ?? '');
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('nl-NL', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  function isApproved() {
    return !!(state.session?.user && state.editor);
  }

  function currentUserId() {
    return state.session?.user?.id || '';
  }

  function currentEmail() {
    return String(state.session?.user?.email || '').trim().toLowerCase();
  }

  function displayNameForMessage(row) {
    const name = String(row?.author_name || '').trim();
    if (name) return name;
    const email = String(row?.author_email || '').trim();
    return email.includes('@') ? email.split('@')[0] : (email || 'Beheerder');
  }

  function readRowsForMessage(id) {
    return state.readsByMessage.get(String(id)) || [];
  }

  function userHasRead(id) {
    const uid = currentUserId();
    return readRowsForMessage(id).some(row => row.reader_user_id === uid);
  }

  function isUnread(row) {
    return !!row && row.created_by !== currentUserId() && !userHasRead(row.id);
  }

  function unreadCount() {
    return state.messages.reduce((count, row) => count + (isUnread(row) ? 1 : 0), 0);
  }

  function unreadCountForTopic(key) {
    return state.messages.reduce((count, row) => count + (row.topic_key === key && isUnread(row) ? 1 : 0), 0);
  }

  function messagesForTopic(key) {
    return state.messages.filter(row => row.topic_key === key);
  }

  function rebuildMaps() {
    state.messageById = new Map(state.messages.map(row => [String(row.id), row]));
    state.readsByMessage = new Map();
    state.reads.forEach(row => {
      const id = String(row.message_id);
      const list = state.readsByMessage.get(id) || [];
      list.push(row);
      state.readsByMessage.set(id, list);
    });
  }

  function ensureToggle() {
    const topbar = document.querySelector('.topbar');
    if (!topbar || !isApproved()) return;
    let toggle = topbar.querySelector('.admin-notes-toggle');
    if (!toggle) {
      toggle = document.createElement('label');
      toggle.className = 'admin-notes-toggle';
      toggle.innerHTML = '<input type="checkbox" data-admin-notes-toggle><span>Beheerdernotities weergeven</span><span class="admin-unread-badge" hidden></span>';
      topbar.appendChild(toggle);
      toggle.querySelector('[data-admin-notes-toggle]')?.addEventListener('change', event => {
        state.visible = !!event.target.checked;
        localStorage.setItem(VISIBILITY_KEY, state.visible ? '1' : '0');
        syncVisibility();
        scheduleVisibleReadCheck();
      });
    }
    const input = toggle.querySelector('[data-admin-notes-toggle]');
    if (input) input.checked = state.visible;
  }

  function ensureRowsAndPanels() {
    if (!isApproved()) return;
    TARGETS.forEach(item => {
      const section = document.querySelector(item.selector);
      if (!section) return;
      let row = section.parentElement?.classList.contains('admin-notes-row') ? section.parentElement : null;
      if (!row) {
        row = document.createElement('div');
        row.className = 'admin-notes-row';
        section.parentNode?.insertBefore(row, section);
        row.appendChild(section);
      }
      let panel = row.querySelector(':scope > .admin-section-chat');
      if (!panel) {
        panel = createPanel(item.key, item.label, 'admin-section-chat');
        row.appendChild(panel);
      }
    });

    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !sidebar.querySelector(':scope > .admin-ribbon-notes')) {
      const panel = createPanel(RIBBON.key, RIBBON.label, 'admin-ribbon-notes');
      const settingsNav = sidebar.querySelector(':scope > .settings-nav');
      const foot = sidebar.querySelector(':scope > .side-foot');
      sidebar.insertBefore(panel, settingsNav || foot || null);
    }
  }

  function createPanel(key, label, extraClass) {
    const panel = document.createElement('aside');
    panel.className = `admin-chat-panel ${extraClass}`;
    panel.dataset.adminChatKey = key;
    panel.setAttribute('aria-label', `Beheerdernotities ${label}`);

    const head = document.createElement('div');
    head.className = 'admin-chat-head';
    const title = document.createElement('strong');
    title.textContent = 'Vragen / opmerkingen / notities';
    const count = document.createElement('span');
    count.className = 'admin-chat-count';
    head.append(title, count);

    const messages = document.createElement('div');
    messages.className = 'admin-chat-messages';
    messages.addEventListener('scroll', scheduleVisibleReadCheck, { passive: true });

    const compose = document.createElement('div');
    compose.className = 'admin-chat-compose';
    const textarea = document.createElement('textarea');
    textarea.rows = 2;
    textarea.maxLength = 4000;
    textarea.placeholder = 'Typ een notitie…';
    textarea.setAttribute('aria-label', 'Nieuwe beheerdernotitie');
    const send = document.createElement('button');
    send.className = 'admin-chat-send';
    send.type = 'button';
    send.textContent = 'Versturen';
    const error = document.createElement('p');
    error.className = 'admin-chat-error';
    error.setAttribute('aria-live', 'polite');
    compose.append(textarea, send, error);

    send.addEventListener('click', () => sendMessage(panel));
    textarea.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage(panel);
      }
    });

    panel.append(head, messages, compose);
    return panel;
  }

  function syncVisibility() {
    const show = isApproved() && state.visible;
    document.body.classList.toggle('admin-notes-visible', show);
    const toggle = document.querySelector('.admin-notes-toggle [data-admin-notes-toggle]');
    if (toggle) toggle.checked = show;
  }

  function renderToggleBadge() {
    const badge = document.querySelector('.admin-notes-toggle .admin-unread-badge');
    if (!badge) return;
    const count = unreadCount();
    badge.hidden = count === 0;
    badge.textContent = count === 1 ? '1 nieuw bericht' : `${count} nieuwe berichten`;
  }

  function renderPanel(panel) {
    const key = panel.dataset.adminChatKey;
    if (!ALLOWED_KEYS.has(key)) return;
    const rows = messagesForTopic(key);
    const unread = unreadCountForTopic(key);
    const count = panel.querySelector('.admin-chat-count');
    if (count) {
      count.classList.toggle('has-unread', unread > 0);
      count.textContent = unread > 0 ? `${unread} nieuw` : (rows.length ? `${rows.length} bericht${rows.length === 1 ? '' : 'en'}` : '');
    }

    const list = panel.querySelector('.admin-chat-messages');
    if (!list) return;
    const wasNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 34;
    list.replaceChildren(...rows.map(createMessageElement));
    if (wasNearBottom) list.scrollTop = list.scrollHeight;
  }

  function createMessageElement(row) {
    const article = document.createElement('article');
    article.className = 'admin-chat-message';
    article.dataset.adminMessageId = String(row.id);
    const unread = isUnread(row);
    if (unread) article.classList.add('is-unread');

    const p = document.createElement('p');
    const author = document.createElement('strong');
    author.className = 'admin-chat-author';
    author.textContent = `${displayNameForMessage(row)}: `;
    const text = document.createTextNode(escapeText(row.message));
    p.append(author, text);

    const meta = document.createElement('div');
    meta.className = 'admin-chat-meta';
    if (unread) {
      const fresh = document.createElement('span');
      fresh.className = 'admin-chat-new-label';
      fresh.textContent = 'Nieuw';
      meta.appendChild(fresh);
    }
    const time = document.createElement('time');
    time.dateTime = row.created_at || '';
    time.textContent = formatTime(row.created_at);
    meta.appendChild(time);

    if (row.created_by === currentUserId()) {
      const readers = [];
      const seen = new Set();
      readRowsForMessage(row.id).forEach(receipt => {
        const name = String(receipt.reader_name || '').trim() || String(receipt.reader_email || '').split('@')[0] || 'Beheerder';
        const k = name.toLocaleLowerCase('nl-NL');
        if (!seen.has(k)) { seen.add(k); readers.push(name); }
      });
      if (readers.length) {
        const receipt = document.createElement('span');
        receipt.className = 'admin-chat-readby';
        receipt.textContent = `✓ Gelezen door ${joinNames(readers)}`;
        meta.appendChild(receipt);
      }

      const del = document.createElement('button');
      del.className = 'admin-chat-delete';
      del.type = 'button';
      del.textContent = 'Verwijderen';
      del.addEventListener('click', () => deleteMessage(row.id));
      meta.appendChild(del);
    }

    article.append(p, meta);
    return article;
  }

  function joinNames(names) {
    if (names.length <= 1) return names[0] || '';
    if (names.length === 2) return `${names[0]} en ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} en ${names[names.length - 1]}`;
  }

  function renderAll() {
    ensureToggle();
    ensureRowsAndPanels();
    document.querySelectorAll('.admin-chat-panel[data-admin-chat-key]').forEach(renderPanel);
    renderToggleBadge();
    syncVisibility();
    scheduleVisibleReadCheck();
  }

  async function sendMessage(panel) {
    if (!isApproved()) return;
    const key = panel.dataset.adminChatKey;
    if (!ALLOWED_KEYS.has(key)) return;
    const textarea = panel.querySelector('.admin-chat-compose textarea');
    const button = panel.querySelector('.admin-chat-send');
    const errorEl = panel.querySelector('.admin-chat-error');
    const message = String(textarea?.value || '').trim();
    if (!message) return;

    if (button) button.disabled = true;
    if (errorEl) errorEl.textContent = '';
    const { error } = await client.from('portfolio_admin_messages').insert({
      topic_key: key,
      message,
      created_by: currentUserId(),
      author_email: currentEmail()
    });
    if (button) button.disabled = false;
    if (error) {
      console.error('Beheerdernotitie versturen mislukt:', error);
      if (errorEl) errorEl.textContent = 'Versturen mislukt. Probeer het opnieuw.';
      return;
    }
    if (textarea) textarea.value = '';
    await refreshData();
  }

  async function deleteMessage(id) {
    const row = state.messageById.get(String(id));
    if (!row || row.created_by !== currentUserId()) return;
    if (!window.confirm('Dit bericht verwijderen?')) return;
    const { error } = await client.from('portfolio_admin_messages').delete().eq('id', id);
    if (error) {
      console.error('Beheerdernotitie verwijderen mislukt:', error);
      return;
    }
    await refreshData();
  }

  function scheduleVisibleReadCheck() {
    if (state.visibleCheckScheduled) return;
    state.visibleCheckScheduled = true;
    requestAnimationFrame(() => {
      state.visibleCheckScheduled = false;
      updateReadViewTimers();
    });
  }

  function elementMostlyVisibleInContainer(el, container) {
    if (!state.visible || document.visibilityState !== 'visible') return false;
    const panel = el.closest('.admin-chat-panel');
    if (!panel || getComputedStyle(panel).display === 'none') return false;
    const er = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const top = Math.max(er.top, cr.top, 0);
    const bottom = Math.min(er.bottom, cr.bottom, window.innerHeight);
    const visible = Math.max(0, bottom - top);
    return er.height > 0 && visible / er.height >= 0.6;
  }

  function clearReadViewTimer(id) {
    const entry = state.readViewTimers.get(String(id));
    if (!entry) return;
    clearTimeout(entry.timer);
    state.readViewTimers.delete(String(id));
  }

  function clearAllReadViewTimers() {
    state.readViewTimers.forEach(entry => clearTimeout(entry.timer));
    state.readViewTimers.clear();
  }

  function updateReadViewTimers() {
    if (!isApproved() || !state.visible || document.visibilityState !== 'visible') {
      clearAllReadViewTimers();
      return;
    }

    const visibleNow = new Map();
    document.querySelectorAll('.admin-chat-panel[data-admin-chat-key]').forEach(panel => {
      const container = panel.querySelector('.admin-chat-messages');
      if (!container) return;
      panel.querySelectorAll('.admin-chat-message[data-admin-message-id]').forEach(el => {
        const id = String(el.dataset.adminMessageId || '');
        const row = state.messageById.get(id);
        if (!row || !isUnread(row) || state.readPending.has(id)) return;
        if (elementMostlyVisibleInContainer(el, container)) visibleNow.set(id, { el, container });
      });
    });

    [...state.readViewTimers.keys()].forEach(id => {
      if (!visibleNow.has(id)) clearReadViewTimer(id);
    });

    visibleNow.forEach(({ el, container }, id) => {
      if (state.readViewTimers.has(id)) return;
      const timer = setTimeout(async () => {
        state.readViewTimers.delete(id);
        const row = state.messageById.get(id);
        if (!row || !isUnread(row) || state.readPending.has(id)) return;
        if (!el.isConnected || !elementMostlyVisibleInContainer(el, container)) return;
        await markMessagesRead([id]);
      }, READ_DWELL_MS);
      state.readViewTimers.set(id, { timer, el, container });
    });
  }

  async function markMessagesRead(ids) {
    if (!isApproved()) return;
    const unique = [...new Set(ids.map(String))].filter(id => {
      const row = state.messageById.get(id);
      return row && isUnread(row) && !state.readPending.has(id);
    });
    if (!unique.length) return;

    unique.forEach(id => {
      clearReadViewTimer(id);
      state.readPending.add(id);
    });
    const rows = unique.map(id => ({
      message_id: id,
      reader_user_id: currentUserId(),
      reader_email: currentEmail(),
      reader_name: String(state.editor?.display_name || '').trim() || 'Beheerder',
      read_at: new Date().toISOString()
    }));

    const { error } = await client.from('portfolio_admin_message_reads').insert(rows);
    unique.forEach(id => state.readPending.delete(id));
    if (error && error.code !== '23505') {
      console.error('Leesstatus opslaan mislukt:', error);
      scheduleVisibleReadCheck();
      return;
    }
    await refreshData();
  }

  async function refreshData() {
    if (!isApproved()) return;
    const [messagesResult, readsResult] = await Promise.all([
      client.from('portfolio_admin_messages')
        .select('id,topic_key,message,created_at,created_by,author_email,author_name')
        .order('created_at', { ascending: true }),
      client.from('portfolio_admin_message_reads')
        .select('message_id,reader_user_id,reader_email,reader_name,read_at')
    ]);

    if (messagesResult.error) {
      console.error('Beheerdernotities laden mislukt:', messagesResult.error);
      return;
    }
    if (readsResult.error) {
      console.error('Leesbevestigingen laden mislukt:', readsResult.error);
      return;
    }
    state.messages = (messagesResult.data || []).filter(row => ALLOWED_KEYS.has(row.topic_key));
    state.reads = readsResult.data || [];
    rebuildMaps();
    renderAll();
  }

  function scheduleRefresh() {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = setTimeout(() => refreshData(), 80);
  }

  function subscribeRealtime() {
    if (state.realtime || !isApproved()) return;
    state.realtime = client.channel('portfolio-admin-notes-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_admin_messages' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_admin_message_reads' }, scheduleRefresh)
      .subscribe();
  }

  async function initializeAccess() {
    const epoch = ++state.accessEpoch;
    const { data: sessionData } = await client.auth.getSession();
    if (epoch !== state.accessEpoch) return;
    const session = sessionData?.session || null;
    state.session = session;

    if (!session?.user?.email) {
      state.editor = null;
      teardownUi();
      return;
    }

    const { data: editor, error } = await client.from('portfolio_editors')
      .select('email,display_name,role')
      .ilike('email', String(session.user.email).trim())
      .maybeSingle();
    if (epoch !== state.accessEpoch) return;
    if (error) console.error('Beheerdertoegang voor notities controleren mislukt:', error);
    state.editor = editor || null;

    if (!state.editor) {
      teardownUi();
      return;
    }

    ensureToggle();
    ensureRowsAndPanels();
    await refreshData();
    subscribeRealtime();
  }

  function teardownUi() {
    clearAllReadViewTimers();
    document.body.classList.remove('admin-notes-visible');
    document.querySelector('.admin-notes-toggle')?.remove();
    document.querySelectorAll('.admin-chat-panel').forEach(panel => panel.remove());
    document.querySelectorAll('.admin-notes-row').forEach(row => {
      const section = row.querySelector(':scope > .section, :scope > .hero');
      if (section && row.parentNode) row.parentNode.insertBefore(section, row);
      row.remove();
    });
    if (state.realtime) {
      client.removeChannel(state.realtime);
      state.realtime = null;
    }
    state.messages = [];
    state.reads = [];
    rebuildMaps();
  }

  function injectNameSettingsCard() {
    if (!isApproved()) return;
    const overlay = document.querySelector('.settings-overlay');
    const grid = overlay?.querySelector('.settings-grid');
    if (!grid || grid.querySelector('.admin-name-card')) return;

    const card = document.createElement('section');
    card.className = 'settings-card admin-name-card';
    card.innerHTML = `
      <h4>Beheerdernotities</h4>
      <p>Deze naam wordt getoond bij je berichten en leesbevestigingen.</p>
      <div class="settings-form">
        <label>Naam voor beheerdernotities
          <input type="text" maxlength="40" data-admin-display-name>
        </label>
        <div class="settings-actions"><button class="settings-btn" type="button" data-save-admin-display-name>Naam opslaan</button></div>
        <p class="settings-message" data-admin-display-name-message></p>
      </div>`;
    const firstCard = grid.querySelector(':scope > .settings-card');
    if (firstCard?.nextSibling) grid.insertBefore(card, firstCard.nextSibling);
    else grid.appendChild(card);

    const input = card.querySelector('[data-admin-display-name]');
    const save = card.querySelector('[data-save-admin-display-name]');
    const message = card.querySelector('[data-admin-display-name-message]');
    input.value = String(state.editor?.display_name || '').trim();

    const saveName = async () => {
      const value = String(input.value || '').trim();
      if (!value || value.length > 40) {
        message.textContent = 'Vul een naam van maximaal 40 tekens in.';
        return;
      }
      save.disabled = true;
      message.textContent = 'Naam opslaan…';
      const { error } = await client.from('portfolio_editors')
        .update({ display_name: value })
        .ilike('email', currentEmail());
      save.disabled = false;
      if (error) {
        console.error('Beheerdernaam opslaan mislukt:', error);
        message.textContent = 'Opslaan mislukt. Probeer het opnieuw.';
        return;
      }
      state.editor.display_name = value;
      message.textContent = 'Naam opgeslagen.';
      await refreshData();
    };

    save.addEventListener('click', saveName);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); saveName(); }
    });
  }

  function waitForSettingsCard(attempt = 0) {
    if (!isApproved() || attempt > 20) return;
    const grid = document.querySelector('.settings-overlay .settings-grid');
    if (grid) { injectNameSettingsCard(); return; }
    setTimeout(() => waitForSettingsCard(attempt + 1), 50);
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-open-settings]')) waitForSettingsCard();
  });
  window.addEventListener('scroll', scheduleVisibleReadCheck, { passive: true });
  window.addEventListener('resize', scheduleVisibleReadCheck, { passive: true });
  window.addEventListener('focus', () => { scheduleRefresh(); scheduleVisibleReadCheck(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleRefresh();
      scheduleVisibleReadCheck();
    } else {
      clearAllReadViewTimers();
    }
  });
  window.addEventListener('portfolio-auth-changed', initializeAccess);
  client.auth.onAuthStateChange(() => setTimeout(initializeAccess, 0));

  initializeAccess();
})();
