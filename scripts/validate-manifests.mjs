#!/usr/bin/env node
// Dependency-free validator for every extension manifest in this repo.
// Checks: valid JSON, required keys, version format, and that all icon files
// referenced by the manifest actually exist on disk. Exits non-zero on failure.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const EXT_DIRS = ['chrome', 'firefox', 'uwu-ize', 'uwu-mode'];
const REQUIRED = ['manifest_version', 'name', 'version'];

let failures = 0;
const fail = (where, msg) => { console.error(`  ✗ ${where}: ${msg}`); failures++; };

for (const dir of EXT_DIRS) {
  const path = join(dir, 'manifest.json');
  if (!existsSync(path)) { fail(path, 'manifest.json not found'); continue; }

  let m;
  try {
    m = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(path, `invalid JSON — ${e.message}`);
    continue;
  }

  for (const k of REQUIRED) if (!(k in m)) fail(path, `missing required key "${k}"`);

  if (![2, 3].includes(m.manifest_version)) fail(path, `manifest_version must be 2 or 3 (got ${m.manifest_version})`);
  if (typeof m.version === 'string' && !/^\d+(\.\d+){0,3}$/.test(m.version)) {
    fail(path, `version "${m.version}" is not a valid dotted version`);
  }

  // Collect icon paths from `icons` and (MV2) browser_action / (MV3) action.
  const iconPaths = new Set();
  for (const v of Object.values(m.icons ?? {})) iconPaths.add(v);
  const actionIcons = m.action?.default_icon ?? m.browser_action?.default_icon;
  if (actionIcons) {
    if (typeof actionIcons === 'string') iconPaths.add(actionIcons);
    else for (const v of Object.values(actionIcons)) iconPaths.add(v);
  }
  for (const rel of iconPaths) {
    if (!existsSync(join(dirname(path), rel))) fail(path, `icon file missing: ${rel}`);
  }

  if (failures === 0 || !path) {/* noop */}
  console.log(`  ✓ ${path} — mv${m.manifest_version} "${m.name}" v${m.version}`);
}

if (failures > 0) {
  console.error(`\n${failures} manifest problem(s) found.`);
  process.exit(1);
}
console.log(`\nAll ${EXT_DIRS.length} extension manifests valid.`);
