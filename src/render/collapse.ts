/**
 * Collapse write-through: the static SVG draws a fold toggle on every node or
 * group that can collapse (`data-node-toggle` / `data-group-toggle`, carrying
 * the source line in `data-line-number`). The fold is view state that lives in
 * the source — a `collapsed` marker on that line — so a click edits the note
 * and the re-render draws the new fold. This mirrors the desktop app, and the
 * line edits are dgmo's own (`applyCollapsedMarker*`), shared by both hosts.
 *
 * Only chart types whose static render honours the marker are bound. The
 * others (sitemap, raci, pert, boxes-and-lines, sequence sections and notes)
 * draw a toggle that only the app's runtime view state can drive, and a write
 * there would change the note without changing the drawing.
 */
import {
  applyCollapsedMarkerAtLine,
  applyGroupHeaderCollapsedMarkerAtLine,
  applyIndentedGroupCollapsedMarkerAtLine,
} from '@diagrammo/dgmo';
import {
  parseDgmoChartType,
  parseMindmap,
  parseOrg,
} from '@diagrammo/dgmo/advanced';

/** Writes the edited source back to wherever the diagram came from. */
export type CollapseSaveFn = (next: string) => Promise<void>;

const WRITABLE_CHART_TYPES = new Set([
  'mindmap',
  'org',
  'state',
  'infra',
  'sequence',
]);

const TOGGLE_SELECTOR = '[data-node-toggle], [data-group-toggle]';

interface LabelledNode {
  readonly label: string;
  readonly lineNumber: number;
  readonly children: readonly LabelledNode[];
}

function labelAtLine(
  nodes: readonly LabelledNode[],
  line: number
): string | null {
  for (const n of nodes) {
    if (n.lineNumber === line) return n.label;
    const inner = labelAtLine(n.children, line);
    if (inner !== null) return inner;
  }
  return null;
}

/**
 * The source with the fold on `line` set to `collapse`, or null when this chart
 * type is not bound or the line names nothing collapsible.
 */
export function toggleCollapsedInSource(
  source: string,
  line: number,
  collapse: boolean
): string | null {
  const chartType = parseDgmoChartType(source);
  if (chartType === null || !WRITABLE_CHART_TYPES.has(chartType)) return null;
  const text = source.split('\n')[line - 1];
  if (text === undefined) return null;

  let next: string;
  if (text.trimStart().startsWith('[')) {
    // A group header. Infra also reads the legacy indented `collapsed: true`
    // child line, which the header edit cannot see — so expanding tries that
    // form first and falls back to the header's own marker.
    next =
      chartType === 'infra' && !collapse
        ? applyIndentedGroupCollapsedMarkerAtLine(source, line, false)
        : source;
    if (next === source) {
      next = applyGroupHeaderCollapsedMarkerAtLine(source, line, collapse);
    }
  } else {
    const roots: readonly LabelledNode[] | null =
      chartType === 'mindmap'
        ? parseMindmap(source).roots
        : chartType === 'org'
          ? parseOrg(source).roots
          : null;
    const label = roots ? labelAtLine(roots, line) : null;
    if (label === null) return null;
    next = applyCollapsedMarkerAtLine(source, line, label, collapse);
  }
  return next === source ? null : next;
}

/** Whether the toggle currently shows its subtree folded. */
function isFolded(toggle: Element): boolean {
  const expanded = toggle.getAttribute('aria-expanded');
  if (expanded !== null) return expanded === 'false';
  // Infra carries no aria state: a folded group draws as a node.
  return toggle.classList.contains('infra-node');
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
 * the block, so they die with it on re-render. Does nothing for a chart type
 * that is not bound. Ignores toggles while the source panel is open — the
 * draft in the editor is then the source of truth, and a write from here
 * would race it.
 */
export function bindCollapseToggles(
  block: HTMLElement,
  source: string,
  save: CollapseSaveFn
): void {
  const chartType = parseDgmoChartType(source);
  if (chartType === null || !WRITABLE_CHART_TYPES.has(chartType)) return;

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
    const next = toggleCollapsedInSource(source, line, !isFolded(toggle));
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
