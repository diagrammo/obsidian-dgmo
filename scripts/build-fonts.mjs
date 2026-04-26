// Regenerate assets/Inter-*.woff2 from the TTF sources shipped in @diagrammo/dgmo.
// Run when the upstream dgmo Inter version changes:
//   node scripts/build-fonts.mjs
//
// Requires `wawoff2` (devDependency) — pure-WASM woff2 converter.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import wawoff from 'wawoff2';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'node_modules/@diagrammo/dgmo/fonts');
const outDir = join(root, 'assets');
mkdirSync(outDir, { recursive: true });

for (const name of ['Inter-Regular', 'Inter-Bold']) {
  const ttf = readFileSync(join(srcDir, `${name}.ttf`));
  const woff2 = await wawoff.compress(ttf);
  writeFileSync(join(outDir, `${name}.woff2`), Buffer.from(woff2));
  const pct = (100 - (100 * woff2.length) / ttf.length).toFixed(1);
  console.log(`${name}: ${ttf.length} -> ${woff2.length} bytes (${pct}% smaller)`);
}

copyFileSync(join(srcDir, 'LICENSE-Inter.txt'), join(outDir, 'LICENSE-Inter.txt'));
console.log('LICENSE-Inter.txt copied.');
