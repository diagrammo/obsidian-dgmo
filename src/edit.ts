/**
 * In-block source editing (live edit): a pencil button in the standard block
 * toolbar swaps the highlighted source panel for a <textarea>. While typing,
 * the diagram hero re-renders live (debounced) from the draft; the note file
 * is only written on commit (Cmd/Ctrl+Enter, blur, or clicking the pencil
 * again). Esc cancels and restores the original diagram + source.
 *
 * This module is DOM-only and framework-agnostic — the Obsidian-specific
 * pieces (re-rendering the hero, writing the note) come in through
 * `BlockEditOpts`, which keeps it unit-testable without the `obsidian` module.
 */

const PENCIL_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.13 2.44a1.5 1.5 0 0 1 2.12 2.12L5.5 12.31l-2.97.85.85-2.97z"/><path d="m9.9 3.66 2.12 2.12"/></svg>`;

const DEBOUNCE_MS = 300;

export interface BlockEditOpts {
  /** Re-render the diagram hero from a draft (live preview while typing). */
  update(source: string): Promise<void>;
  /**
   * Persist the new source into the note. Obsidian re-mounts the block after
   * the write, which tears the editor down naturally. Throw to keep the
   * editor open (stale section, fence in source, …).
   */
  commit(next: string): Promise<void>;
}

/**
 * Wire the edit affordance into a mounted standard block. No-op when the
 * block has no source chrome (error cards, `showSource: false`).
 */
export function enableBlockEditing(
  block: HTMLElement,
  source: string,
  opts: BlockEditOpts
): void {
  const toolbarQ = block.querySelector<HTMLElement>('summary.dgmo-toolbar');
  const detailsQ = block.querySelector<HTMLDetailsElement>(
    'details.dgmo-source-wrap'
  );
  const innerQ = block.querySelector<HTMLElement>('.dgmo-source-inner');
  if (!toolbarQ || !detailsQ || !innerQ) return;
  // Re-bind as definitely-non-null consts so the closures below typecheck.
  const toolbar = toolbarQ;
  const details = detailsQ;
  const inner = innerQ;

  const original = source.replace(/\n$/, '');
  const doc = block.ownerDocument;

  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = 'dgmo-toolbar-btn dgmo-edit';
  btn.setAttribute('aria-label', 'Edit DGMO source');
  btn.title = 'Edit source';
  appendSvgIcon(btn, PENCIL_ICON);
  toolbar.appendChild(btn);

  let textarea: HTMLTextAreaElement | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let closing = false;

  const pre = (): HTMLElement | null =>
    inner.querySelector<HTMLElement>('pre.dgmo-pre');

  function clearTimer(): void {
    if (timer != null) clearTimeout(timer);
    timer = null;
  }

  function scheduleUpdate(): void {
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      if (!block.isConnected || !textarea) return;
      dirty = true;
      void opts.update(textarea.value);
    }, DEBOUNCE_MS);
  }

  function autoGrow(ta: HTMLTextAreaElement): void {
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }

  function startEditing(): void {
    if (textarea) return;
    closing = false;
    dirty = false;
    details.open = true;
    block.classList.add('dgmo--editing');

    const ta = doc.createElement('textarea');
    ta.className = 'dgmo-edit-area';
    ta.value = original;
    ta.spellcheck = false;
    ta.setAttribute('aria-label', 'DGMO source editor');
    textarea = ta;
    pre()?.classList.add('dgmo-pre--hidden');
    inner.appendChild(ta);

    ta.addEventListener('input', () => {
      autoGrow(ta);
      scheduleUpdate();
    });
    // stopPropagation on every key: the block may live inside a CodeMirror
    // widget (Live Preview) or under global hotkeys — keystrokes belong to
    // the textarea while it has focus.
    ta.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
        return;
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void commit();
        return;
      }
      // DGMO is indent-significant; Tab must indent, not move focus.
      if (e.key === 'Tab') {
        e.preventDefault();
        ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
        autoGrow(ta);
        scheduleUpdate();
      }
    });
    ta.addEventListener('blur', () => {
      if (!closing) void commit();
    });

    autoGrow(ta);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  function stopEditing(): void {
    closing = true;
    clearTimer();
    textarea?.remove();
    textarea = null;
    pre()?.classList.remove('dgmo-pre--hidden');
    block.classList.remove('dgmo--editing');
  }

  function cancel(): void {
    const wasDirty = dirty;
    stopEditing();
    if (wasDirty) void opts.update(original);
  }

  async function commit(): Promise<void> {
    if (!textarea) return;
    const next = textarea.value;
    clearTimer();
    if (next.trimEnd() === original.trimEnd()) {
      // Nothing to write — restore the rendered original if a draft painted.
      cancel();
      return;
    }
    try {
      await opts.commit(next);
      // Success: the note write re-mounts the block; leave the editor as-is
      // so there's no flash of stale highlighted source in between.
    } catch {
      // Commit refused (stale note, fence in source, …) — the commit handler
      // already surfaced a Notice; keep the editor open so nothing is lost.
    }
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (textarea) void commit();
    else startEditing();
  });
}

/** Parse a static SVG icon and append it (plugin guidelines: no innerHTML). */
function appendSvgIcon(parent: HTMLElement, svgMarkup: string): void {
  const parsed = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  parent.appendChild(
    parent.ownerDocument.importNode(parsed.documentElement, true)
  );
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
