const PROMPTLENS_URL = 'https://promptlens.polsia.app';
const API_BASE = `${PROMPTLENS_URL}/api/v1/extension`;
const POPUP_HISTORY_LIMIT = 5;

document.addEventListener('DOMContentLoaded', async () => {
  const [settings, { history = [] }, { cachedLimits }] = await Promise.all([
    browser.storage.sync.get(['authMode', 'email', 'apiKey']),
    browser.storage.local.get('history'),
    browser.storage.local.get('cachedLimits'),
  ]);

  const authMode = settings.authMode || 'anonymous';

  renderStatus(authMode, cachedLimits);
  renderHistory(history);
  renderUpsell(authMode, cachedLimits);

  // Refresh limits from API
  fetchLimitsForPopup(settings).then((fresh) => {
    if (fresh) {
      renderStatus(authMode, fresh);
      renderUpsell(authMode, fresh);
    }
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });

  document.getElementById('open-site').addEventListener('click', (e) => {
    e.preventDefault();
    browser.tabs.create({ url: PROMPTLENS_URL });
  });

  document.getElementById('clear-btn').addEventListener('click', async () => {
    await browser.storage.local.set({ history: [] });
    renderHistory([]);
  });
});

/* ------------------------------------------------------------------ */

function renderStatus(authMode, limits) {
  const authLabel = document.getElementById('auth-label');
  const limitLabel = document.getElementById('limit-label');
  const progressTrack = document.getElementById('progress-track');
  const progressFill = document.getElementById('progress-fill');

  const modeLabels = { anonymous: 'Anonymous', email: 'Email-linked', apikey: 'API Key' };
  authLabel.textContent = modeLabels[authMode] || 'Anonymous';

  if (limits && limits.remaining != null && limits.limit) {
    const used = limits.limit - limits.remaining;
    limitLabel.textContent = `${used} of ${limits.limit} used`;
    progressTrack.hidden = false;
    const pct = Math.min(100, (used / limits.limit) * 100);
    progressFill.style.width = `${pct}%`;
    progressFill.className = 'progress-fill' +
      (pct >= 100 ? ' full' : pct >= 70 ? ' warn' : '');
  } else if (limits && limits.remaining != null) {
    limitLabel.textContent = `${limits.remaining} remaining`;
    progressTrack.hidden = true;
  } else {
    limitLabel.textContent = '';
    progressTrack.hidden = true;
  }
}

function renderHistory(history) {
  const emptyState = document.getElementById('empty-state');
  const historySection = document.getElementById('history-section');
  const listEl = document.getElementById('history-list');

  listEl.innerHTML = '';

  if (history.length === 0) {
    emptyState.hidden = false;
    historySection.hidden = true;
    return;
  }

  emptyState.hidden = true;
  historySection.hidden = false;

  history.slice(0, POPUP_HISTORY_LIMIT).forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      browser.tabs.create({ url: item.url });
    });

    const info = document.createElement('div');
    info.className = 'item-info';

    const source = document.createElement('span');
    source.className = 'item-source';
    try {
      source.textContent = new URL(item.pageUrl || item.sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      source.textContent = item.shareId;
    }

    const id = document.createElement('span');
    id.className = 'item-id';
    id.textContent = item.shareId;

    info.appendChild(source);
    info.appendChild(id);

    const time = document.createElement('span');
    time.className = 'item-time';
    time.textContent = timeAgo(item.timestamp);

    a.appendChild(info);
    a.appendChild(time);
    li.appendChild(a);
    listEl.appendChild(li);
  });
}

function renderUpsell(authMode, limits) {
  const upsell = document.getElementById('upsell');
  const text = document.getElementById('upsell-text');

  if (authMode === 'anonymous') {
    upsell.hidden = false;
    text.textContent = 'Link your email in Settings for 5 generations/day';
  } else if (authMode === 'email' && limits && limits.remaining === 0) {
    upsell.hidden = false;
    text.textContent = 'Add an API key for plan-based limits';
  } else {
    upsell.hidden = true;
  }
}

/* ------------------------------------------------------------------ */

async function fetchLimitsForPopup(settings) {
  try {
    const headers = {};
    if (settings.authMode === 'apikey' && settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }
    const url = new URL(`${API_BASE}/limits`);
    if (settings.authMode === 'email' && settings.email) {
      url.searchParams.set('email', settings.email);
    }
    const resp = await fetch(url, { headers });
    if (resp.ok) {
      const data = await resp.json();
      await browser.storage.local.set({ cachedLimits: data });
      return data;
    }
  } catch { /* best effort */ }
  return null;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
