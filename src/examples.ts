// Source of truth lives in example-note.md so the markdown can be
// previewed directly in any Obsidian vault. esbuild's text loader
// (configured in esbuild.config.mjs) inlines the file at build time.
// @ts-expect-error — .md imports handled by esbuild text loader
import noteContent from './example-note.md';

export const EXAMPLE_NOTE: string = noteContent;
