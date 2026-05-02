/* ===== Temp Mail — powered by mail.tm API =====
 *
 * Single-purpose disposable email inbox using the mail.tm REST API.
 * Docs: https://docs.mail.tm/
 *
 * Flow:
 *   1) GET    /domains          → fetch available domains
 *   2) POST   /accounts         → create account: random user@domain + password
 *   3) POST   /token            → obtain JWT bearer token
 *   4) GET    /messages         → poll inbox (auth required)
 *   5) GET    /messages/{id}    → fetch full message body
 *   6) DELETE /accounts/{id}    → delete account
 */
const TempMail = (function () {

  const API = 'https://api.mail.tm';
  const STORAGE_KEY = 'mailbox_mailtm_account';
  const POLL_INTERVAL = 10000;

  let account = null;     // { id, address, password, token }
  let messages = [];
  let pollTimer = null;

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);

  function setStatus(text, type = '') {
    const dot = $('status-dot');
    const txt = $('status-text');
    if (txt) txt.textContent = text;
    if (dot) dot.className = 'status-dot ' + type;
  }

  function setAddress(addr) {
    const input = $('email-address');
    if (input) input.value = addr;
  }

  function setCount(n) {
    const el = $('count-badge');
    if (el) el.textContent = n;
  }

  // ---------- Random helpers ----------
  function randomUser() {
    const adj = ['quick', 'silent', 'bright', 'swift', 'cool', 'smart', 'happy', 'lazy', 'wild', 'calm', 'bold', 'lucky'];
    const noun = ['fox', 'wolf', 'tiger', 'eagle', 'panda', 'otter', 'hawk', 'lion', 'bear', 'koala', 'lynx', 'crane'];
    return Utils.pick(adj) + Utils.pick(noun) + Utils.rdigits(4);
  }
  function randomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let p = '';
    for (let i = 0; i < 16; i++) p += chars[Utils.rint(0, chars.length - 1)];
    return p;
  }

  // ---------- API wrapper ----------
  async function api(path, opts = {}) {
    const headers = Object.assign(
      { 'Accept': 'application/ld+json', 'Content-Type': 'application/json' },
      opts.headers || {}
    );
    if (account && account.token && !opts.skipAuth) {
      headers['Authorization'] = 'Bearer ' + account.token;
    }
    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const msg = (data && (data['hydra:description'] || data.message || data.detail)) || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function getDomain() {
    const data = await api('/domains?page=1', { skipAuth: true });
    const list = (data && (data['hydra:member'] || data)) || [];
    const active = list.filter(d => d.isActive !== false && !d.isPrivate);
    if (!active.length) throw new Error('No mail.tm domains available');
    return Utils.pick(active).domain;
  }

  async function createAccount() {
    const domain = await getDomain();
    const address = randomUser() + '@' + domain;
    const password = randomPassword();
    const created = await api('/accounts', {
      method: 'POST', skipAuth: true,
      body: { address, password }
    });
    const tokenRes = await api('/token', {
      method: 'POST', skipAuth: true,
      body: { address, password }
    });
    return { id: created.id, address, password, token: tokenRes.token };
  }

  // ---------- Persistence ----------
  function saveAccount() {
    if (account) localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  }
  function loadAccount() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function clearAccount() {
    localStorage.removeItem(STORAGE_KEY);
    account = null;
  }
  async function verifyToken() {
    try { await api('/me'); return true; }
    catch (_) { return false; }
  }

  // ---------- Inbox ----------
  async function loadMessages() {
    if (!account) return;
    try {
      const data = await api('/messages?page=1');
      const list = (data && (data['hydra:member'] || data)) || [];
      messages = list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      renderList();
      setStatus('Connected', 'connected');
    } catch (e) {
      console.warn('mail.tm load error:', e);
      if (e.status === 401) {
        setStatus('Session expired', 'error');
        clearAccount();
        await initAccount();
      } else {
        setStatus('Network error', 'error');
      }
    }
  }

  function renderList() {
    const list = $('mail-list');
    setCount(messages.length);
    if (!messages.length) {
      list.innerHTML = `
        <div class="empty-state">
          <p>Your inbox is empty.</p>
          <p style="color: var(--text-muted); font-size: 13px;">Waiting for incoming mail...</p>
        </div>`;
      return;
    }
    list.innerHTML = messages.map(m => {
      const fromName = (m.from && (m.from.name || m.from.address)) || 'Unknown';
      const subject = m.subject || '(no subject)';
      const unread = m.seen ? '' : 'unread';
      return `
        <div class="mail-item ${unread}" data-id="${m.id}">
          <div class="mail-sender">${escapeHtml(fromName)}</div>
          <div class="mail-subject">${escapeHtml(subject)}</div>
          <div class="mail-time">${formatTime(m.createdAt)}</div>
        </div>`;
    }).join('');

    list.querySelectorAll('.mail-item').forEach(item => {
      item.addEventListener('click', () => openMessage(item.dataset.id));
    });
  }

  // ---------- Message viewer ----------
  async function openMessage(id) {
    openModal();
    const subject = $('modal-subject');
    const meta = $('modal-meta');
    const body = $('modal-body');
    subject.textContent = 'Loading…';
    meta.innerHTML = '';
    body.innerHTML = `
      <div class="empty-state">
        <div class="spinner"></div>
      </div>`;

    try {
      const m = await api('/messages/' + id);
      // Mark as seen (best-effort)
      try {
        await api('/messages/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/merge-patch+json' },
          body: { seen: true }
        });
        const local = messages.find(x => x.id === id);
        if (local) local.seen = true;
        renderList();
      } catch (_) {}

      const fromName = m.from && m.from.name ? m.from.name : '';
      const fromAddr = m.from && m.from.address ? m.from.address : '(unknown)';
      const toList = (m.to || []).map(t => t.address).join(', ');
      const date = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';
      const subj = m.subject || '(no subject)';

      subject.textContent = subj;
      meta.innerHTML = `
        <div><strong>From:</strong> ${escapeHtml(fromName)} &lt;${escapeHtml(fromAddr)}&gt;</div>
        <div><strong>To:</strong> ${escapeHtml(toList)}</div>
        <div><strong>Date:</strong> ${escapeHtml(date)}</div>
      `;

      let html = '';
      if (m.html && m.html.length) {
        const raw = Array.isArray(m.html) ? m.html.join('') : m.html;
        html = sanitize(decodeMailContent(raw));
      } else if (m.text) {
        const decoded = decodeMailContent(m.text);
        html = `<pre class="mail-body-text">${linkify(escapeHtml(decoded))}</pre>`;
      } else {
        html = '<em class="muted">(empty body)</em>';
      }
      body.innerHTML = html;
    } catch (e) {
      subject.textContent = 'Error';
      body.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-triangle-exclamation"></i>
          <p>Failed to load message: ${escapeHtml(e.message)}</p>
        </div>`;
    }
  }

  // ---------- Modal control ----------
  function openModal() {
    const m = $('mail-modal');
    if (m) m.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    const m = $('mail-modal');
    if (m) m.hidden = true;
    document.body.style.overflow = '';
  }

  // ---------- Time + escaping ----------
  function formatTime(iso) {
    if (!iso) return '';
    const ts = new Date(iso).getTime();
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return new Date(ts).toLocaleDateString();
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- Decoding helpers ----------
  function decodeQuotedPrintable(s) {
    if (!s || s.indexOf('=') === -1) return s;
    s = s.replace(/=\r?\n/g, '');
    return s.replace(/(?:=[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        const bytes = match.match(/=([0-9A-Fa-f]{2})/g)
          .map(h => parseInt(h.slice(1), 16));
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
      } catch (_) { return match; }
    });
  }

  function decodeEncodedWord(s) {
    if (!s) return s;
    return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (m, charset, enc, txt) => {
      try {
        if (enc.toUpperCase() === 'B') {
          const bin = atob(txt);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return new TextDecoder(charset.toLowerCase().includes('utf') ? 'utf-8' : charset, { fatal: false }).decode(bytes);
        } else {
          return decodeQuotedPrintable(txt.replace(/_/g, ' '));
        }
      } catch (_) { return m; }
    });
  }

  function fixMojibake(s) {
    if (!s) return s;
    if (!/[ÃÂâ€][\x80-\xBF]/.test(s)) return s;
    try {
      const bytes = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
      const fixed = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      return (fixed.match(/\uFFFD/g) || []).length <= (s.match(/\uFFFD/g) || []).length ? fixed : s;
    } catch (_) { return s; }
  }

  function decodeMailContent(s) {
    if (!s) return '';
    let out = String(s);
    out = decodeQuotedPrintable(out);
    out = decodeEncodedWord(out);
    out = fixMojibake(out);
    out = out.replace(/\r\n/g, '\n');
    return out;
  }

  function linkify(escapedText) {
    return escapedText.replace(
      /(https?:\/\/[^\s<>"']+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  // Strip script/iframe/style + on* handlers + javascript: URLs
  function sanitize(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const walk = (node) => {
      if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (['script', 'iframe', 'object', 'embed', 'meta', 'link', 'style'].includes(tag)) {
          node.remove();
          return;
        }
        [...node.attributes].forEach(attr => {
          const n = attr.name.toLowerCase();
          const v = (attr.value || '').trim().toLowerCase();
          if (n.startsWith('on')) node.removeAttribute(attr.name);
          else if ((n === 'href' || n === 'src') && v.startsWith('javascript:')) node.removeAttribute(attr.name);
        });
        if (tag === 'a') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
      [...node.childNodes].forEach(walk);
    };
    [...tpl.content.childNodes].forEach(walk);
    return tpl.innerHTML;
  }

  // ---------- Init / actions ----------
  async function initAccount() {
    setStatus('Connecting…', 'connecting');
    setAddress('Initializing…');

    const saved = loadAccount();
    if (saved) {
      account = saved;
      setAddress(account.address);
      const ok = await verifyToken();
      if (ok) {
        await loadMessages();
        return;
      }
      clearAccount();
    }

    try {
      account = await createAccount();
      saveAccount();
      setAddress(account.address);
      Utils.toast('New inbox ready', 'success');
      await loadMessages();
    } catch (e) {
      setStatus('Setup failed', 'error');
      setAddress('— failed —');
      $('mail-list').innerHTML = `
        <div class="empty-state">
          <i class="fas fa-triangle-exclamation"></i>
          <p>Could not create inbox.</p>
          <p class="muted small">${escapeHtml(e.message)}</p>
          <p class="muted small" style="margin-top:8px">mail.tm may be rate-limiting. Click "Change" to retry.</p>
        </div>`;
    }
  }

  async function newAddress() {
    if (account && account.id && account.token) {
      try { await api('/accounts/' + account.id, { method: 'DELETE' }); } catch (_) {}
    }
    clearAccount();
    messages = [];
    renderList();
    await initAccount();
  }

  async function deleteAccount() {
    if (!account) return;
    if (!confirm('Delete this temporary inbox and all its messages?')) return;
    try {
      await api('/accounts/' + account.id, { method: 'DELETE' });
      Utils.toast('Inbox deleted', 'success');
    } catch (e) {
      console.warn(e);
    }
    clearAccount();
    messages = [];
    renderList();
    await initAccount();
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(loadMessages, POLL_INTERVAL);
  }

  function bindEvents() {
    $('btn-copy').addEventListener('click', () => {
      if (account) Utils.copy(account.address, 'Email copied');
    });
    $('email-address').addEventListener('click', (e) => {
      e.target.select();
    });
    $('btn-refresh').addEventListener('click', () => {
      Utils.toast('Refreshing…');
      loadMessages();
    });
    $('btn-new').addEventListener('click', newAddress);
    $('btn-delete').addEventListener('click', deleteAccount);

    // Modal
    $('modal-close').addEventListener('click', closeModal);
    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('mail-modal').hidden) closeModal();
    });

    // Resume polling when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) loadMessages();
    });
  }

  function init() {
    bindEvents();
    initAccount();
    startPolling();
  }

  return { init };
})();
