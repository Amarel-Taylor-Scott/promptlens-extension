const PROMPTLENS_URL = 'https://promptlens.polsia.app';
const MAX_HISTORY = 30;

/* ── Context menu ──────────────────────────────────────────── */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'uwu-ize',
    title: 'Uwu-ize dis image OwO',
    contexts: ['image'],
  });
});

/* ── Handle right-click ────────────────────────────────────── */

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'uwu-ize') return;
  await uwuize(info.srcUrl, tab);
});

async function uwuize(imageUrl, tab) {
  await notifyTab(tab.id, { status: 'uploading', message: 'Uwu-izing youw image~ OwO' });

  try {
    if (/^(chrome|edge|about):/.test(imageUrl)) {
      throw new Error('Cannyot uwu-ize bwowser intewnaw images >w<');
    }

    // Step 1: Fetch the image
    const imageBlob = await fetchImageBlob(imageUrl, tab.url);

    // Step 2: Upload to PromptLens for prompt extraction
    await notifyTab(tab.id, { status: 'uploading', message: 'Genewating pwompts~ UwU' });

    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');

    const resp = await fetchWithTimeout(`${PROMPTLENS_URL}/api/analyze-image`, {
      method: 'POST',
      body: formData,
    }, 30000);

    const data = await resp.json();

    let shareId = null;
    if (resp.status === 200 && data.success) {
      shareId = data.shareId;
    } else if (resp.status === 409 && data.existingShareId) {
      shareId = data.existingShareId;
    } else {
      throw new Error(data.message || 'Faiwed to uwu-ize >_<');
    }

    // Step 3: Store the image URL and shareId for the result page
    const resultData = {
      shareId,
      imageUrl,
      promptLensUrl: `${PROMPTLENS_URL}/p/${shareId}`,
      timestamp: Date.now(),
      pageTitle: tab.title || '',
    };

    // Save to history
    const { uwuHistory = [] } = await chrome.storage.local.get('uwuHistory');
    uwuHistory.unshift(resultData);
    await chrome.storage.local.set({
      uwuHistory: uwuHistory.slice(0, MAX_HISTORY),
      currentUwu: resultData,
    });

    // Step 4: Open the result page
    const resultUrl = chrome.runtime.getURL('result.html');
    await chrome.tabs.create({ url: resultUrl });

    await notifyTab(tab.id, {
      status: 'success',
      message: 'Uwu-ized~! Opening wesuwts OwO',
    });
  } catch (err) {
    await notifyTab(tab.id, { status: 'error', message: err.message });
  }
}

/* ── Fetch helpers ─────────────────────────────────────────── */

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
    throw new Error('Cannyot uwu-ize dis image — twy saving it fiwst >w<');
  }

  let resp;
  try {
    resp = await fetchWithTimeout(url, {}, 10000);
  } catch (e) {
    if (pageUrl) {
      resp = await fetchWithTimeout(url, { headers: { Referer: pageUrl } }, 10000);
    } else throw e;
  }

  if (!resp.ok && pageUrl) {
    resp = await fetchWithTimeout(url, { headers: { Referer: pageUrl } }, 10000);
  }
  if (!resp.ok) throw new Error(`Couwd not woad image (${resp.status}) >_<`);

  const blob = await resp.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Dat is nyot a vawid image OwO');
  return blob;
}

/* ── Toast notifications ───────────────────────────────────── */

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
    await chrome.tabs.sendMessage(tabId, { type: 'uwu-toast', ...data });
  } catch {
    injectedTabs.delete(tabId);
  }
}

chrome.tabs.onRemoved.addListener((tabId) => injectedTabs.delete(tabId));
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading') injectedTabs.delete(tabId);
});
