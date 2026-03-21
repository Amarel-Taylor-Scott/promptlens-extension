document.addEventListener('DOMContentLoaded', async () => {
  const { uwuHistory = [] } = await chrome.storage.local.get('uwuHistory');

  const emptyState = document.getElementById('empty-state');
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');

  if (uwuHistory.length === 0) {
    emptyState.hidden = false;
  } else {
    historySection.hidden = false;
    uwuHistory.slice(0, 5).forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.addEventListener('click', async (e) => {
        e.preventDefault();
        await chrome.storage.local.set({ currentUwu: item });
        chrome.tabs.create({ url: chrome.runtime.getURL('result.html') });
      });

      const source = document.createElement('span');
      source.className = 'item-source';
      source.textContent = item.pageTitle
        ? item.pageTitle.substring(0, 30)
        : item.shareId;

      const time = document.createElement('span');
      time.className = 'item-time';
      time.textContent = timeAgo(item.timestamp);

      a.appendChild(source);
      a.appendChild(time);
      li.appendChild(a);
      historyList.appendChild(li);
    });
  }
});

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now~';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}
