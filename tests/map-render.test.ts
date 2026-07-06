import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { palettes } from '@diagrammo/dgmo';
import {
  parseMap,
  renderMapForExport,
  resolveMap,
} from '@diagrammo/dgmo/advanced';
import { describe, expect, it } from 'vitest';

import { mapData } from '../src/map-data';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  join(here, 'fixtures', 'map-go-ahead.dgmo'),
  'utf8'
);

// Regression: the plugin used to render maps through the public `render()`,
// whose map branch calls Node-only `loadMapData()`. In the Obsidian renderer
// that returned an empty SVG ("No SVG output from dgmo render()"). The plugin
// now bundles the geo data and renders via the DI pipeline — these tests guard
// that the data is bundled and the DI render produces a real SVG.
describe('map rendering (Obsidian DI pipeline)', () => {
  it('bundles every map asset resolveMap requires', () => {
    for (const key of [
      'worldCoarse',
      'worldDetail',
      'usStates',
      'gazetteer',
      'airports',
    ] as const) {
      expect(mapData[key], `missing bundled asset: ${key}`).toBeTruthy();
    }
  });

  // Regression: airports.json was never added to the bundle when IATA
  // resolution shipped, so `route DEN -> LAX` failed with
  // E_MAP_UNKNOWN_AIRPORT_CODE in Obsidian while working in the app.
  it('resolves IATA airport codes', () => {
    const source = ['map', '', 'DEN ~Demian and Ramos~> LAX'].join('\n');
    const resolved = resolveMap(parseMap(source), mapData);
    const errors = resolved.diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('resolves the fixture with no error diagnostics', () => {
    const resolved = resolveMap(parseMap(fixture), mapData);
    const errors = resolved.diagnostics.filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('renders a non-empty SVG into a DOM container', () => {
    const resolved = resolveMap(parseMap(fixture), mapData);
    const div = document.createElement('div');
    renderMapForExport(div, resolved, mapData, palettes.nord.light, false, {
      width: 1200,
      height: 800,
    });

    const svg = div.querySelector('svg');
    expect(svg).not.toBeNull();
    // us-states basemap + POI markers ⇒ many paths/shapes were drawn.
    expect(svg!.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
