// Map chart-type data assets, bundled into the plugin's main.js. dgmo's
// `loadMapData()` reads these from disk via Node `fs` (CLI/SSR only) — that
// path can't work in the Obsidian renderer (the CJS bundle has no usable
// `import.meta.url`/`__dirname` near the data, and the JSON isn't shipped with
// the plugin). So we inject them by dependency injection into
// `resolveMap`/`renderMapForExport` instead, exactly as the desktop app does.
//
// Imported from ./vendor/map-data, which scripts/copy-map-data.mjs populates
// from the installed @diagrammo/dgmo package before typecheck/build (see that
// script for why we copy rather than import the package subpath directly).
// esbuild's default JSON loader inlines the content at build time, so the
// published main.js is self-contained — no runtime file lookup, no extra
// release assets.
import type { MapData } from '@diagrammo/dgmo/advanced';

import gazetteer from '../vendor/map-data/gazetteer.json';
import lakes from '../vendor/map-data/lakes.json';
import mountainRanges from '../vendor/map-data/mountain-ranges.json';
import naLakes from '../vendor/map-data/na-lakes.json';
import naLand from '../vendor/map-data/na-land.json';
import rivers from '../vendor/map-data/rivers.json';
import usStates from '../vendor/map-data/us-states.json';
import waterBodies from '../vendor/map-data/water-bodies.json';
import worldCoarse from '../vendor/map-data/world-coarse.json';
import worldDetail from '../vendor/map-data/world-detail.json';

/** The assets dgmo's `resolveMap`/`renderMap` consume (DI). */
export const mapData: MapData = {
  worldCoarse,
  worldDetail,
  usStates,
  lakes,
  rivers,
  mountainRanges,
  naLand,
  naLakes,
  waterBodies,
  gazetteer,
} as unknown as MapData;
