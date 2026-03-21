document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('toggle');
  const label = document.getElementById('toggle-label');
  const face = document.getElementById('face');
  const hint = document.getElementById('hint');

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Check current state
  chrome.runtime.sendMessage({ type: 'get-state', tabId: tab.id }, (resp) => {
    if (resp && resp.enabled) {
      toggle.checked = true;
      updateUI(true);
    }
  });

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.runtime.sendMessage({ type: 'toggle-uwu', tabId: tab.id, enabled });
    updateUI(enabled);
  });

  function updateUI(enabled) {
    if (enabled) {
      label.textContent = 'UwU is ON~!';
      face.textContent = 'UwU';
      hint.textContent = 'Evewything is now kawaii OwO';
      document.body.classList.add('active');
    } else {
      label.textContent = 'Activate UwU';
      face.textContent = 'OwO';
      hint.textContent = 'Tuwn dis page into kawaii mode~';
      document.body.classList.remove('active');
    }
  }
});
