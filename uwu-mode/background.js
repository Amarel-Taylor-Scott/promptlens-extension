// Track which tabs have uwu mode active
const activeTabs = new Set();

chrome.action.onClicked.addListener(async (tab) => {
  // Toggle handled by popup, but if no popup this toggles directly
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'toggle-uwu') {
    handleToggle(msg.tabId, msg.enabled);
    sendResponse({ ok: true });
  }
  if (msg.type === 'get-state') {
    sendResponse({ enabled: activeTabs.has(msg.tabId) });
  }
  return true;
});

async function handleToggle(tabId, enabled) {
  if (enabled) {
    activeTabs.add(tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
    await chrome.tabs.sendMessage(tabId, { type: 'uwu-activate' });
    chrome.action.setBadgeText({ text: 'UwU', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#f472b6', tabId });
  } else {
    activeTabs.delete(tabId);
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'uwu-deactivate' });
    } catch {}
    chrome.action.setBadgeText({ text: '', tabId });
  }
}

// Clean up when tabs close or navigate
chrome.tabs.onRemoved.addListener((tabId) => activeTabs.delete(tabId));
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'loading') {
    activeTabs.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
