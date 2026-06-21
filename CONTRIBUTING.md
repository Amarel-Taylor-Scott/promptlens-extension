# Contributing to PromptLens Extension

Thanks for your interest in contributing! This guide covers local development,
the quality bar, and how to propose changes.

## Repository layout

This repo holds plain HTML/JS/CSS browser extensions — **no build step**:

| Directory | Extension | Manifest |
|-----------|-----------|----------|
| `chrome/` | PromptLens (Chrome/Edge/Brave) | V3 (service worker) |
| `firefox/` | PromptLens (Firefox) | V2 (`browser.*` APIs) |
| `uwu-ize/` | Uwu-ize | V3 |
| `uwu-mode/` | Uwu Mode | V3 |

`releases/` holds packaged `.zip`/`.xpi` artifacts. `scripts/` holds the
manifest validator.

## Local development

Load any extension directory unpacked:

- **Chrome/Edge/Brave**: `chrome://extensions` → enable *Developer mode* →
  *Load unpacked* → select the `chrome/` (or `uwu-ize/`, `uwu-mode/`) folder.
- **Firefox**: `about:debugging` → *This Firefox* → *Load Temporary Add-on* →
  select `firefox/manifest.json`.

Edit the source, then reload the extension from the browser's extensions page.

## Before you open a PR

Run the manifest validator (this is the repo's "build"/CI check):

```bash
node scripts/validate-manifests.mjs
```

It checks every manifest for valid JSON, required keys, a valid version, and
that all referenced icon files exist. CI also runs `web-ext lint` (non-blocking).

Guidelines:

- Keep Chrome on **MV3** and Firefox on **MV2**; mirror behavior across both
  where it applies, and note differences (see the README's Chrome-vs-Firefox
  table).
- Request the **minimum** permissions needed — don't add permissions a feature
  doesn't use.
- Content scripts must use `textContent` (no `innerHTML`) to stay store-compliant.
- Bump the `version` in the relevant `manifest.json` and update `CHANGELOG.md`
  for user-facing changes.

## Pull request process

1. Fork and branch (`feat/...` or `fix/...`).
2. Make the change; run the validator and load-unpacked to smoke test.
3. Open a PR using the template and describe how you verified it (which browser).

## Reporting

Use the issue templates for bugs/features. For security issues, see
[SECURITY.md](SECURITY.md). Never commit API keys or credentials.
