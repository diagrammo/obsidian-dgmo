/**
 * Collapse write-through: the static SVG marks every foldable thing with one
 * of four toggle attributes (`data-node-toggle`, `data-group-toggle`,
 * `data-section-toggle`, `data-note-toggle`), its source line in
 * `data-line-number` and its state in `aria-expanded`. The fold is view state
 * that lives in the source — a `collapsed` marker on that line — so a click
 * edits the note and the re-render draws the new fold. The edit is dgmo's own
 * `foldAtLine`, which detects the chart type; the plugin holds no per-type
 * logic.
 */
import { foldAtLine } from '@diagrammo/dgmo';

/** Writes the edited source back to wherever the diagram came from. */
export type CollapseSaveFn = (next: string) => Promise<void>;

const TOGGLE_SELECTOR =
  '[data-node-toggle], [data-group-toggle], [data-section-toggle], [data-note-toggle]';

/** Whether the toggle currently shows its subtree folded. */
function isFolded(toggle: Element): boolean {
  return toggle.getAttribute('aria-expanded') === 'false';
}

/**
 * The toggle a pointer or key event is for. The toggle must also be the
 * nearest element that names a source line, so a click on a child node drawn
 * inside a group frame stays with the child rather than folding the group.
 */
function toggleFor(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const toggle = target.closest(TOGGLE_SELECTOR);
  if (!toggle || target.closest('[data-line-number]') !== toggle) return null;
  return toggle;
}

/**
 * Bind every fold toggle in `block`'s diagram to `save`. The listeners sit on
 * the block, so they die with it on re-render. dgmo emits no `tabindex` (the
 * app's one-Tab-stop rule), so the plugin makes each toggle focusable here for
 * Enter and Space. Ignores toggles while the source panel is open — the draft
 * in the editor is then the source of truth, and a write from here would race
 * it.
 */
export function bindCollapseToggles(
  block: HTMLElement,
  source: string,
  save: CollapseSaveFn
): void {
  block
    .querySelectorAll<SVGElement>(`.dgmo-svg ${TOGGLE_SELECTOR}`)
    .forEach((toggle) => {
      if (!toggle.hasAttribute('data-line-number')) return;
      toggle.setAttribute('tabindex', '0');
      if (!toggle.hasAttribute('role')) toggle.setAttribute('role', 'button');
    });

  let saving = false;
  const fire = (toggle: Element): void => {
    if (saving) return;
    if (block.querySelector('details.dgmo-source-wrap[open]')) return;
    const line = Number(toggle.getAttribute('data-line-number'));
    if (!Number.isInteger(line) || line < 1) return;
    const next = foldAtLine(source, line, !isFolded(toggle));
    if (next === null) return;
    saving = true;
    save(next)
      .catch(() => {
        /* the save path already told the reader why (a Notice) */
      })
      .finally(() => {
        saving = false;
      });
  };

  // Live Preview's outer editor would otherwise also take the press and move
  // its cursor into the block.
  block.addEventListener('mousedown', (e) => {
    if (toggleFor(e.target)) e.stopPropagation();
  });
  block.addEventListener('click', (e) => {
    const toggle = toggleFor(e.target);
    if (!toggle) return;
    e.preventDefault();
    e.stopPropagation();
    fire(toggle);
  });
  block.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const toggle = toggleFor(e.target);
    if (!toggle) return;
    e.preventDefault();
    e.stopPropagation();
    fire(toggle);
  });
}
