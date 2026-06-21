# PromptLens Browser Extension

[![CI](https://github.com/Amarel-Taylor-Scott/promptlens-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/Amarel-Taylor-Scott/promptlens-extension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Manifest V3 + V2](https://img.shields.io/badge/manifest-V3%20%2B%20V2-blue.svg)](#)

Right-click any AI-generated image on the web to instantly reverse-engineer its prompt. Works with Midjourney, DALL-E, Stable Diffusion, Flux, and more.

**[PromptLens Website](https://promptlens.polsia.app)** | **[Chrome Web Store](#)** | **[Firefox Add-ons](#)**

---

## How It Works

1. Right-click any image on any website
2. Select **"Generate Prompt with PromptLens"**
3. A new tab opens at `promptlens.polsia.app` showing the generated prompts in real time
4. Copy the prompt and use it in your favorite AI image generator

## Features

- **One-click prompt extraction** from any image on the web
- **4+ AI models** — prompts optimized for Midjourney, DALL-E, Stable Diffusion, and Flux
- **Instant page open** — results page loads immediately while prompts generate in the background
- **Duplicate detection** — previously analyzed images return results instantly
- **Generation history** in the extension popup
- **Settings page** with authentication modes and model preferences
- **Toast notifications** showing real-time progress on the page

## Install

### Option 1: Browser Stores (Recommended)

| Browser | Link | Status |
|---------|------|--------|
| Chrome / Edge / Brave | [Chrome Web Store](#) | Under review |
| Firefox | [Firefox Add-ons](#) | Under review |

### Option 2: Manual Install (Chrome / Edge / Brave)

1. Download the latest release: **[promptlens-chrome-v1.0.0.zip](releases/promptlens-chrome-v1.0.0.zip)**
2. Unzip to a folder on your computer
3. Open `chrome://extensions` in your browser
4. Enable **Developer mode** (top-right toggle)
5. Click **"Load unpacked"**
6. Select the unzipped folder
7. Pin the PromptLens icon in your toolbar

### Option 3: Manual Install (Firefox)

**Temporary install (for testing):**

1. Download: **[promptlens-firefox-v1.0.0.xpi](releases/promptlens-firefox-v1.0.0.xpi)**
2. Open `about:debugging` in Firefox
3. Click **"This Firefox"** in the sidebar
4. Click **"Load Temporary Add-on..."**
5. Select the `.xpi` file
6. Note: temporary add-ons are removed when Firefox closes

**Permanent install:**

1. Download: **[promptlens-firefox-v1.0.0.xpi](releases/promptlens-firefox-v1.0.0.xpi)**
2. Open Firefox → `about:addons`
3. Click the gear icon → **"Install Add-on From File..."**
4. Select the `.xpi` file

> Note: Permanent sideloading of unsigned XPI files requires Firefox Developer Edition or Nightly with `xpinstall.signatures.required` set to `false` in `about:config`. For standard Firefox, use the [Firefox Add-ons](#) store listing once approved.

## Usage

### Right-Click Menu

Right-click any image on any website → **"Generate Prompt with PromptLens"**

The extension fetches the image, uploads it to PromptLens, and opens the results page in a new tab. You'll see a toast notification on the page showing progress.

### Extension Popup

Click the PromptLens icon in your toolbar to see:

- **Auth status** — Anonymous, Email-linked, or API Key
- **Usage bar** — generations used / remaining
- **Recent history** — click any entry to reopen its results page
- **Settings** — gear icon to open the full settings page

### Settings Page

Right-click the extension icon → **Options** (or click the gear in the popup):

| Setting | Description |
|---------|-------------|
| **Anonymous** | 3 free generations/day, no account needed |
| **Email-linked** | 5/day, auto-syncs with your PromptLens account |
| **API Key** | Plan-based limits (Free = 5/month, Pro = unlimited) |
| **Default Models** | Choose which AI models to generate prompts for |
| **Auto-open tab** | Automatically open results in a new tab |
| **Show notifications** | Toggle on-page toast notifications |

Get your API key at [promptlens.polsia.app/settings](https://promptlens.polsia.app/settings).

## Project Structure

```
├── chrome/                 # Chrome/Edge/Brave extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js         Service worker — context menu, image fetch, API calls
│   ├── content.js            Toast notifications (shadow DOM isolated)
│   ├── popup.html/js/css     Extension popup UI
│   ├── options.html/js/css   Settings page
│   └── icons/                Extension icons (16, 48, 128px)
│
├── firefox/                # Firefox extension (Manifest V2)
│   ├── manifest.json         Gecko ID, browser_action, data_collection_permissions
│   ├── background.js         Background script — browser.* APIs
│   ├── content.js            Toast notifications (no innerHTML, store-compliant)
│   ├── popup.html/js/css     Extension popup UI
│   ├── options.html/js/css   Settings page
│   └── icons/                Extension icons
│
├── uwu-ize/                # Sibling extension "Uwu-ize" (Manifest V3)
├── uwu-mode/               # Sibling extension "Uwu Mode" (Manifest V3)
│
├── releases/               # Packaged extensions ready to install
│   ├── promptlens-chrome-v1.0.0.zip
│   ├── promptlens-firefox-v1.0.0.zip
│   └── promptlens-firefox-v1.0.0.xpi
│
├── scripts/
│   └── validate-manifests.mjs   # CI manifest validator (no deps)
├── privacy-policy.html     # Extension privacy policy
├── chrome-listing.md       # Chrome Web Store listing copy
└── firefox-listing.md      # Firefox Add-ons listing copy
```

### Sibling extensions

Alongside PromptLens, this repo also contains two small standalone extensions
(load-unpacked the same way as above):

- **`uwu-ize/`** — *Uwu-ize* (MV3): right-click selected text to uwu-ify it.
- **`uwu-mode/`** — *Uwu Mode* (MV3): toggle uwu-ification for a page.

## Develop

No build step — these are plain HTML/JS/CSS extensions. Load any extension
directory unpacked (see **Install → Manual**). Before committing, validate every
manifest (also run in CI):

```bash
node scripts/validate-manifests.mjs
```

## How It Works (Technical)

1. User right-clicks an image → `chrome.contextMenus` captures the image URL
2. Extension fetches the image as a Blob (10-second timeout, retries with Referer header)
3. Uploads as `multipart/form-data` to `POST /api/analyze-image` (~3 second response)
4. Server returns `{ shareId }` immediately — prompts generate asynchronously
5. Extension opens `promptlens.polsia.app/p/{shareId}` in a new tab
6. Results page handles its own loading UI as prompts are generated
7. If extension can't fetch the image (CORS), falls back to `POST /api/v1/extension/generate` with `{ image_url }` for server-side fetching

### Key Differences: Chrome vs Firefox

| Feature | Chrome | Firefox |
|---------|--------|---------|
| Manifest | V3 | V2 |
| Background | Service worker (no DOM) | Background script (has DOM) |
| APIs | `chrome.*` | `browser.*` (Promise-native) |
| Script injection | `chrome.scripting.executeScript()` | `browser.tabs.executeScript()` |
| Badge | `chrome.action.setBadge*` | `browser.browserAction.setBadge*` |
| Content script | Uses `textContent` (no `innerHTML`) | Same (store-compliant) |

## Privacy

- Only processes images you explicitly right-click — never scans pages
- No browsing history collected
- Settings stored locally in your browser
- Images processed temporarily on PromptLens servers, not retained permanently
- Full policy: [privacy-policy.html](privacy-policy.html)

## Free Tier

3 generations per day with no account. Link your email for 5/day, or sign up at [promptlens.polsia.app](https://promptlens.polsia.app) for Pro access with unlimited generations.

## Contributing

Contributions are welcome! These are plain HTML/JS/CSS extensions with no build
step — see [CONTRIBUTING.md](CONTRIBUTING.md) for load-unpacked development, the
manifest validator, and the PR process, and note our
[Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately per
[SECURITY.md](SECURITY.md). Release history is in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © Amarel Taylor Scott

## Links

- [PromptLens Website](https://promptlens.polsia.app)
- [PromptLens Gallery](https://promptlens.polsia.app/explore)
- [Privacy Policy](https://promptlens.polsia.app/privacy)
- [Contact](https://promptlens.polsia.app/contact)
