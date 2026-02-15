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
  external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*'],
  format: 'cjs',
  target: 'es2020',
  platform: 'browser',
  sourcemap: isWatch ? 'inline' : false,
  logLevel: 'info',
  treeShaking: true,
  absWorkingDir: __dirname,
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(config);
}
