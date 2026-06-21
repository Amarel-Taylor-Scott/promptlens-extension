const PROMPTLENS_URL = 'https://promptlens.polsia.app';

const faces = ['UwU', 'OwO', '>w<', '^w^', '~w~', ':3', '(=^.^=)', '\u2764'];

function uwuifyText(text) {
  if (!text) return text;
  let t = text;
  t = t.replace(/(?<=[aeiou])r(?=[aeiou])/gi, 'w');
  t = t.replace(/\br/gi, (m) => m === 'R' ? 'W' : 'w');
  t = t.replace(/(?<=\w)r(?=\s|$|[.,!?;:])/gi, (m) => m === 'R' ? 'W' : 'w');
  t = t.replace(/l/g, 'w'); t = t.replace(/L/g, 'W');
  t = t.replace(/th/g, 'd'); t = t.replace(/Th/g, 'D'); t = t.replace(/TH/g, 'D');
  t = t.replace(/ove/g, 'uv'); t = t.replace(/OVE/g, 'UV');
  t = t.replace(/n([aeiou])/g, 'ny$1');
  t = t.replace(/N([aeiou])/g, 'Ny$1');
  t = t.replace(/\b([a-zA-Z])/g, (m) => Math.random() < 0.15 ? `${m}-${m}` : m);
  t = t.replace(/([.!?])\s/g, (match, p) => {
    return Math.random() < 0.35
      ? `${p} ${faces[Math.floor(Math.random() * faces.length)]} `
      : match;
  });
  return t;
}

document.addEventListener('DOMContentLoaded', async () => {
  const { currentUwu } = await chrome.storage.local.get('currentUwu');
  if (!currentUwu) return;

  const img = document.getElementById('original-image');
  const frame = document.getElementById('image-frame');
  const loading = document.getElementById('loading');
  const promptsList = document.getElementById('prompts-list');
  const plLink = document.getElementById('pl-link');
  const plUrl = document.getElementById('pl-url');

  // Show the original image
  img.src = currentUwu.imageUrl;
  img.onerror = () => {
    img.alt = 'Couwd not woad image >_<';
  };

  // Set PromptLens link
  plUrl.href = currentUwu.promptLensUrl + '?utm_source=uwuize';
  plLink.hidden = false;

  // Fetch prompts from PromptLens
  try {
    const statusUrl = `${PROMPTLENS_URL}/api/generations/${currentUwu.shareId}/status`;
    let attempts = 0;
    let prompts = [];

    // Poll until prompts are ready
    while (attempts < 30) {
      attempts++;
      const resp = await fetch(statusUrl);
      const statusData = await resp.json();

      if (statusData.status === 'completed' || statusData.status === 'error') {
        // Fetch the gallery data for prompts
        const galleryResp = await fetch(`${PROMPTLENS_URL}/api/gallery?shareId=${currentUwu.shareId}`);
        const galleryData = await galleryResp.json();

        if (galleryData.items && galleryData.items.length > 0) {
          prompts = galleryData.items;
        }
        break;
      }

      loading.textContent = `Genewating pwompts${'~'.repeat(Math.min(attempts, 5))} ${faces[attempts % faces.length]}`;
      await new Promise((r) => setTimeout(r, 3000));
    }

    loading.hidden = true;

    if (prompts.length === 0) {
      const noPrompts = document.createElement('p');
      noPrompts.className = 'no-prompts';
      noPrompts.textContent = 'Pwompts awe stiww genewating~ Check PwomptWens fow wesuwts OwO';
      promptsList.appendChild(noPrompts);
      return;
    }

    // Show uwu-ified prompts
    const seen = new Set();
    prompts.forEach((p) => {
      const key = `${p.model}-${p.tier}`;
      if (seen.has(key)) return;
      seen.add(key);

      const card = document.createElement('div');
      card.className = 'prompt-card';

      const header = document.createElement('div');
      header.className = 'prompt-header';

      const model = document.createElement('span');
      model.className = 'prompt-model';
      model.textContent = (p.model || 'unknown').toUpperCase();

      const tier = document.createElement('span');
      tier.className = 'prompt-tier';
      tier.textContent = p.tier || 'basic';

      header.appendChild(model);
      header.appendChild(tier);

      const text = document.createElement('p');
      text.className = 'prompt-text';
      text.textContent = uwuifyText(p.prompt_text || '');

      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-copy';
      copyBtn.textContent = 'Copy UwU Pwompt';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text.textContent);
        copyBtn.textContent = 'Copied~! UwU';
        setTimeout(() => { copyBtn.textContent = 'Copy UwU Pwompt'; }, 2000);
      });

      card.appendChild(header);
      card.appendChild(text);
      card.appendChild(copyBtn);
      promptsList.appendChild(card);
    });
  } catch (err) {
    loading.textContent = 'Couwd not woad pwompts >_< Check PwomptWens diwectwy~';
  }

  // Image effect buttons
  let pinkActive = false;

  document.getElementById('add-hearts').addEventListener('click', () => {
    addFloatingEmojis(frame, ['\uD83D\uDC96', '\uD83D\uDC95', '\u2764\uFE0F', '\uD83D\uDC9D'], 8);
  });

  document.getElementById('add-sparkles').addEventListener('click', () => {
    addFloatingEmojis(frame, ['\u2728', '\u2B50', '\uD83C\uDF1F', '\uD83D\uDCAB'], 8);
  });

  document.getElementById('pink-filter').addEventListener('click', () => {
    pinkActive = !pinkActive;
    img.style.filter = pinkActive
      ? 'saturate(1.4) hue-rotate(-15deg) brightness(1.05)'
      : '';
  });

  document.getElementById('reset-effects').addEventListener('click', () => {
    frame.querySelectorAll('.float-emoji').forEach((el) => el.remove());
    img.style.filter = '';
    pinkActive = false;
  });
});

function addFloatingEmojis(container, emojis, count) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'float-emoji';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = `${10 + Math.random() * 80}%`;
    el.style.top = `${10 + Math.random() * 80}%`;
    el.style.animationDelay = `${Math.random() * 2}s`;
    el.style.fontSize = `${16 + Math.random() * 16}px`;
    container.appendChild(el);
  }
}
