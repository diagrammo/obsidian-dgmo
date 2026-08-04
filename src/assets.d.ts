// Ambient types for the non-code files esbuild inlines at build time (see the
// `loader` map in esbuild.config.mjs). Declaring them here rather than reaching
// for `@ts-expect-error` at each import keeps the imported values typed — an
// `any`-typed import spreads through everything it touches, and Obsidian's
// review scorecard counts every such use.

// Bundled map-data JSON assets are imported for their runtime content only
// (esbuild inlines them); we never need their inferred literal types — and
// inferring them from the ~500 KB topojson files would bog down `tsc`. Type
// them as `unknown` and cast at the injection site (see render/map-data.ts).
declare module '*.json' {
  const value: unknown;
  export default value;
}

// esbuild's `text` loader — the example note, inlined as a string.
declare module '*.md' {
  const value: string;
  export default value;
}

// esbuild's `dataurl` loader — a `data:font/woff2;base64,…` URL string.
declare module '*.woff2' {
  const value: string;
  export default value;
}
