/**
 * In-block source editing: when the source panel is open (the `</>` toggle),
 * the source IS an editor. The static highlighted `<pre>` is replaced by a real
 * CodeMirror 6 `EditorView` running dgmo's own language extension
 * (`dgmoExtension` — the same lezer parser + highlighting the desktop editor
 * uses), so the source stays syntax-highlighted natively while being edited.
 * Typing re-renders the diagram hero live (debounced). There is no commit
 * ceremony: the edit is written back into the note's markdown quietly when the
 * user is done — on blur, on closing the panel, or when the block unmounts
 * (scroll-away in Live Preview). Esc reverts the draft (unless Vim owns Esc).
 *
 * Vim: when the host reports Obsidian's Vim mode is on (`opts.vimMode`), the
 * `@replit/codemirror-vim` extension — the very engine Obsidian's own editors
 * use — is lazy-loaded into a compartment and slotted in at highest precedence.
 * We don't reimplement any keybindings; we host the same vim engine.
 *
 * CodeMirror core (`@codemirror/*`, `@lezer/*`) is provided by Obsidian at
 * runtime (esbuild marks it external), so mounting an editor adds no bundle
 * weight; only the vim engine is bundled.
 *
 * This module stays framework-agnostic — the Obsidian-specific pieces
 * (re-rendering the hero, writing the note, reading the vim setting) come in
 * through `BlockEditOpts`, which keeps it unit-testable without `obsidian`.
 */

import { EditorView, keymap } from '@codemirror/view';
import {
  EditorState,
  Compartment,
  Prec,
  type Extension,
} from '@codemirror/state';
import {
  history,
  historyKeymap,
  defaultKeymap,
  indentWithTab,
} from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { dgmoExtension } from '@diagrammo/dgmo/editor';

const DEBOUNCE_MS = 300;

export interface BlockEditOpts {
  /** Re-render the diagram hero from a draft (live preview while typing). */
  update(source: string): Promise<void>;
  /**
   * Write the new source back into the note. Obsidian re-mounts the block
   * after the write, tearing the editor down naturally. Throw to keep the
   * draft in the editor (stale section, fence in source, …).
   */
  save(next: string): Promise<void>;
  /**
   * Obsidian's Vim mode setting. When true the vim engine is lazy-loaded into
   * the editor and Esc belongs to vim (so the Esc-reverts-draft binding is
   * withheld). The host reads this from `app.vault.getConfig('vimMode')`.
   */
  vimMode?: boolean;
}

/** Save-any-pending-edit hook, for the host's unmount lifecycle. */
export type FlushFn = () => Promise<void>;

/** Compartment slot each editor reuses for its (optional) vim extension. */
const vimSlot = new Compartment();

/**
 * Wire live editing into a mounted standard block. Returns a flush function
 * the host should call on unload so an in-progress edit isn't lost when the
 * block unmounts. No-op (returns null) when the block has no source chrome.
 */
export function enableBlockEditing(
  block: HTMLElement,
  source: string,
  opts: BlockEditOpts
): FlushFn | null {
  const detailsQ = block.querySelector<HTMLDetailsElement>(
    'details.dgmo-source-wrap'
  );
  const innerQ = block.querySelector<HTMLElement>('.dgmo-source-inner');
  if (!detailsQ || !innerQ) return null;
  // Re-bind as definitely-non-null consts so the closures below typecheck.
  const details = detailsQ;
  const inner = innerQ;

  const pre = inner.querySelector<HTMLElement>('pre.dgmo-pre');
  if (!pre) return null;

  const original = source.replace(/\n$/, '');

  let timer: number | null = null;
  let dirtyDiagram = false;
  let lastSaved = original;
  let savePromise: Promise<void> | null = null;

  function clearTimer(): void {
    if (timer != null) window.clearTimeout(timer);
    timer = null;
  }

  function currentText(): string {
    return view.state.doc.toString();
  }

  function scheduleUpdate(): void {
    clearTimer();
    timer = window.setTimeout(() => {
      timer = null;
      if (!block.isConnected) return;
      dirtyDiagram = true;
      void opts.update(currentText());
    }, DEBOUNCE_MS);
  }

  /** Write back if the draft differs from what the note holds. Idempotent and
   * re-entrant-safe: blur + panel-close + unload can all race into it. */
  function saveIfChanged(): Promise<void> {
    if (savePromise) return savePromise;
    const next = currentText();
    if (next.trimEnd() === lastSaved.trimEnd()) return Promise.resolve();
    clearTimer();
    savePromise = opts
      .save(next)
      .then(() => {
        lastSaved = next;
        // Keep the copy button honest for the moment before the remount.
        const copy = block.querySelector<HTMLElement>('button.dgmo-copy');
        if (copy) copy.dataset['dgmoSource'] = next.trim();
      })
      .catch(() => {
        // Save refused (stale note, fence in source, …) — the save handler
        // surfaced a Notice; the draft stays in the editor, nothing is lost.
      })
      .finally(() => {
        savePromise = null;
      });
    return savePromise;
  }

  function revert(): void {
    clearTimer();
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: lastSaved },
    });
    if (dirtyDiagram) {
      dirtyDiagram = false;
      void opts.update(lastSaved);
    }
  }

  // Esc reverts the draft — but only when Vim is off; with Vim on, Esc is the
  // way out of insert mode and belongs to the vim engine.
  const escRevert: Extension = opts.vimMode
    ? []
    : Prec.highest(
        keymap.of([
          {
            key: 'Escape',
            run: () => {
              revert();
              return true;
            },
          },
        ])
      );

  const theme = EditorView.theme({
    '&': { fontSize: '0.85em', background: 'transparent' },
    '&.cm-focused': { outline: 'none' },
    '.cm-content': {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      padding: '1em',
    },
    '.cm-line': { padding: '0' },
    '.cm-scroller': { lineHeight: '1.5' },
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: original,
      extensions: [
        // Slot the vim extension first so, once loaded, its keymap outranks
        // everything below it. Empty until (and unless) vim is lazy-loaded.
        vimSlot.of([]),
        escRevert,
        dgmoExtension,
        history(),
        indentUnit.of('  '), // DGMO is indent-significant; indent in 2-space steps
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        theme,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) scheduleUpdate();
        }),
        EditorView.domEventHandlers({
          // The block may live inside a CodeMirror widget (Live Preview) or
          // under global hotkeys — keystrokes and clicks belong to THIS editor
          // while it has focus. stopPropagation keeps the outer editor from
          // also acting; returning false lets our own CM handle normally.
          keydown: (e) => {
            e.stopPropagation();
            return false;
          },
          mousedown: (e) => {
            e.stopPropagation();
            return false;
          },
          blur: () => {
            void saveIfChanged();
            return false;
          },
        }),
      ],
    }),
  });

  // Replace the static highlighted <pre> with the live editor.
  pre.replaceWith(view.dom);

  // Vim is optional; load it only when the user actually runs Obsidian in Vim
  // mode, then reconfigure it into its slot at highest precedence.
  if (opts.vimMode) {
    void import('@replit/codemirror-vim')
      .then(({ vim }) => {
        if (block.isConnected) {
          view.dispatch({ effects: vimSlot.reconfigure(vim()) });
        }
      })
      .catch(() => {
        // Vim engine failed to load — editor keeps working without it.
      });
  }

  details.addEventListener('toggle', () => {
    if (!details.open) void saveIfChanged();
  });

  const flush: FlushFn = () =>
    saveIfChanged().finally(() => {
      view.destroy();
    });
  return flush;
}

/** Would this source terminate its own fenced block if written back? */
export function containsFence(source: string): boolean {
  return /^\s*(`{3,}|~{3,})/m.test(source);
}

/**
 * Replace the body of the fenced block at [lineStart, lineEnd] (fence lines
 * inclusive, from `getSectionInfo`) inside the full note text. Returns the
 * new note text, or null when the block body no longer matches `oldSource` —
 * the note changed since this block rendered, so writing would clobber
 * someone else's edit.
 */
export function replaceFencedSource(
  data: string,
  lineStart: number,
  lineEnd: number,
  oldSource: string,
  newSource: string
): string | null {
  const lines = data.split('\n');
  if (lineStart < 0 || lineEnd > lines.length || lineEnd <= lineStart)
    return null;
  const current = lines.slice(lineStart + 1, lineEnd).join('\n');
  if (current.trimEnd() !== oldSource.trimEnd()) return null;
  lines.splice(
    lineStart + 1,
    lineEnd - lineStart - 1,
    ...newSource.trimEnd().split('\n')
  );
  return lines.join('\n');
}
