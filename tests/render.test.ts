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
    expect(toolbar.querySelector('button.dgmo-expand')).not.toBeNull();

    const docs = toolbar.querySelector<HTMLAnchorElement>('a.dgmo-docs');
    expect(docs).not.toBeNull();
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
