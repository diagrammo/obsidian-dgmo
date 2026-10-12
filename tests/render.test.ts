import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { renderDgmo } from '../src/render';

const here = dirname(fileURLToPath(import.meta.url));
const mapFixture = readFileSync(
  join(here, 'fixtures', 'map-go-ahead.dgmo'),
  'utf8'
);

const CHART = 'bar chart\nBlack Pearl 42\nQueen Anne 37';

// BL-114: rendering mounts the standard embed block from @diagrammo/dgmo/block
// — diagram hero in `.dgmo-svg`, hover-reveal toolbar as the <summary> of a
// native <details> source panel, unified `.dgmo--error` card on failure.
describe('renderDgmo (standard embed block)', () => {
  beforeAll(() => {
    // The map path uses Obsidian's `activeDocument` global (popout-window
    // support). jsdom has no such global; alias it to the test document.
    (globalThis as { activeDocument?: Document }).activeDocument = document;
  });

  it('mounts the showcase block: svg hero + toolbar + source panel', async () => {
    const container = document.createElement('div');
    await renderDgmo(CHART, container, false, 'nord');

    const block = container.querySelector('figure.dgmo.dgmo--showcase');
    expect(block).not.toBeNull();
    expect(block!.querySelector('.dgmo-svg > svg')).not.toBeNull();

    const details = block!.querySelector('details.dgmo-source-wrap');
    expect(details).not.toBeNull();
    expect(details!.querySelector('summary.dgmo-toolbar')).not.toBeNull();
    expect(
      details!.querySelector('.dgmo-source-inner .dgmo-pre')
    ).not.toBeNull();
  });

  it('copy button carries the trimmed source', async () => {
    const container = document.createElement('div');
    await renderDgmo(`\n${CHART}\n`, container, false, 'nord');

    const copy = container.querySelector<HTMLButtonElement>('button.dgmo-copy');
    expect(copy).not.toBeNull();
    expect(copy!.dataset['dgmoSource']).toBe(CHART);
  });

  it('open-in-editor link carries palette + theme like the old edit link', async () => {
    const container = document.createElement('div');
    await renderDgmo(CHART, container, true, 'catppuccin');

    const open = container.querySelector<HTMLAnchorElement>('a.dgmo-open');
    expect(open).not.toBeNull();
    const href = open!.getAttribute('href')!;
    expect(href).toContain('online.diagrammo.app');
    expect(href).toContain('pal=catppuccin');
    // theme=dark is the share-URL default and therefore omitted.
    expect(href).not.toContain('th=');
  });

  it('injects the expand button + a chart-type docs link into the toolbar', async () => {
    const container = document.createElement('div');
    await renderDgmo(CHART, container, false, 'nord');

    const toolbar = container.querySelector('summary.dgmo-toolbar')!;
    const expand = toolbar.querySelector('button.dgmo-expand');
    expect(expand).not.toBeNull();

    const docs = toolbar.querySelector<HTMLAnchorElement>('a.dgmo-docs');
    expect(docs).not.toBeNull();
    // No native title attr anywhere in the toolbar — Obsidian tooltips the
    // aria-label; a title would add a second, laggy OS tooltip on top.
    expect(toolbar.querySelectorAll('[title]')).toHaveLength(0);
    // The </> toggle's hover name survives the strip as an aria-label.
    expect(
      toolbar.querySelector('.dgmo-toggle')?.getAttribute('aria-label')
    ).toBe('View DGMO source');
    expect(docs!.getAttribute('href')).toBe(
      'https://diagrammo.app/docs/chart-bar'
    );
    // Docs sits left of the open-in-editor link.
    const links = Array.from(toolbar.querySelectorAll('a'));
    const docsIdx = links.findIndex((a) => a.classList.contains('dgmo-docs'));
    const openIdx = links.findIndex((a) => a.classList.contains('dgmo-open'));
    expect(docsIdx).toBeGreaterThanOrEqual(0);
    expect(docsIdx).toBeLessThan(openIdx);
  });

  it('re-render after clearing leaves exactly one block (no stacking)', async () => {
    const container = document.createElement('div');
    await renderDgmo(CHART, container, false, 'nord');
    container.replaceChildren(); // DgmoCodeBlock.render() empties first
    await renderDgmo(CHART, container, false, 'nord');

    expect(container.querySelectorAll('figure.dgmo')).toHaveLength(1);
    expect(container.querySelectorAll('.dgmo-toolbar')).toHaveLength(1);
  });

  it('shows the unified error card on a parse error', async () => {
    const container = document.createElement('div');
    await renderDgmo(
      'bar chart\nBlack Pearl not-a-number',
      container,
      false,
      'nord'
    );

    const card = container.querySelector('.dgmo--error');
    expect(card).not.toBeNull();
    expect(card!.getAttribute('role')).toBe('alert');
    expect(container.querySelector('figure.dgmo--showcase')).toBeNull();
  });

  it('maps get the same block chrome via the DI pipeline', async () => {
    const container = document.createElement('div');
    await renderDgmo(mapFixture, container, false, 'nord');

    const block = container.querySelector('figure.dgmo.dgmo--showcase');
    expect(block).not.toBeNull();
    const svg = block!.querySelector<SVGSVGElement>('.dgmo-svg > svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('viewBox')).toBeTruthy();
    expect(block!.querySelector('summary.dgmo-toolbar')).not.toBeNull();
  });
});

// Palette precedence (palette slice 2, #1038): the plugin setting is the
// surface DEFAULT; a file's own `palette` line beats it.
describe('renderDgmo palette precedence', () => {
  const body = 'bar chart\nBlack Pearl 42\nQueen Anne 37';
  const withLine = `palette nord\n${body}`;
  const bgOf = (c: HTMLElement): string | undefined =>
    c.querySelector<HTMLElement>('.dgmo-svg')?.dataset['dgmoBg'];

  beforeAll(() => {
    (globalThis as { activeDocument?: Document }).activeDocument = document;
  });

  it("the file's palette line beats the plugin setting", async () => {
    const withIt = document.createElement('div');
    await renderDgmo(withLine, withIt, false, 'catppuccin');
    const without = document.createElement('div');
    await renderDgmo(body, without, false, 'catppuccin');

    // Same source, nord set as the plugin default: must equal the file's line.
    const nordDefault = document.createElement('div');
    await renderDgmo(body, nordDefault, false, 'nord');

    expect(bgOf(withIt)).toBe(bgOf(nordDefault));
    expect(bgOf(withIt)).not.toBe(bgOf(without));
  });

  // Maps take their own path (the bundled geo data). A `palette` line goes at
  // the bottom of the file, and the map once parsed it as a region: an error
  // card, `Unknown region "palette nord"`, instead of a map.
  it("a map's palette line beats the plugin setting", async () => {
    const mapBg = (c: HTMLElement): string | undefined =>
      /background:\s*([^;]+)/.exec(
        c.querySelector('.dgmo-svg svg')?.getAttribute('style') ?? ''
      )?.[1];
    const draw = async (src: string, paletteId: string) => {
      const c = document.createElement('div');
      await renderDgmo(src, c, false, paletteId);
      return c;
    };

    const without = await draw(mapFixture, 'catppuccin');
    const nordDefault = await draw(mapFixture, 'nord');
    expect(mapBg(nordDefault)).toBeTruthy();
    expect(mapBg(nordDefault)).not.toBe(mapBg(without));

    // At the bottom, where the reference puts it, and first, which dgmo
    // accepts as well.
    for (const src of [
      `${mapFixture}\npalette nord\n`,
      `palette nord\n${mapFixture}`,
    ]) {
      const withIt = await draw(src, 'catppuccin');
      expect(withIt.querySelector('.dgmo--error')).toBeNull();
      expect(mapBg(withIt)).toBe(mapBg(nordDefault));
    }
  });

  // dgmo serialises the map with `outerHTML`, which writes U+00A0 as `&nbsp;`.
  it('a map label holding a non-breaking space still draws', async () => {
    const c = document.createElement('div');
    await renderDgmo(
      mapFixture.replace('label: ATH', 'label: A\u00A0TH'),
      c,
      false,
      'nord'
    );
    expect(c.querySelector('.dgmo--error')).toBeNull();
    expect(c.querySelector('.dgmo-svg svg path')).not.toBeNull();
  });
});
