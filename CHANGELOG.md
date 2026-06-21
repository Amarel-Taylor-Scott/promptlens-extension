# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Community health files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, issue/PR templates, and `CODEOWNERS`.
- `scripts/validate-manifests.mjs` (dependency-free manifest validator) and a
  GitHub Actions CI workflow that runs it + `web-ext lint`.

## [1.0.0] - 2026-06-21

### Added
- PromptLens extension for Chrome/Edge/Brave (Manifest V3) and Firefox
  (Manifest V2): right-click any image to reverse-engineer its prompt, with a
  popup (auth/usage/history), settings page, and on-page toast notifications.
- Sibling extensions: Uwu-ize and Uwu Mode (Manifest V3).
- Packaged releases under `releases/` and store listing copy
  (`chrome-listing.md`, `firefox-listing.md`, `privacy-policy.html`).

[Unreleased]: https://github.com/Amarel-Taylor-Scott/promptlens-extension/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Amarel-Taylor-Scott/promptlens-extension/releases/tag/v1.0.0
