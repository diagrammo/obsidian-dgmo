import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import { EditorView } from '@codemirror/view';

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
  const codeSpan = document.createElement('span');
  codeSpan.className = 'dgmo-code';
  codeSpan.textContent = SOURCE;
  pre.appendChild(codeSpan);
  inner.appendChild(pre);
  details.append(summary, inner);

  figure.append(hero, details);
  host.appendChild(figure);
  document.body.appendChild(host);
  return figure;
}

/** The mounted CodeMirror view for the block's source panel. */
function editor(block: HTMLElement): EditorView {
  const dom = block.querySelector<HTMLElement>('.dgmo-source-inner .cm-editor')!;
  return EditorView.findFromDOM(dom)!;
}

/** Replace the editor's whole document (models a user editing the source). */
function setDoc(view: EditorView, text: string): void {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text },
  });
}

function docText(view: EditorView): string {
  return view.state.doc.toString();
}

/** Dispatch a raw keydown at the editor's content, as the browser would. */
function key(view: EditorView, keyName: string): void {
  view.contentDOM.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: keyName,
      bubbles: true,
      cancelable: true,
    })
  );
}

describe('enableBlockEditing', () => {
  let block: HTMLElement;
  let update: Mock<(source: string) => Promise<void>>;
  let save: Mock<(next: string) => Promise<void>>;
  let flush: (() => Promise<void>) | null;

  beforeEach(() => {
    vi.useFakeTimers();
    block = makeBlock();
    update = vi.fn<(source: string) => Promise<void>>().mockResolvedValue();
    save = vi.fn<(next: string) => Promise<void>>().mockResolvedValue();
    flush = enableBlockEditing(block, SOURCE, { update, save });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('replaces the static <pre> with a CodeMirror editor seeded with the source', () => {
    // The overlay/textarea approach is gone: a real editor owns the panel.
    expect(block.querySelector('textarea')).toBeNull();
    expect(block.querySelector('.dgmo-source-inner pre.dgmo-pre')).toBeNull();

    const view = editor(block);
    expect(view).not.toBeNull();
    expect(docText(view)).toBe(SOURCE);
    // No extra affordance — the panel just is editable.
    expect(block.querySelector('button.dgmo-edit')).toBeNull();
  });

  it('renders the source inside a CodeMirror content region', () => {
    const content = block.querySelector('.dgmo-source-inner .cm-content')!;
    expect(content).not.toBeNull();
    expect(content.textContent).toContain('bar chart');
  });

  it('paints dgmo-tok token classes on the live editor', () => {
    // Regression guard: dgmoExtension only assigns highlight *tags*; a standalone
    // EditorView ships no HighlightStyle, so without our class-based
    // `syntaxHighlighting(...)` the expanded editor renders as flat, uncolored
    // text (the bug this test exists to prevent). Classes reuse styles.css's
    // `.dgmo-tok-*` rules so the live editor matches the static <pre> panel.
    const view = editor(block);
    view.dispatch({}); // flush the highlighter over the mounted viewport
    const html = view.contentDOM.innerHTML;
    const painted = new Set(
      [...html.matchAll(/dgmo-tok-[a-zA-Z]+/g)].map((m) => m[0])
    );
    // "bar chart" → chartType; "42"/"37" → number.
    expect(painted.has('dgmo-tok-chartType')).toBe(true);
    expect(painted.has('dgmo-tok-number')).toBe(true);
  });

  it('typing live-updates the diagram after the debounce, without saving', () => {
    const view = editor(block);
    setDoc(view, SOURCE + '\nFlying Dutchman 12');

    expect(update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(350);
    expect(update).toHaveBeenCalledWith(SOURCE + '\nFlying Dutchman 12');
    expect(save).not.toHaveBeenCalled();
  });

  it('rapid keystrokes collapse into one update', () => {
    const view = editor(block);
    for (const suffix of ['a', 'ab', 'abc']) {
      setDoc(view, `${SOURCE}\n${suffix}`);
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(350);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(`${SOURCE}\nabc`);
  });

  it('blur saves a changed draft into the note', () => {
    const view = editor(block);
    setDoc(view, 'pie chart\nRum 60\nGrog 40');
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    expect(save).toHaveBeenCalledWith('pie chart\nRum 60\nGrog 40');
  });

  it('blur without changes writes nothing', () => {
    editor(block).contentDOM.dispatchEvent(new FocusEvent('blur'));
    expect(save).not.toHaveBeenCalled();
  });

  it('closing the source panel saves a changed draft', () => {
    const details = block.querySelector<HTMLDetailsElement>('details')!;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));

    setDoc(editor(block), 'pie chart\nRum 60');
    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    expect(save).toHaveBeenCalledWith('pie chart\nRum 60');
  });

  it('flush saves a pending draft (block unmounts mid-edit)', async () => {
    setDoc(editor(block), 'pie chart\nRum 60');
    await flush!();
    expect(save).toHaveBeenCalledWith('pie chart\nRum 60');
  });

  it('flush is a no-op when nothing changed', async () => {
    await flush!();
    expect(save).not.toHaveBeenCalled();
  });

  it('concurrent triggers (blur + close) save once', () => {
    save.mockReturnValue(new Promise(() => {})); // never resolves
    const view = editor(block);
    setDoc(view, 'pie chart\nRum 60');
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    const details = block.querySelector<HTMLDetailsElement>('details')!;
    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('Escape reverts the draft and restores the diagram', () => {
    const view = editor(block);
    setDoc(view, 'draft');
    vi.advanceTimersByTime(350);
    update.mockClear();

    key(view, 'Escape');
    expect(docText(view)).toBe(SOURCE);
    expect(update).toHaveBeenCalledWith(SOURCE);
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    expect(save).not.toHaveBeenCalled();
  });

  it('Escape before any painted draft skips the restore render', () => {
    key(editor(block), 'Escape');
    expect(update).not.toHaveBeenCalled();
  });

  it('withholds the Esc-revert binding when Vim mode is on (vim owns Esc)', () => {
    document.body.replaceChildren();
    const vimBlock = makeBlock();
    enableBlockEditing(vimBlock, SOURCE, { update, save, vimMode: true });
    const view = editor(vimBlock);
    setDoc(view, 'draft');
    key(view, 'Escape');
    // Our revert did not fire — the draft stands (vim would handle Esc).
    expect(docText(view)).toBe('draft');
  });

  it('failed save keeps the draft for retry', async () => {
    save.mockRejectedValueOnce(new Error('stale'));
    const view = editor(block);
    setDoc(view, 'draft that must survive');
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    await vi.runAllTimersAsync();
    expect(docText(view)).toBe('draft that must survive');

    // A later blur retries the save.
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('no-op on blocks without source chrome (error cards)', () => {
    const bare = document.createElement('div');
    expect(enableBlockEditing(bare, SOURCE, { update, save })).toBeNull();
    expect(bare.querySelector('.cm-editor')).toBeNull();
  });
});

describe('renderDgmo edit wiring', () => {
  beforeEach(() => {
    (globalThis as { activeDocument?: Document }).activeDocument = document;
  });

  it('source panel is editable only when a save handler is passed', async () => {
    const withSave = document.createElement('div');
    const flush = await renderDgmo(SOURCE, withSave, false, 'nord', async () => {});
    expect(withSave.querySelector('.dgmo-source-inner .cm-editor')).not.toBeNull();
    expect(flush).toBeTypeOf('function');

    const withoutSave = document.createElement('div');
    const noFlush = await renderDgmo(SOURCE, withoutSave, false, 'nord');
    expect(withoutSave.querySelector('.dgmo-source-inner .cm-editor')).toBeNull();
    expect(withoutSave.querySelector('.dgmo-source-inner pre.dgmo-pre')).not.toBeNull();
    expect(noFlush).toBeNull();
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
