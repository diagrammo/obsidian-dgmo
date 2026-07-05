import {
  render,
  formatDgmoError,
  encodeDiagramUrl,
  normalizeSvgForEmbed,
  resolvePaletteOrFallback,
  type DgmoError,
  type PaletteConfig,
} from '@diagrammo/dgmo';
import { buildDgmoBlockHtml, errorBlockHtml } from '@diagrammo/dgmo/block';
import {
  looksLikeMap,
  parseMap,
  resolveMap,
  renderMapForExport,
  mapExportDimensions,
} from '@diagrammo/dgmo/advanced';
import { mapData } from './map-data';

function resolvePalette(id: string): PaletteConfig {
  // Silent resolution (no logger) — preserves Obsidian's current no-notice
  // behavior. The resolve/fallback policy lives in @diagrammo/dgmo (Story
  // 110.2); fallback is the dgmo default (slate).
  return resolvePaletteOrFallback(id);
}

/**
 * Parse an HTML string produced by `@diagrammo/dgmo/block` and append its
 * root element to `container`. DOMParser + importNode rather than innerHTML —
 * the Obsidian plugin review guidelines disallow innerHTML/outerHTML writes.
 */
export function appendBlockHtml(
  container: HTMLElement,
  html: string
): HTMLElement | null {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const root = parsed.body.firstElementChild;
  if (!root) return null;
  const node = container.ownerDocument.importNode(root, true);
  container.appendChild(node);
  return node as HTMLElement;
}

/** Unified error card (BL-114): same `.dgmo--error` markup on every surface. */
function showError(
  container: HTMLElement,
  message: string,
  source: string
): void {
  container.replaceChildren();
  appendBlockHtml(container, errorBlockHtml(new Error(message), source));
}

function scaleSvgToFit(container: HTMLElement): void {
  const svgEl = container.querySelector('svg');
  if (!svgEl) return;

  let viewBox = svgEl.getAttribute('viewBox');
  if (!viewBox) {
    const origW = parseFloat(svgEl.getAttribute('width') ?? '0');
    const origH = parseFloat(svgEl.getAttribute('height') ?? '0');
    if (origW > 0 && origH > 0) {
      viewBox = `0 0 ${origW} ${origH}`;
      svgEl.setAttribute('viewBox', viewBox);
    }
  }

  svgEl.setAttribute('width', '100%');
  svgEl.removeAttribute('height');
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    const vbW = parts[2];
    const vbH = parts[3];
    if (vbW && vbH) {
      svgEl.style.aspectRatio = `${vbW} / ${vbH}`;
    }
  }
}

/**
 * Mount the standard DGMO embed block (BL-114) around already-rendered SVG
 * markup: diagram hero, hover-reveal icon toolbar (view-source / copy /
 * open-in-editor), source behind a native `<details>`. The `<details>` toggle
 * needs no JS; copy/open get a per-render click handler scoped to the block
 * element, so re-renders (Obsidian re-mounts blocks on edit) can't stack
 * duplicate bindings — the listener dies with the node.
 */
function mountBlock(
  container: HTMLElement,
  source: string,
  svgsHtml: string,
  isDark: boolean,
  paletteId: string
): HTMLElement | null {
  const html = buildDgmoBlockHtml(source, svgsHtml, { mode: 'showcase' });
  const block = appendBlockHtml(container, html);
  if (!block) return null;
  retargetOpenLink(block, source, isDark, paletteId);
  bindToolbar(block);
  return block;
}

/**
 * The canonical block encodes only the source into the open-in-editor URL.
 * This plugin has always carried palette + theme into the share URL so the
 * online editor opens with the same look — rebuild the href with those params.
 */
function retargetOpenLink(
  block: HTMLElement,
  source: string,
  isDark: boolean,
  paletteId: string
): void {
  const link = block.querySelector<HTMLAnchorElement>('a.dgmo-open');
  if (!link) return;
  const url = encodeDiagramUrl(source, {
    palette: resolvePalette(paletteId),
    theme: isDark ? 'dark' : 'light',
  });
  if (url) link.setAttribute('href', url);
  else link.remove(); // too large to share — copy remains
}

/** Copy + open handlers for the toolbar (mirrors remark-dgmo's `bindDgmo`). */
function bindToolbar(block: HTMLElement): void {
  block.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    const btn = (target?.closest('.dgmo-toolbar-btn') ??
      null) as HTMLElement | null;
    if (!btn) return;

    // The toolbar IS the <summary> of the source <details>; a click on any
    // descendant would also toggle the disclosure unless we cancel the
    // default action. That also cancels anchor navigation, so the open
    // button is re-opened manually below.
    const insideSummary = btn.closest('summary') != null;
    if (insideSummary) e.preventDefault();

    if (btn.matches('button.dgmo-copy')) {
      const src = btn.dataset['dgmoSource'] ?? '';
      void navigator.clipboard
        .writeText(src)
        .then(() => {
          btn.classList.add('dgmo-copy--success');
          window.setTimeout(
            () => btn.classList.remove('dgmo-copy--success'),
            1500
          );
        })
        .catch(() => {
          /* clipboard unavailable — ignore */
        });
      return;
    }

    if (insideSummary && btn.matches('a.dgmo-open')) {
      const href = (btn as HTMLAnchorElement).href;
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
    }
  });
}

export async function renderDgmo(
  source: string,
  container: HTMLElement,
  isDark: boolean,
  paletteId = 'nord'
): Promise<void> {
  // The map chart type loads its geo data via Node `fs` in the public
  // `render()` — which fails in the Obsidian renderer and yields an empty SVG.
  // Render it through dgmo's DI pipeline with the bundled data instead.
  if (looksLikeMap(source)) {
    renderMapDgmo(source, container, isDark, paletteId);
    return;
  }

  let svg: string;
  let diagnostics: DgmoError[];
  try {
    const result: { svg: string; diagnostics: DgmoError[] } = await render(
      source,
      {
        theme: isDark ? 'dark' : 'light',
        palette: resolvePalette(paletteId),
      }
    );
    svg = result.svg;
    diagnostics = result.diagnostics;
  } catch (err) {
    showError(
      container,
      err instanceof Error ? err.message : String(err),
      source
    );
    return;
  }

  const firstError: DgmoError | undefined = diagnostics.find(
    (d) => d.severity === 'error'
  );
  if (firstError) {
    showError(container, formatDgmoError(firstError), source);
    return;
  }

  if (!svg) {
    showError(container, 'No SVG output from dgmo render().', source);
    return;
  }

  // normalizeSvgForEmbed tightens the export-canvas viewBox to the diagram's
  // content and strips fixed width/height, so block.css's responsive sizing
  // (`.dgmo-svg > svg { width:100%; height:auto }`) matches the content, not
  // the fixed 1200×800 canvas.
  mountBlock(
    container,
    source,
    `<div class="dgmo-svg">${normalizeSvgForEmbed(svg)}</div>`,
    isDark,
    paletteId
  );
}

/**
 * Render a `map` diagram via dgmo's dependency-injection pipeline
 * (`parseMap` → `resolveMap` → `renderMapForExport`) with the geo data bundled
 * into the plugin. Mirrors the desktop app's MapPreview; avoids the public
 * `render()`'s Node-only `loadMapData()`, which can't resolve assets in the
 * Obsidian renderer.
 */
function renderMapDgmo(
  source: string,
  container: HTMLElement,
  isDark: boolean,
  paletteId: string
): void {
  const palette = resolvePalette(paletteId)[isDark ? 'dark' : 'light'];

  let resolved: ReturnType<typeof resolveMap>;
  // `activeDocument` (not the global `document`) so map rendering works in
  // Obsidian popout windows, per the plugin review guidelines.
  const exportDiv = activeDocument.createElement('div');
  try {
    resolved = resolveMap(parseMap(source), mapData);
    // Content-aware canvas: height derived from the map's intrinsic projected
    // aspect (no vertical stretch). The viewBox-derived aspect-ratio set below
    // makes the embed responsive at width:100%.
    const dims = mapExportDimensions(resolved, mapData, 1200);
    renderMapForExport(exportDiv, resolved, mapData, palette, isDark, dims);
  } catch (err) {
    showError(
      container,
      err instanceof Error ? err.message : String(err),
      source
    );
    return;
  }

  const firstError = resolved.diagnostics.find((d) => d.severity === 'error');
  if (firstError) {
    showError(container, formatDgmoError(firstError), source);
    return;
  }

  const svgEl = exportDiv.querySelector('svg');
  if (!svgEl) {
    showError(container, 'No SVG output from dgmo render().', source);
    return;
  }

  // Maps are rendered as live DOM (not an SVG string), so mount the block
  // chrome with an empty `.dgmo-svg` slot and import the node into it —
  // serializing a full geo basemap to string and back would be wasteful.
  const block = mountBlock(
    container,
    source,
    '<div class="dgmo-svg"></div>',
    isDark,
    paletteId
  );
  const slot = block?.querySelector<HTMLElement>('.dgmo-svg');
  if (!slot) return;
  slot.appendChild(slot.ownerDocument.importNode(svgEl, true));
  scaleSvgToFit(slot);
}
