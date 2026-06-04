// Copies the curated "all chart types" example note from the sibling
// dgmo-content repo into ./src/example-note.md, the file esbuild's text
// loader inlines at build time (see esbuild.config.mjs).
//
// dgmo-content is the single source of truth for example diagrams shared
// across the ecosystem. It is NOT an npm dependency of this repo, so the
// sibling checkout only exists in a local workspace — never in CI, where
// only this repo + node_modules are present. We therefore commit the
// generated src/example-note.md and treat it as both the build input and
// the CI fallback: this script overwrites it from dgmo-content when the
// sibling is present, and quietly no-ops (leaving the committed copy
// intact) when it is not.

import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, '..', 'dgmo-content', 'examples', 'all-chart-types.md');
const to = join(root, 'src', 'example-note.md');

if (!existsSync(from)) {
  console.log(
    `[copy-example-note] sibling dgmo-content not found at ${from} — keeping committed src/example-note.md`
  );
  process.exit(0);
}

copyFileSync(from, to);
console.log('[copy-example-note] synced src/example-note.md from dgmo-content');
