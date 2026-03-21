(() => {
  if (window.__uwuModeLoaded) return;
  window.__uwuModeLoaded = true;

  let active = false;
  let originalTexts = new Map();
  let styleEl = null;

  /* ── Uwu text transformation ─────────────────────────────── */

  const faces = ['UwU', 'OwO', '>w<', '^w^', '~w~', 'uwu', 'owo', ':3', '(・ω・)', '♡'];
  const exclamations = ['nya~!', 'rawr~!', 'owo!', 'uwu~', '>w<!', 'hehe~'];

  function uwuify(text) {
    if (!text || text.trim().length === 0) return text;

    let t = text;

    // Preserve URLs and code
    const preserved = [];
    t = t.replace(/(https?:\/\/\S+|`[^`]+`|\b[\w.]+@[\w.]+\b)/g, (match) => {
      preserved.push(match);
      return `\x00PRSV${preserved.length - 1}\x00`;
    });

    // Core uwu transformations
    t = t.replace(/(?<=[aeiou])r(?=[aeiou])/gi, 'w');
    t = t.replace(/\br/gi, (m) => m === 'R' ? 'W' : 'w');
    t = t.replace(/(?<=\w)r(?=\s|$|[.,!?;:])/gi, (m) => m === 'R' ? 'W' : 'w');
    t = t.replace(/l/g, 'w');
    t = t.replace(/L/g, 'W');
    t = t.replace(/th/g, 'd');
    t = t.replace(/Th/g, 'D');
    t = t.replace(/TH/g, 'D');
    t = t.replace(/ove/g, 'uv');
    t = t.replace(/OVE/g, 'UV');
    t = t.replace(/n([aeiou])/g, 'ny$1');
    t = t.replace(/N([aeiou])/g, 'Ny$1');
    t = t.replace(/N([AEIOU])/g, 'NY$1');

    // Stutter at start of words (random ~20% chance)
    t = t.replace(/\b([a-zA-Z])/g, (match) => {
      return Math.random() < 0.2 ? `${match}-${match}` : match;
    });

    // Add faces after punctuation (~30% chance)
    t = t.replace(/([.!?])\s/g, (match, p) => {
      if (Math.random() < 0.3) {
        return `${p} ${faces[Math.floor(Math.random() * faces.length)]} `;
      }
      return match;
    });

    // Replace some exclamation marks
    t = t.replace(/!/g, () => {
      return Math.random() < 0.25
        ? ' ' + exclamations[Math.floor(Math.random() * exclamations.length)]
        : '!';
    });

    // Restore preserved tokens
    t = t.replace(/\x00PRSV(\d+)\x00/g, (_, idx) => preserved[parseInt(idx)]);

    return t;
  }

  /* ── DOM text walker ──────────────────────────────────────── */

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE',
    'SVG', 'MATH', 'NOSCRIPT', 'IFRAME', 'SELECT', 'OPTION',
  ]);

  function walkTextNodes(root, callback) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (SKIP_TAGS.has(node.parentElement?.tagName)) return NodeFilter.FILTER_REJECT;
        if (node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(callback);
  }

  function transformPage() {
    walkTextNodes(document.body, (node) => {
      if (originalTexts.has(node)) return;
      originalTexts.set(node, node.textContent);
      node.textContent = uwuify(node.textContent);
    });
  }

  function restorePage() {
    originalTexts.forEach((original, node) => {
      if (node.parentNode) node.textContent = original;
    });
    originalTexts.clear();
  }

  /* ── Kawaii image effects ──────────────────────────────────── */

  const KAWAII_CSS = `
    .uwu-mode-active img:not([src*="data:image/svg"]):not(.uwu-no-effect) {
      border: 3px solid #f9a8d4 !important;
      border-radius: 16px !important;
      box-shadow: 0 0 12px rgba(244, 114, 182, 0.4), 0 0 24px rgba(244, 114, 182, 0.15) !important;
      transition: all 0.3s ease !important;
    }
    .uwu-mode-active img:not([src*="data:image/svg"]):not(.uwu-no-effect):hover {
      border-color: #ec4899 !important;
      box-shadow: 0 0 20px rgba(244, 114, 182, 0.6), 0 0 40px rgba(244, 114, 182, 0.2) !important;
      transform: scale(1.02) rotate(1deg) !important;
    }

    .uwu-sparkle {
      position: absolute;
      pointer-events: none;
      font-size: 16px;
      animation: uwu-float 2s ease-in-out infinite;
      z-index: 999999;
    }
    @keyframes uwu-float {
      0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
      50% { opacity: 1; transform: translateY(-20px) scale(1); }
    }

    .uwu-mode-active a {
      color: #ec4899 !important;
    }
    .uwu-mode-active a:hover {
      color: #f472b6 !important;
    }

    .uwu-cursor {
      cursor: url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text y="18" font-size="18">✨</text></svg>')}") 12 12, auto !important;
    }

    .uwu-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #fce7f3, #fdf2f8, #fce7f3);
      color: #be185d;
      text-align: center;
      padding: 6px 16px;
      font-family: 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 2147483647;
      box-shadow: 0 2px 8px rgba(236, 72, 153, 0.2);
      letter-spacing: 1px;
    }
  `;

  function addKawaiiEffects() {
    styleEl = document.createElement('style');
    styleEl.id = 'uwu-mode-styles';
    styleEl.textContent = KAWAII_CSS;
    document.head.appendChild(styleEl);
    document.body.classList.add('uwu-mode-active', 'uwu-cursor');

    // Add sparkles near images
    document.querySelectorAll('img').forEach((img) => {
      if (img.width < 50 || img.height < 50) return;
      const sparkles = ['✨', '💖', '⭐', '🌸', '💕'];
      const count = Math.min(3, Math.floor(Math.random() * 3) + 1);
      for (let i = 0; i < count; i++) {
        const sparkle = document.createElement('span');
        sparkle.className = 'uwu-sparkle';
        sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
        sparkle.style.animationDelay = `${Math.random() * 2}s`;

        const rect = img.getBoundingClientRect();
        sparkle.style.left = `${rect.left + Math.random() * rect.width + window.scrollX}px`;
        sparkle.style.top = `${rect.top + Math.random() * rect.height + window.scrollY}px`;
        document.body.appendChild(sparkle);
      }
    });

    // Add uwu banner
    const banner = document.createElement('div');
    banner.className = 'uwu-banner';
    banner.id = 'uwu-banner';
    banner.textContent = '✨ UwU Mode Activated OwO ✨ evewything is now kawaii 💖';
    document.body.appendChild(banner);
  }

  function removeKawaiiEffects() {
    if (styleEl) { styleEl.remove(); styleEl = null; }
    document.body.classList.remove('uwu-mode-active', 'uwu-cursor');
    document.querySelectorAll('.uwu-sparkle').forEach((el) => el.remove());
    const banner = document.getElementById('uwu-banner');
    if (banner) banner.remove();
  }

  /* ── Activate / Deactivate ────────────────────────────────── */

  function activate() {
    if (active) return;
    active = true;
    transformPage();
    addKawaiiEffects();
  }

  function deactivate() {
    if (!active) return;
    active = false;
    restorePage();
    removeKawaiiEffects();
  }

  /* ── Message listener ─────────────────────────────────────── */

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'uwu-activate') activate();
    if (msg.type === 'uwu-deactivate') deactivate();
  });
})();
