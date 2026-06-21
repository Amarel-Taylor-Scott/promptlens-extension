(() => {
  if (window.__uwuizeInit) return;
  window.__uwuizeInit = true;

  let shadowRoot = null;

  function getShadowRoot() {
    if (shadowRoot && shadowRoot.host.isConnected) return shadowRoot;
    const host = document.createElement('div');
    host.id = 'uwu-ize-ext';
    shadowRoot = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = [
      '.uwu-container { position:fixed; bottom:24px; right:24px; z-index:2147483647; display:flex; flex-direction:column; gap:10px; font-family:"Comic Sans MS","Chalkboard SE",cursive,sans-serif; pointer-events:none; }',
      '.uwu-toast { display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:16px; box-shadow:0 8px 32px rgba(236,72,153,0.3); color:#fff; font-size:14px; line-height:1.4; max-width:380px; pointer-events:auto; animation:uwu-slideIn 0.3s ease-out; }',
      '.uwu-toast.uploading { background:linear-gradient(135deg,#ec4899,#a855f7); }',
      '.uwu-toast.success { background:linear-gradient(135deg,#10b981,#06b6d4); cursor:pointer; }',
      '.uwu-toast.error { background:linear-gradient(135deg,#ef4444,#f97316); }',
      '.uwu-icon { font-size:20px; flex-shrink:0; }',
      '.uwu-body { flex:1; min-width:0; }',
      '.uwu-title { font-weight:700; margin-bottom:2px; }',
      '.uwu-msg { opacity:0.9; font-size:13px; word-break:break-word; }',
      '.uwu-close { opacity:0.7; cursor:pointer; font-size:18px; padding:0 2px; flex-shrink:0; }',
      '.uwu-close:hover { opacity:1; }',
      '.uwu-spinner { width:20px; height:20px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:uwu-spin 0.8s linear infinite; flex-shrink:0; }',
      '@keyframes uwu-slideIn { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }',
      '@keyframes uwu-slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(120%); opacity:0; } }',
      '@keyframes uwu-spin { to { transform:rotate(360deg); } }',
    ].join('\n');
    shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'uwu-container';
    shadowRoot.appendChild(container);

    document.documentElement.appendChild(host);
    return shadowRoot;
  }

  function dismissToast(el) {
    el.style.animation = 'uwu-slideOut 0.3s ease-in forwards';
    setTimeout(() => el.remove(), 300);
  }

  function showToast(data) {
    const root = getShadowRoot();
    const container = root.querySelector('.uwu-container');

    if (data.status !== 'uploading') {
      container.querySelectorAll('.uwu-toast.uploading').forEach(dismissToast);
    }

    const toast = document.createElement('div');
    toast.className = `uwu-toast ${data.status}`;

    let iconEl;
    let title;
    if (data.status === 'uploading') {
      iconEl = document.createElement('div');
      iconEl.className = 'uwu-spinner';
      title = 'Uwu-izing~';
    } else if (data.status === 'success') {
      iconEl = document.createElement('span');
      iconEl.className = 'uwu-icon';
      iconEl.textContent = '\u2728';
      title = 'Uwu-ized! OwO';
    } else {
      iconEl = document.createElement('span');
      iconEl.className = 'uwu-icon';
      iconEl.textContent = '\uD83D\uDE3F';
      title = 'Oh nyo >_<';
    }

    const body = document.createElement('div');
    body.className = 'uwu-body';
    const titleEl = document.createElement('div');
    titleEl.className = 'uwu-title';
    titleEl.textContent = title;
    const msgEl = document.createElement('div');
    msgEl.className = 'uwu-msg';
    msgEl.textContent = data.message || '';
    body.appendChild(titleEl);
    body.appendChild(msgEl);

    const closeEl = document.createElement('span');
    closeEl.className = 'uwu-close';
    closeEl.textContent = '\u00d7';

    toast.appendChild(iconEl);
    toast.appendChild(body);
    toast.appendChild(closeEl);

    closeEl.addEventListener('click', () => dismissToast(toast));
    container.appendChild(toast);

    const timeout = data.status === 'success' ? 6000 : data.status === 'error' ? 5000 : 0;
    if (timeout) {
      setTimeout(() => { if (toast.isConnected) dismissToast(toast); }, timeout);
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'uwu-toast') showToast(msg);
  });
})();
