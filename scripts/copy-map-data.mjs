// Copies the map chart-type data JSON out of the installed @diagrammo/dgmo
// package into ./vendor/map-data so src/map-data.ts can inline it at build time.
//
// Why not import straight from the package? dgmo ships these files (its
// package.json `files` includes `src`), but its `exports` map exposes no data
// subpath, so a bare `@diagrammo/dgmo/...json` import is rejected
// (ERR_PACKAGE_PATH_NOT_EXPORTED). Reaching the sibling source repo
// (`../../dgmo/src/...`) works locally but not in CI, where only this repo +
// node_modules exist. Copying from node_modules sidesteps both: it's a plain
// relative import of a local file, and the source is present after `pnpm
// install` in every environment.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// dgmo 0.48.0 became ESM-only and stopped publishing raw `src/`; the map JSON
// now ships at `dist/map-data/` (was `src/map/data/`).
const srcDir = join(root, 'node_modules', '@diagrammo', 'dgmo', 'dist', 'map-data');
const outDir = join(root, 'vendor', 'map-data');

// Keep in sync with the imports in src/map-data.ts.
const FILES = [
  'gazetteer.json',
  'lakes.json',
  'mountain-ranges.json',
  'na-lakes.json',
  'na-land.json',
  'rivers.json',
  'us-states.json',
  'water-bodies.json',
  'world-coarse.json',
  'world-detail.json',
];

if (!existsSync(srcDir)) {
  console.error(
    `[copy-map-data] @diagrammo/dgmo data dir not found at ${srcDir} — is the dependency installed?`
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

for (const file of FILES) {
  const from = join(srcDir, file);
  if (!existsSync(from)) {
    console.error(`[copy-map-data] missing source asset: ${from}`);
    process.exit(1);
  }
  copyFileSync(from, join(outDir, file));
}

console.log(`[copy-map-data] copied ${FILES.length} map data files to vendor/map-data`);
