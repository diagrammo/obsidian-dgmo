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
