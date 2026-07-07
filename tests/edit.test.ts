import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import {
  containsFence,
  enableBlockEditing,
  replaceFencedSource,
} from '../src/edit';
import { renderDgmo, updateDiagram } from '../src/render';

const SOURCE = 'bar chart\ntitle Booty by Ship\nBlack Pearl 42\nQueen Anne 37';

/** Minimal standard-block skeleton (matches @diagrammo/dgmo/block markup). */
function makeBlock(): HTMLElement {
  const host = document.createElement('div');
  const figure = document.createElement('figure');
  figure.className = 'dgmo dgmo--showcase';

  const hero = document.createElement('div');
  hero.className = 'dgmo-svg';
  hero.appendChild(
    document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  );

  const details = document.createElement('details');
  details.className = 'dgmo-source-wrap';
  const summary = document.createElement('summary');
  summary.className = 'dgmo-toolbar';
  const inner = document.createElement('div');
  inner.className = 'dgmo-source-inner';
  const pre = document.createElement('pre');
  pre.className = 'dgmo-pre';
  pre.textContent = SOURCE;
  inner.appendChild(pre);
  details.append(summary, inner);

  figure.append(hero, details);
  host.appendChild(figure);
  document.body.appendChild(host);
  return figure;
}

function pencil(block: HTMLElement): HTMLButtonElement {
  return block.querySelector<HTMLButtonElement>('button.dgmo-edit')!;
}

function textarea(block: HTMLElement): HTMLTextAreaElement | null {
  return block.querySelector<HTMLTextAreaElement>('textarea.dgmo-edit-area');
}

function key(
  el: HTMLElement,
  keyName: string,
  init: KeyboardEventInit = {}
): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: keyName,
      bubbles: true,
      cancelable: true,
      ...init,
    })
  );
}

describe('enableBlockEditing', () => {
  let block: HTMLElement;
  let update: Mock<(source: string) => Promise<void>>;
  let commit: Mock<(next: string) => Promise<void>>;

  beforeEach(() => {
    vi.useFakeTimers();
    block = makeBlock();
    update = vi.fn<(source: string) => Promise<void>>().mockResolvedValue();
    commit = vi.fn<(next: string) => Promise<void>>().mockResolvedValue();
    enableBlockEditing(block, SOURCE, { update, commit });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('adds a pencil button to the toolbar', () => {
    expect(pencil(block)).not.toBeNull();
    expect(pencil(block).querySelector('svg')).not.toBeNull();
  });

  it('pencil click opens the source panel and swaps in a textarea', () => {
    pencil(block).click();

    const details = block.querySelector<HTMLDetailsElement>('details')!;
    expect(details.open).toBe(true);
    const ta = textarea(block)!;
    expect(ta).not.toBeNull();
    expect(ta.value).toBe(SOURCE);
    expect(
      block.querySelector('pre.dgmo-pre')!.classList.contains(
        'dgmo-pre--hidden'
      )
    ).toBe(true);
    expect(block.classList.contains('dgmo--editing')).toBe(true);
  });

  it('typing live-updates the diagram after the debounce', () => {
    pencil(block).click();
    const ta = textarea(block)!;
    ta.value = SOURCE + '\nFlying Dutchman 12';
    ta.dispatchEvent(new Event('input'));

    expect(update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(350);
    expect(update).toHaveBeenCalledWith(SOURCE + '\nFlying Dutchman 12');
  });

  it('rapid keystrokes collapse into one update', () => {
    pencil(block).click();
    const ta = textarea(block)!;
    for (const suffix of ['a', 'ab', 'abc']) {
      ta.value = `${SOURCE}\n${suffix}`;
      ta.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(350);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(`${SOURCE}\nabc`);
  });

  it('Escape cancels: editor closes, original diagram restored', () => {
    pencil(block).click();
    const ta = textarea(block)!;
    ta.value = 'draft';
    ta.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    update.mockClear();

    key(ta, 'Escape');
    expect(textarea(block)).toBeNull();
    expect(
      block.querySelector('pre.dgmo-pre')!.classList.contains(
        'dgmo-pre--hidden'
      )
    ).toBe(false);
    expect(update).toHaveBeenCalledWith(SOURCE);
    expect(block.classList.contains('dgmo--editing')).toBe(false);
  });

  it('Escape without a painted draft skips the restore render', () => {
    pencil(block).click();
    key(textarea(block)!, 'Escape');
    expect(update).not.toHaveBeenCalled();
  });

  it('Cmd+Enter commits the draft', () => {
    pencil(block).click();
    const ta = textarea(block)!;
    ta.value = 'pie chart\nRum 60\nGrog 40';
    key(ta, 'Enter', { metaKey: true });
    expect(commit).toHaveBeenCalledWith('pie chart\nRum 60\nGrog 40');
  });

  it('pencil click while editing commits (same as Cmd+Enter)', () => {
    pencil(block).click();
    const ta = textarea(block)!;
    ta.value = 'pie chart\nRum 60';
    pencil(block).click();
    expect(commit).toHaveBeenCalledWith('pie chart\nRum 60');
  });

  it('unchanged draft closes without committing', () => {
    pencil(block).click();
    key(textarea(block)!, 'Enter', { ctrlKey: true });
    expect(commit).not.toHaveBeenCalled();
    expect(textarea(block)).toBeNull();
  });

  it('rejected commit keeps the editor (and the draft) open', async () => {
    commit.mockRejectedValueOnce(new Error('stale'));
    pencil(block).click();
    const ta = textarea(block)!;
    ta.value = 'draft that must survive';
    key(ta, 'Enter', { metaKey: true });
    await vi.runAllTimersAsync();
    expect(textarea(block)).not.toBeNull();
    expect(textarea(block)!.value).toBe('draft that must survive');
  });

  it('no-op on blocks without source chrome (error cards)', () => {
    const bare = document.createElement('div');
    expect(() =>
      enableBlockEditing(bare, SOURCE, { update, commit })
    ).not.toThrow();
    expect(bare.querySelector('button.dgmo-edit')).toBeNull();
  });
});

describe('renderDgmo edit wiring', () => {
  beforeEach(() => {
    (globalThis as { activeDocument?: Document }).activeDocument = document;
  });

  it('mounts the pencil only when a commit handler is passed', async () => {
    const withCommit = document.createElement('div');
    await renderDgmo(SOURCE, withCommit, false, 'nord', async () => {});
    expect(withCommit.querySelector('button.dgmo-edit')).not.toBeNull();

    const withoutCommit = document.createElement('div');
    await renderDgmo(SOURCE, withoutCommit, false, 'nord');
    expect(withoutCommit.querySelector('button.dgmo-edit')).toBeNull();
  });

  it('updateDiagram swaps the hero SVG in place', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    await renderDgmo(SOURCE, container, false, 'nord', async () => {});
    const block = container.querySelector<HTMLElement>('figure.dgmo')!;
    const before = block.querySelector('.dgmo-svg > svg')!;

    await updateDiagram(block, 'pie chart\nRum 60\nGrog 40', false, 'nord');
    const after = block.querySelector('.dgmo-svg > svg')!;
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
    // Chrome (toolbar, details) untouched.
    expect(block.querySelector('summary.dgmo-toolbar')).not.toBeNull();
    container.remove();
  });

  it('updateDiagram shows the error card in the hero on a bad draft', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    await renderDgmo(SOURCE, container, false, 'nord', async () => {});
    const block = container.querySelector<HTMLElement>('figure.dgmo')!;

    await updateDiagram(block, 'bar chart\nBooty not-a-number', false, 'nord');
    expect(block.querySelector('.dgmo-svg .dgmo--error')).not.toBeNull();
    expect(block.querySelector('.dgmo-svg > svg')).toBeNull();

    // A corrected draft recovers.
    await updateDiagram(block, SOURCE, false, 'nord');
    expect(block.querySelector('.dgmo-svg > svg')).not.toBeNull();
    expect(block.querySelector('.dgmo-svg .dgmo--error')).toBeNull();
    container.remove();
  });
});

describe('replaceFencedSource', () => {
  const NOTE = [
    '# Pirates',
    '',
    '```dgmo',
    'bar chart',
    'Black Pearl 42',
    '```',
    '',
    'after',
  ].join('\n');

  it('replaces the block body when it matches', () => {
    const out = replaceFencedSource(
      NOTE,
      2,
      5,
      'bar chart\nBlack Pearl 42',
      'pie chart\nRum 60\nGrog 40'
    );
    expect(out).toBe(
      [
        '# Pirates',
        '',
        '```dgmo',
        'pie chart',
        'Rum 60',
        'Grog 40',
        '```',
        '',
        'after',
      ].join('\n')
    );
  });

  it('tolerates trailing-newline differences between processor source and file', () => {
    const out = replaceFencedSource(
      NOTE,
      2,
      5,
      'bar chart\nBlack Pearl 42\n',
      'line chart\nQ1 5'
    );
    expect(out).toContain('line chart');
  });

  it('returns null when the note changed underneath the editor', () => {
    expect(
      replaceFencedSource(NOTE, 2, 5, 'something else entirely', 'x')
    ).toBeNull();
  });

  it('returns null on out-of-range section bounds', () => {
    expect(replaceFencedSource(NOTE, 90, 95, 'x', 'y')).toBeNull();
    expect(replaceFencedSource(NOTE, 5, 2, 'x', 'y')).toBeNull();
  });
});

describe('containsFence', () => {
  it('flags backtick and tilde fences, indented too', () => {
    expect(containsFence('bar chart\n```')).toBe(true);
    expect(containsFence('  ~~~\nx')).toBe(true);
    expect(containsFence('````')).toBe(true);
  });

  it('passes normal DGMO (inline backticks are fine)', () => {
    expect(containsFence(SOURCE)).toBe(false);
    expect(containsFence('note a `code` word')).toBe(false);
  });
});
