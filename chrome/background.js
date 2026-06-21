const PROMPTLENS_URL = 'https://promptlens.polsia.app';
const API_BASE = `${PROMPTLENS_URL}/api/v1/extension`;
const MAX_HISTORY = 50;

const DEFAULT_SETTINGS = {
  authMode: 'anonymous',
  email: '',
  apiKey: '',
  models: [],
  autoOpen: true,
  showToasts: true,
};

/* ------------------------------------------------------------------ */
/*  Context menu                                                       */
/* ------------------------------------------------------------------ */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'promptlens-generate',
    title: 'Generate Prompt with PromptLens',
    contexts: ['image'],
  });
});

/* ------------------------------------------------------------------ */
/*  Handle right-click                                                 */
/* ------------------------------------------------------------------ */

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'promptlens-generate') return;
  await generatePrompt(info.srcUrl, tab);
});

async function getSettings() {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function generatePrompt(imageUrl, tab) {
  const settings = await getSettings();

  const shortUrl = imageUrl.length > 60
    ? imageUrl.substring(0, 57) + '...'
    : imageUrl;

  console.log('[PromptLens] Right-click captured URL:', imageUrl);
  console.log('[PromptLens] Page:', tab.url);

  if (settings.showToasts) {
    await notifyTab(tab.id, { status: 'uploading', message: `Fetching image\u2026` });
  }

  try {
    if (/^(chrome|edge|about):/.test(imageUrl)) {
      throw new Error('Cannot analyze browser-internal images');
    }

    // Step 1: Fetch the image as a Blob
    let imageBlob = null;
    try {
      imageBlob = await fetchImageBlob(imageUrl, tab.url);
      console.log('[PromptLens] Fetched:', imageBlob.type, (imageBlob.size / 1024).toFixed(0) + 'KB');
    } catch (fetchErr) {
      console.warn('[PromptLens] Extension fetch failed:', fetchErr.message);
    }

    let shareId = null;
    let resultUrl = null;

    // Step 2: Upload — prefer the fast multipart endpoint (returns in ~3s)
    if (imageBlob) {
      if (settings.showToasts) {
        await notifyTab(tab.id, { status: 'uploading', message: 'Uploading to PromptLens\u2026' });
      }

      const formData = new FormData();
      formData.append('image', imageBlob, 'image.jpg');

      console.log('[PromptLens] Uploading via fast endpoint...');
      const resp = await fetchWithTimeout(`${PROMPTLENS_URL}/api/analyze-image`, {
        method: 'POST',
        body: formData,
      }, 30000);

      const data = await resp.json();
      console.log('[PromptLens] Upload response:', resp.status, JSON.stringify(data).substring(0, 300));

      if (resp.status === 200 && data.success) {
        shareId = data.shareId;
      } else if (resp.status === 409 && data.existingShareId) {
        shareId = data.existingShareId;
      } else if (resp.status === 429 || resp.status === 402) {
        throw new Error('Daily limit reached. Visit promptlens.polsia.app to upgrade.');
      } else {
        throw new Error(data.message || `Upload failed (${resp.status})`);
      }
    }

    // Fallback: if extension couldn't fetch the image, use the JSON endpoint with URL
    if (!shareId && /^https?:\/\//.test(imageUrl)) {
      console.log('[PromptLens] Falling back to URL-based endpoint...');
      if (settings.showToasts) {
        await notifyTab(tab.id, { status: 'uploading', message: 'Sending image URL\u2026' });
      }

      const body = { image_url: imageUrl };
      if (settings.authMode === 'email' && settings.email) body.email = settings.email;
      if (settings.models.length > 0) body.models = settings.models;

      const headers = { 'Content-Type': 'application/json' };
      if (settings.authMode === 'apikey' && settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      const resp = await fetchWithTimeout(`${API_BASE}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }, 120000);

      const data = await resp.json();

      if (resp.ok && data.success) {
        shareId = data.shareId;
        resultUrl = data.url;
      } else if (resp.status === 429) {
        throw new Error('Daily limit reached. Visit promptlens.polsia.app to upgrade.');
      } else {
        throw new Error(data.message || `Failed (${resp.status})`);
      }
    }

    if (!shareId) throw new Error('Could not process image');

    // Step 3: Open the page IMMEDIATELY — it handles its own loading UI
    if (!resultUrl) resultUrl = `${PROMPTLENS_URL}/p/${shareId}`;
    const finalUrl = `${resultUrl}?utm_source=extension`;

    if (settings.autoOpen) {
      await chrome.tabs.create({ url: finalUrl });
      console.log('[PromptLens] Opened tab:', finalUrl);
    }

    if (settings.showToasts) {
      await notifyTab(tab.id, {
        status: 'success',
        message: settings.autoOpen ? 'Opened! Prompts generating\u2026' : 'Click to view',
        url: finalUrl,
      });
    }

    await saveHistory({
      shareId,
      url: finalUrl,
      sourceUrl: imageUrl,
      pageTitle: tab.title || '',
      pageUrl: tab.url || '',
      timestamp: Date.now(),
    });

    await refreshBadge();
  } catch (err) {
    console.error('[PromptLens] Error:', err.message);
    if (settings.showToasts) {
      await notifyTab(tab.id, { status: 'error', message: err.message });
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Fetch helpers                                                      */
/* ------------------------------------------------------------------ */

function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function fetchImageBlob(url, pageUrl) {
  if (url.startsWith('data:')) {
    const resp = await fetch(url);
    return resp.blob();
  }

  if (url.startsWith('blob:')) {
    throw new Error('Cannot analyze this image \u2014 try saving it first');
  }

  console.log('[PromptLens] Fetching image (10s timeout):', url.substring(0, 100));
  let resp;
  try {
    resp = await fetchWithTimeout(url, {}, 10000);
  } catch (e) {
    if (pageUrl) {
      console.log('[PromptLens] Retrying with Referer...');
      resp = await fetchWithTimeout(url, { headers: { Referer: pageUrl } }, 10000);
    } else {
      throw e;
    }
  }

  if (!resp.ok && pageUrl) {
    console.log('[PromptLens] Got', resp.status, '— retrying with Referer...');
    resp = await fetchWithTimeout(url, { headers: { Referer: pageUrl } }, 10000);
  }
  if (!resp.ok) throw new Error(`Could not load image (HTTP ${resp.status})`);

  const blob = await resp.blob();
  console.log('[PromptLens] Image blob:', blob.type, (blob.size / 1024).toFixed(0) + 'KB');

  if (!blob.type.startsWith('image/')) throw new Error('Not a valid image');
  if (blob.size < 1000) {
    console.warn('[PromptLens] Image very small (<1KB) — may be a placeholder');
  }

  return blob;
}

/* ------------------------------------------------------------------ */
/*  Limits — GET /api/v1/extension/limits                              */
/* ------------------------------------------------------------------ */

async function fetchLimits(settings) {
  if (!settings) settings = await getSettings();

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
    await chrome.storage.local.set({ cachedLimits: data });
    return data;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  History                                                            */
/* ------------------------------------------------------------------ */

async function saveHistory(entry) {
  const { history = [] } = await chrome.storage.local.get('history');
  history.unshift(entry);
  await chrome.storage.local.set({ history: history.slice(0, MAX_HISTORY) });
}

/* ------------------------------------------------------------------ */
/*  Badge — shows remaining generations from limits API                */
/* ------------------------------------------------------------------ */

async function refreshBadge() {
  try {
    const limits = await fetchLimits();
    if (limits && limits.remaining != null) {
      const text = String(limits.remaining);
      chrome.action.setBadgeText({ text });

      let color = '#059669'; // green
      if (limits.limit && limits.remaining <= Math.ceil(limits.limit * 0.3)) {
        color = '#d97706'; // amber
      }
      if (limits.remaining === 0) {
        color = '#dc2626'; // red
      }
      chrome.action.setBadgeBackgroundColor({ color });
    }
  } catch {
    // badge update is best-effort
  }
}

/* ------------------------------------------------------------------ */
/*  Toast notifications (content script + system notification fallback) */
/* ------------------------------------------------------------------ */

const injectedTabs = new Set();

async function notifyTab(tabId, data) {
  try {
    if (!injectedTabs.has(tabId)) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      injectedTabs.add(tabId);
    }
    await chrome.tabs.sendMessage(tabId, { type: 'promptlens-toast', ...data });
  } catch {
    injectedTabs.delete(tabId);
    if (data.status === 'success' && data.url) {
      const notifId = `pl-${Date.now()}`;
      chrome.notifications.create(notifId, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'PromptLens',
        message: 'Prompt generated! Click to view.',
      });
      await chrome.storage.local.set({ [`notif_${notifId}`]: data.url });
    } else if (data.status === 'error') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'PromptLens \u2014 Error',
        message: data.message,
      });
    }
  }
}

chrome.tabs.onRemoved.addListener((tabId) => injectedTabs.delete(tabId));
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading') injectedTabs.delete(tabId);
});

chrome.notifications.onClicked.addListener(async (notifId) => {
  const key = `notif_${notifId}`;
  const stored = await chrome.storage.local.get(key);
  if (stored[key]) {
    chrome.tabs.create({ url: stored[key] });
    await chrome.storage.local.remove(key);
  }
  chrome.notifications.clear(notifId);
});

/* ------------------------------------------------------------------ */
/*  Startup + settings change listeners                                */
/* ------------------------------------------------------------------ */

refreshBadge();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') refreshBadge();
});
