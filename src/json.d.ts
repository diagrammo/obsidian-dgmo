// Bundled map-data JSON assets are imported for their runtime content only
// (esbuild inlines them); we never need their inferred literal types — and
// inferring them from the ~500 KB topojson files would bog down `tsc`. Type
// them as `unknown` and cast at the injection site (see map-data.ts).
declare module '*.json' {
  const value: unknown;
  export default value;
}
