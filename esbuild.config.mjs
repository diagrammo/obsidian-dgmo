import esbuild from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'main.js',
  // dgmo's Node-only seams (the map data loader, render.ts jsdom) lazily
  // import node builtins. Obsidian runs in Electron, which provides them at
  // runtime, so we leave them external rather than trying to bundle them for
  // the browser platform. Without this the map chart type's `fs/promises`,
  // `url`, and `path` imports fail to resolve at build time.
  external: [
    'obsidian',
    'electron',
    '@codemirror/*',
    '@lezer/*',
    'jsdom',
    'node:*',
    'fs',
    'fs/promises',
    'path',
    'url',
  ],
  format: 'cjs',
  target: 'es2020',
  platform: 'browser',
  // Squeeze the release bundle under 5 MB. Above that, Obsidian Sync's Standard
  // plan refuses to sync the file, so a paying user cannot get the plugin onto
  // their other devices — the bundle was 5.3 MB and the store flags it.
  // Whitespace and syntax only: identifiers keep their real names, so the
  // shipped file stays readable and this is nowhere near the "no obfuscated
  // code" line in Obsidian's developer policy. 5.30 MB → 4.00 MB.
  // Not in watch mode, where the inline sourcemap is the point.
  minifyWhitespace: !isWatch,
  minifySyntax: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  logLevel: 'info',
  treeShaking: true,
  absWorkingDir: __dirname,
  loader: {
    '.woff2': 'dataurl',
    '.md': 'text',
  },
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(config);
}
