// Source of truth lives in example-note.md so the markdown can be
// previewed directly in any Obsidian vault. esbuild's text loader
// (configured in esbuild.config.mjs) inlines the file at build time.
// Typed by the `*.md` declaration in assets.d.ts.
import noteContent from './example-note.md';

export const EXAMPLE_NOTE: string = noteContent;
