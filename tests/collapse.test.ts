import { describe, expect, it, vi } from 'vitest';
import type { TFile } from 'obsidian';

import { renderDgmo } from '../src/render';
import { toggleCollapsedInSource } from '../src/render/collapse';
import { DgmoEmbed, type DgmoEmbedHost } from '../src/render/embed';

// jsdom has no FontFace; the embed path registers Inter before it renders.
vi.mock('../src/render/fonts', () => ({
  ensureInterFonts: () => Promise.resolve(),
}));

const MINDMAP = [
  'mindmap Treasure',
  '',
  'Root',
  '  Gold collapsed',
  '    Coins',
  '  Maps',
  '    Chart',
].join('\n');

/** Render `source` as an editable code block; `saved` collects each write. */
async function mount(source: string): Promise<{
  container: HTMLElement;
  saved: string[];
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const saved: string[] = [];
  await renderDgmo(source, container, false, 'nord', (next) => {
    saved.push(next);
    return Promise.resolve();
  });
  return { container, saved };
}

function toggleAt(container: HTMLElement, line: number): SVGElement {
  const el = container.querySelector<SVGElement>(
    `.dgmo-svg [data-line-number="${line}"][data-node-toggle], .dgmo-svg [data-line-number="${line}"][data-group-toggle]`
  );
  expect(el, `toggle on line ${line}`).not.toBeNull();
  return el!;
}

/** Click a child of the toggle, the way a pointer lands on its rect or text. */
function clickInside(toggle: Element): void {
  const target = toggle.firstElementChild ?? toggle;
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('collapse toggles write the marker back (code block)', () => {
  it('clicking a folded mindmap node drops its marker', async () => {
    const { container, saved } = await mount(MINDMAP);
    const gold = toggleAt(container, 4);
    expect(gold.getAttribute('aria-expanded')).toBe('false');
    clickInside(gold);
    await flush();
    expect(saved).toHaveLength(1);
    expect(saved[0].split('\n')[3]).toBe('  Gold');
    expect(saved[0].split('\n').filter((l) => l !== '  Gold')).toEqual(
      MINDMAP.split('\n').filter((l) => l !== '  Gold collapsed')
    );
  });

  it('clicking an open mindmap node adds the marker', async () => {
    const { container, saved } = await mount(MINDMAP);
    clickInside(toggleAt(container, 6));
    await flush();
    expect(saved).toEqual([
      MINDMAP.replace('  Maps', '  Maps collapsed: true'),
    ]);
  });

  it('Enter and Space on a focused toggle fold it too', async () => {
    const { container, saved } = await mount(MINDMAP);
    const maps = toggleAt(container, 6);
    expect(maps.getAttribute('tabindex')).toBe('0');
    maps.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    await flush();
    maps.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    );
    await flush();
    expect(saved).toEqual([
      MINDMAP.replace('  Maps', '  Maps collapsed: true'),
      MINDMAP.replace('  Maps', '  Maps collapsed: true'),
    ]);
  });

  it('the written source renders with the fold flipped', async () => {
    const { container, saved } = await mount(MINDMAP);
    clickInside(toggleAt(container, 4));
    await flush();
    const again = await mount(saved[0]);
    expect(toggleAt(again.container, 4).getAttribute('aria-expanded')).toBe(
      'true'
    );
  });

  it('ignores toggles while the source panel is open', async () => {
    const { container, saved } = await mount(MINDMAP);
    container.querySelector<HTMLDetailsElement>(
      'details.dgmo-source-wrap'
    )!.open = true;
    clickInside(toggleAt(container, 4));
    await flush();
    expect(saved).toEqual([]);
  });

  it('a block with no save hook binds nothing', async () => {
    const container = document.createElement('div');
    await renderDgmo(MINDMAP, container, false, 'nord');
    expect(toggleAt(container, 4).hasAttribute('tabindex')).toBe(false);
  });
});

describe('collapse toggles write the marker back (embed)', () => {
  it('a toggle in a ![[file.dgmo]] embed rewrites the file', async () => {
    let content = MINDMAP;
    const file = { path: 'maps/t.dgmo', extension: 'dgmo' } as unknown as TFile;
    const process = vi.fn(
      (_f: TFile, fn: (data: string) => string): Promise<string> => {
        content = fn(content);
        return Promise.resolve(content);
      }
    );
    const host: DgmoEmbedHost = {
      app: {
        vault: { cachedRead: () => Promise.resolve(content), process },
      } as unknown as DgmoEmbedHost['app'],
      getPalette: () => 'nord',
      isDark: () => false,
      registerEmbed: () => {},
      unregisterEmbed: () => {},
    };
    const node = document.createElement('span');
    document.body.appendChild(node);
    await new DgmoEmbed(node, file, 't.dgmo', host).render();
    // An embed stays read-only: no in-block editor.
    expect(node.querySelector('.cm-editor')).toBeNull();
    clickInside(toggleAt(node, 4));
    await flush();
    expect(process).toHaveBeenCalledTimes(1);
    expect(content.split('\n')[3]).toBe('  Gold');
  });
});

/** Fold state of the toggle on `line`, read from a fresh render. */
async function foldedAt(source: string, line: number): Promise<boolean> {
  const container = document.createElement('div');
  await renderDgmo(source, container, false, 'nord');
  const t = toggleAt(container, line);
  const expanded = t.getAttribute('aria-expanded');
  return expanded !== null
    ? expanded === 'false'
    : t.classList.contains('infra-node');
}

describe('toggleCollapsedInSource round-trips every bound chart type', () => {
  const cases: [string, string, number][] = [
    ['org person', 'org Crew\n\nCaptain\n  Mate\n    Swab\n  Cook\n    Boy', 4],
    ['org team', 'org Crew\n\nCaptain\n  [Deck]\n    Ann\n    Bob', 4],
    ['state group', 'state T\n\n[Combat]\n  A -> B\nC -> A', 3],
    [
      'infra group',
      'infra T\n\nedge\n  -> api\n[Backend]\n  api\n    -> db\n  db',
      5,
    ],
    [
      'sequence group',
      'sequence T\n\nAlice -hi-> Bob\n[Crew]\n  Bob\n  Carol\nBob -yo-> Carol',
      4,
    ],
  ];
  it.each(cases)('%s folds, then unfolds', async (_name, source, line) => {
    expect(await foldedAt(source, line)).toBe(false);
    const folded = toggleCollapsedInSource(source, line, true);
    expect(folded).not.toBeNull();
    expect(await foldedAt(folded!, line)).toBe(true);
    const unfolded = toggleCollapsedInSource(folded!, line, false);
    expect(unfolded).toBe(source);
  });

  it('expands the legacy indented infra form', () => {
    const legacy =
      'infra T\n\nedge\n  -> api\n[Backend]\n  collapsed: true\n  api\n  db';
    expect(toggleCollapsedInSource(legacy, 5, false)).toBe(
      'infra T\n\nedge\n  -> api\n[Backend]\n  api\n  db'
    );
  });

  it('leaves chart types whose static render ignores the marker alone', () => {
    expect(
      toggleCollapsedInSource('sitemap T\n\nHome\n  Blog\n    Post', 3, true)
    ).toBeNull();
    expect(
      toggleCollapsedInSource(
        'boxes-and-lines T\n\n[Grp]\n  A -> B\n  B',
        3,
        true
      )
    ).toBeNull();
  });
});
