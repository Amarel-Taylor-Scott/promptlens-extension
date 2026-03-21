const DEFAULTS = {
  authMode: 'anonymous',
  email: '',
  apiKey: '',
  models: [],
  autoOpen: true,
  showToasts: true,
};

document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  const settings = { ...DEFAULTS, ...stored };

  // Populate auth mode
  const radio = document.querySelector(`input[name="authMode"][value="${settings.authMode}"]`);
  if (radio) radio.checked = true;
  toggleAuthFields(settings.authMode);

  // Populate fields
  document.getElementById('email').value = settings.email;
  document.getElementById('apiKey').value = settings.apiKey;

  // Populate models
  settings.models.forEach((m) => {
    const cb = document.querySelector(`input[name="models"][value="${m}"]`);
    if (cb) cb.checked = true;
  });

  // Populate behavior
  document.getElementById('autoOpen').checked = settings.autoOpen;
  document.getElementById('showToasts').checked = settings.showToasts;

  // Auth mode toggle
  document.querySelectorAll('input[name="authMode"]').forEach((r) => {
    r.addEventListener('change', () => toggleAuthFields(r.value));
  });

  // Save
  document.getElementById('save-btn').addEventListener('click', save);
});

function toggleAuthFields(mode) {
  document.getElementById('email-field').hidden = mode !== 'email';
  document.getElementById('apikey-field').hidden = mode !== 'apikey';
}

async function save() {
  const authMode = document.querySelector('input[name="authMode"]:checked').value;
  const email = document.getElementById('email').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();

  const models = [];
  document.querySelectorAll('input[name="models"]:checked').forEach((cb) => {
    models.push(cb.value);
  });

  const autoOpen = document.getElementById('autoOpen').checked;
  const showToasts = document.getElementById('showToasts').checked;

  // Basic validation
  if (authMode === 'email' && !email) {
    return showStatus('Please enter an email address', true);
  }
  if (authMode === 'apikey' && !apiKey) {
    return showStatus('Please enter an API key', true);
  }
  if (authMode === 'apikey' && !apiKey.startsWith('pl_')) {
    return showStatus('API key should start with pl_', true);
  }

  await chrome.storage.sync.set({ authMode, email, apiKey, models, autoOpen, showToasts });
  showStatus('Saved!', false);
}

function showStatus(text, isError) {
  const el = document.getElementById('save-status');
  el.textContent = text;
  el.hidden = false;
  el.className = isError ? 'error' : '';
  if (!isError) {
    setTimeout(() => { el.hidden = true; }, 2000);
  }
}
