(() => {
  if (window.__promptlens_init) return;
  window.__promptlens_init = true;

  let shadowRoot = null;

  function getShadowRoot() {
    if (shadowRoot && shadowRoot.host.isConnected) return shadowRoot;

    const host = document.createElement('div');
    host.id = 'promptlens-ext';
    shadowRoot = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = [
      '.pl-container { position:fixed; bottom:24px; right:24px; z-index:2147483647; display:flex; flex-direction:column; gap:10px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; pointer-events:none; }',
      '.pl-toast { display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.18); color:#fff; font-size:14px; line-height:1.4; max-width:380px; pointer-events:auto; animation:pl-slideIn 0.3s ease-out; }',
      '.pl-toast.uploading { background:#6366f1; }',
      '.pl-toast.success { background:#059669; cursor:pointer; }',
      '.pl-toast.error { background:#dc2626; }',
      '.pl-icon { font-size:20px; flex-shrink:0; }',
      '.pl-body { flex:1; min-width:0; }',
      '.pl-title { font-weight:600; margin-bottom:2px; }',
      '.pl-msg { opacity:0.9; font-size:13px; word-break:break-word; }',
      '.pl-close { opacity:0.7; cursor:pointer; font-size:18px; padding:0 2px; flex-shrink:0; line-height:1; }',
      '.pl-close:hover { opacity:1; }',
      '.pl-spinner { width:20px; height:20px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:pl-spin 0.8s linear infinite; flex-shrink:0; }',
      '@keyframes pl-slideIn { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }',
      '@keyframes pl-slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(120%); opacity:0; } }',
      '@keyframes pl-spin { to { transform:rotate(360deg); } }',
    ].join('\n');
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'pl-container';
    shadowRoot.appendChild(container);

    document.documentElement.appendChild(host);
    return shadowRoot;
  }

  function dismissToast(el) {
    el.style.animation = 'pl-slideOut 0.3s ease-in forwards';
    setTimeout(() => el.remove(), 300);
  }

  function showToast(data) {
    const root = getShadowRoot();
    const container = root.querySelector('.pl-container');

    if (data.status !== 'uploading') {
      container.querySelectorAll('.pl-toast.uploading').forEach(dismissToast);
    }

    const toast = document.createElement('div');
    toast.className = `pl-toast ${data.status}`;

    let iconEl;
    let title;
    if (data.status === 'uploading') {
      iconEl = document.createElement('div');
      iconEl.className = 'pl-spinner';
      title = 'Generating prompt\u2026';
    } else if (data.status === 'success') {
      iconEl = document.createElement('span');
      iconEl.className = 'pl-icon';
      iconEl.textContent = '\u2713';
      title = 'Prompt generated!';
    } else {
      iconEl = document.createElement('span');
      iconEl.className = 'pl-icon';
      iconEl.textContent = '\u2717';
      title = 'Generation failed';
    }

    const body = document.createElement('div');
    body.className = 'pl-body';
    const titleEl = document.createElement('div');
    titleEl.className = 'pl-title';
    titleEl.textContent = title;
    const msgEl = document.createElement('div');
    msgEl.className = 'pl-msg';
    msgEl.textContent = data.message || '';
    body.appendChild(titleEl);
    body.appendChild(msgEl);

    const closeEl = document.createElement('span');
    closeEl.className = 'pl-close';
    closeEl.textContent = '\u00d7';

    toast.appendChild(iconEl);
    toast.appendChild(body);
    toast.appendChild(closeEl);

    if (data.status === 'success' && data.url) {
      toast.addEventListener('click', (e) => {
        if (!e.target.classList.contains('pl-close')) {
          window.open(data.url, '_blank');
        }
      });
    }

    closeEl.addEventListener('click', () => dismissToast(toast));
    container.appendChild(toast);

    const timeout = data.status === 'success' ? 8000 : data.status === 'error' ? 6000 : 0;
    if (timeout) {
      setTimeout(() => { if (toast.isConnected) dismissToast(toast); }, timeout);
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'promptlens-toast') showToast(msg);
  });
})();
