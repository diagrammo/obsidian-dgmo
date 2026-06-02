// Map chart-type data assets, bundled into the plugin's main.js. dgmo's
// `loadMapData()` reads these from disk via Node `fs` (CLI/SSR only) — that
// path can't work in the Obsidian renderer (the CJS bundle has no usable
// `import.meta.url`/`__dirname` near the data, and the JSON isn't shipped with
// the plugin). So we inject them by dependency injection into
// `resolveMap`/`renderMapForExport` instead, exactly as the desktop app does.
//
// Imported from the committed dgmo source JSON (sibling repo). esbuild's default
// JSON loader inlines the content at build time, so the published main.js is
// self-contained — no runtime file lookup, no extra release assets.
import type { MapData } from '@diagrammo/dgmo/internal';

import gazetteer from '../../dgmo/src/map/data/gazetteer.json';
import lakes from '../../dgmo/src/map/data/lakes.json';
import naLakes from '../../dgmo/src/map/data/na-lakes.json';
import naLand from '../../dgmo/src/map/data/na-land.json';
import rivers from '../../dgmo/src/map/data/rivers.json';
import usStates from '../../dgmo/src/map/data/us-states.json';
import waterBodies from '../../dgmo/src/map/data/water-bodies.json';
import worldCoarse from '../../dgmo/src/map/data/world-coarse.json';
import worldDetail from '../../dgmo/src/map/data/world-detail.json';

/** The assets dgmo's `resolveMap`/`renderMap` consume (DI). */
export const mapData: MapData = {
  worldCoarse,
  worldDetail,
  usStates,
  lakes,
  rivers,
  naLand,
  naLakes,
  waterBodies,
  gazetteer,
} as unknown as MapData;
