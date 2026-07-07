/**
 * In-block source editing: when the source panel is open (the `</>` toggle),
 * the source IS an editor — a <textarea> stands in for the highlighted <pre>.
 * Typing re-renders the diagram hero live (debounced). There is no commit
 * ceremony: the edit is written back into the note's markdown quietly when
 * the user is done — on blur, on closing the panel, or when the block
 * unmounts (scroll-away in Live Preview). Esc reverts the draft.
 *
 * This module is DOM-only and framework-agnostic — the Obsidian-specific
 * pieces (re-rendering the hero, writing the note) come in through
 * `BlockEditOpts`, which keeps it unit-testable without the `obsidian` module.
 */

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
}

/** Save-any-pending-edit hook, for the host's unmount lifecycle. */
export type FlushFn = () => Promise<void>;

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

  const original = source.replace(/\n$/, '');
  const doc = block.ownerDocument;

  // The textarea replaces the highlighted <pre> for the block's lifetime —
  // the source view simply is editable whenever it's shown.
  inner.querySelector('pre.dgmo-pre')?.classList.add('dgmo-pre--hidden');
  const ta = doc.createElement('textarea');
  ta.className = 'dgmo-edit-area';
  ta.value = original;
  ta.spellcheck = false;
  ta.setAttribute('aria-label', 'DGMO source (editable)');
  inner.appendChild(ta);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirtyDiagram = false;
  let lastSaved = original;
  let savePromise: Promise<void> | null = null;

  function clearTimer(): void {
    if (timer != null) clearTimeout(timer);
    timer = null;
  }

  function autoGrow(): void {
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }

  function scheduleUpdate(): void {
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      if (!block.isConnected) return;
      dirtyDiagram = true;
      void opts.update(ta.value);
    }, DEBOUNCE_MS);
  }

  /** Write back if the draft differs from what the note holds. Idempotent and
   * re-entrant-safe: blur + panel-close + unload can all race into it. */
  function saveIfChanged(): Promise<void> {
    if (savePromise) return savePromise;
    const next = ta.value;
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
    ta.value = lastSaved;
    autoGrow();
    if (dirtyDiagram) {
      dirtyDiagram = false;
      void opts.update(lastSaved);
    }
  }

  ta.addEventListener('input', () => {
    autoGrow();
    scheduleUpdate();
  });
  // stopPropagation on every key: the block may live inside a CodeMirror
  // widget (Live Preview) or under global hotkeys — keystrokes belong to
  // the textarea while it has focus.
  ta.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      revert();
      return;
    }
    // DGMO is indent-significant; Tab must indent, not move focus.
    if (e.key === 'Tab') {
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      autoGrow();
      scheduleUpdate();
    }
  });
  ta.addEventListener('blur', () => void saveIfChanged());
  details.addEventListener('toggle', () => {
    if (details.open) autoGrow();
    else void saveIfChanged();
  });

  return saveIfChanged;
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
