import { describe, expect, it, vi } from 'vitest';
import type { TFile } from 'obsidian';

import { renderDgmo } from '../src/render';
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

const KINDS = [
  'data-node-toggle',
  'data-group-toggle',
  'data-section-toggle',
  'data-note-toggle',
] as const;

function toggleAt(container: HTMLElement, line: number): SVGElement {
  const el = container.querySelector<SVGElement>(
    KINDS.map((k) => `.dgmo-svg [data-line-number="${line}"][${k}]`).join(', ')
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

/**
 * One case per toggle kind and chart type: a source, the line of the thing to
 * fold, and the attribute its toggle carries. A click on the open toggle must
 * write a source whose render shows it folded, and a click on that folded
 * toggle must write the original back.
 */
const CASES: [string, string, number, (typeof KINDS)[number]][] = [
  ['mindmap node', 'mindmap T\n  A\n    A1\n  B', 2, 'data-node-toggle'],
  [
    'org person',
    'org Crew\n\nCaptain\n  Mate\n    Swab\n  Cook',
    4,
    'data-node-toggle',
  ],
  [
    'org team',
    'org Crew\n\nCaptain\n  [Deck]\n    Ann\n    Bob',
    4,
    'data-node-toggle',
  ],
  [
    'sitemap page',
    'sitemap T\n\nHome\n  Blog\n    Post\n  About',
    4,
    'data-node-toggle',
  ],
  [
    'sitemap container',
    'sitemap T\n\nHome\n  [Shop]\n    Cart\n    Pay',
    4,
    'data-node-toggle',
  ],
  [
    'infra group',
    'infra T\n\nedge\n  -> api\n[Backend]\n  api\n    -> db\n  db',
    5,
    'data-node-toggle',
  ],
  [
    'state group',
    'state T\n\n[Combat]\n  A -> B\nC -> A',
    3,
    'data-group-toggle',
  ],
  [
    'sequence group',
    'sequence T\n\nAlice -hi-> Bob\n[Crew]\n  Bob\n  Carol\nBob -yo-> Carol',
    4,
    'data-group-toggle',
  ],
  [
    'sequence section',
    'sequence T\nA -hi-> B\n== Phase ==\nA -one-> B\nB -two-> A',
    3,
    'data-section-toggle',
  ],
  [
    'sequence note',
    'sequence T\nA -> B\nnote right of B\n  First\n  Second\nB -> A',
    3,
    'data-note-toggle',
  ],
  [
    'boxes-and-lines group',
    'boxes-and-lines T\n\n[Core]\n  A\n  B\nA -> B\nC -> A',
    3,
    'data-group-toggle',
  ],
  [
    'timeline lane',
    'timeline\n\n[Alpha]\n  2020 Kickoff\n  2021 Launch\n[Beta]\n  2020 Draft',
    3,
    'data-group-toggle',
  ],
  [
    'journey-map phase',
    'journey-map T\n\n[Discover]\n  Search\n  Compare\n[Book]\n  Pay',
    3,
    'data-group-toggle',
  ],
  [
    'raci phase',
    'raci T\n\nroles\n  Dev\n  PM\n\n[Plan]\n  Scope\n    Dev: R\n    PM: A\n[Build]\n  Code\n    Dev: R',
    7,
    'data-group-toggle',
  ],
  [
    'kanban column',
    'kanban\n[To Do]\n  Task 1\n[Done]\n  Task 2',
    2,
    'data-group-toggle',
  ],
  [
    'gantt group',
    'gantt\n[Backend]\n  API duration: 5d\n[Frontend]\n  UI duration: 3d',
    2,
    'data-group-toggle',
  ],
  [
    'block group',
    'block T\n\n[Services]\n  [Auth] [Orders]\n\n[Data]\n  [Postgres] [Redis]',
    6,
    'data-group-toggle',
  ],
  [
    'event-line era',
    'event-line X\nno-scale\n\n[One]\n  2020 A\n    one\n\n[Two]\n  2021 B\n    two',
    4,
    'data-group-toggle',
  ],
];

describe('every toggle kind writes back and round-trips', () => {
  it.each(CASES)('%s', async (_name, source, line, kind) => {
    const open = await mount(source);
    const t = toggleAt(open.container, line);
    expect(t.hasAttribute(kind)).toBe(true);
    expect(t.getAttribute('aria-expanded')).toBe('true');
    expect(t.getAttribute('tabindex')).toBe('0');
    clickInside(t);
    await flush();
    expect(open.saved).toHaveLength(1);

    const shut = await mount(open.saved[0]);
    const folded = toggleAt(shut.container, line);
    expect(folded.getAttribute('aria-expanded')).toBe('false');
    folded.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );
    await flush();
    expect(shut.saved).toEqual([source]);
  });

  it('every toggle in every case writes something', async () => {
    for (const [name, source] of CASES) {
      const { container, saved } = await mount(source);
      const all = [
        ...container.querySelectorAll<SVGElement>(
          KINDS.map((k) => `.dgmo-svg [${k}][data-line-number]`).join(', ')
        ),
      ];
      for (const t of all) {
        saved.length = 0;
        clickInside(t);
        await flush();
        expect(
          saved,
          `${name} line ${t.getAttribute('data-line-number')}`
        ).toHaveLength(1);
      }
    }
  });

  it('expands the legacy indented infra form', async () => {
    const legacy =
      'infra T\n\nedge\n  -> api\n[Backend]\n  collapsed: true\n  api\n  db';
    const { container, saved } = await mount(legacy);
    clickInside(toggleAt(container, 5));
    await flush();
    expect(saved).toEqual([
      'infra T\n\nedge\n  -> api\n[Backend]\n  api\n  db',
    ]);
  });

  it('a second click while the first save is in flight writes nothing', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const saved: string[] = [];
    let release: () => void = () => {};
    await renderDgmo(MINDMAP, container, false, 'nord', (next) => {
      saved.push(next);
      return new Promise<void>((r) => {
        release = r;
      });
    });
    clickInside(toggleAt(container, 6));
    clickInside(toggleAt(container, 6));
    await flush();
    expect(saved).toHaveLength(1);
    release();
  });
});
