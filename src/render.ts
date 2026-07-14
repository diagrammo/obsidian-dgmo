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
  parseDgmoChartType,
  knownChartTypeIds,
} from '@diagrammo/dgmo/advanced';

const DOCS_BASE = 'https://diagrammo.app/docs';
import { mapData } from './map-data';
import { enableBlockEditing, type FlushFn } from './edit';

function resolvePalette(id: string): PaletteConfig {
  // Silent resolution (no logger) — preserves Obsidian's current no-notice
  // behavior. The resolve/fallback policy lives in @diagrammo/dgmo (Story
  // 110.2); fallback is the dgmo default (slate).
  return resolvePaletteOrFallback(id);
}

// Mirrors the `transparentBackground` setting so the three embed-normalize call
// sites don't each need it threaded through their (differing) signatures. Set
// from main.ts on load and on every settings change. `map` never reaches these
// sites — it branches earlier via `looksLikeMap` — so no type-awareness needed.
let embedBackground: 'transparent' | 'opaque' = 'transparent';

/** Called by the plugin when settings load or change. */
export function setEmbedBackground(transparent: boolean): void {
  embedBackground = transparent ? 'transparent' : 'opaque';
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
  paletteId: string,
  onSave?: SaveFn,
  vimMode = false
): { block: HTMLElement; flush: FlushFn | null } | null {
  const html = buildDgmoBlockHtml(source, svgsHtml, { mode: 'showcase' });
  const block = appendBlockHtml(container, html);
  if (!block) return null;
  frameSourcePanel(block);
  retargetOpenLink(block, source, isDark, paletteId);
  injectExpandButton(block);
  injectDocsButton(block, source);
  bindToolbar(block);
  let flush: FlushFn | null = null;
  if (onSave) {
    flush = enableBlockEditing(block, source, {
      update: (draft) => updateDiagram(block, draft, isDark, paletteId),
      save: onSave,
      vimMode,
    });
  }
  return { block, flush };
}

/**
 * Frame state as classes instead of `:has()` selectors. When the block carries
 * a source `<details>`, mark it `dgmo-has-source` (reserves the border frame)
 * and mirror the panel's open/closed state onto `dgmo-source-open` (paints the
 * border in). The `<details>` and these classes outlive edit re-renders —
 * `updateDiagram` only swaps the `.dgmo-svg` slot, not the block or its panel.
 */
function frameSourcePanel(block: HTMLElement): void {
  const details = block.querySelector<HTMLDetailsElement>(
    'details.dgmo-source-wrap'
  );
  if (!details) return;
  block.classList.add('dgmo-has-source');
  block.classList.toggle('dgmo-source-open', details.open);
  details.addEventListener('toggle', () => {
    block.classList.toggle('dgmo-source-open', details.open);
  });
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

/**
 * Full-screen expand icon (arrows-out), mirroring dgmo's canonical
 * `EXPAND_ICON`. The published `@diagrammo/dgmo/block` this plugin bundles
 * doesn't yet emit the expand button (it's merged but unreleased upstream), so
 * inject it into the hover toolbar here — the lightbox handler + `.dgmo-lightbox`
 * CSS already live in this plugin. Idempotent: re-renders replace the block.
 */
const EXPAND_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 2.5h4v4"/><path d="M6.5 13.5h-4v-4"/><path d="M13.5 2.5 9 7"/><path d="M2.5 13.5 7 9"/></svg>';

function injectExpandButton(block: HTMLElement): void {
  const toolbar = block.querySelector<HTMLElement>('summary.dgmo-toolbar');
  if (!toolbar || toolbar.querySelector('.dgmo-expand')) return;
  const doc = toolbar.ownerDocument;
  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = 'dgmo-toolbar-btn dgmo-expand';
  btn.setAttribute('aria-label', 'View full screen');
  btn.title = 'Expand';
  // No innerHTML (plugin review guidelines): parse the icon and import it.
  const iconDoc = new DOMParser().parseFromString(
    EXPAND_ICON,
    'image/svg+xml'
  );
  const icon = iconDoc.documentElement;
  if (icon) btn.appendChild(doc.importNode(icon, true));
  // Sit just left of copy/open — right after the source toggle.
  const toggle = toolbar.querySelector('.dgmo-toggle');
  if (toggle?.nextSibling) toolbar.insertBefore(btn, toggle.nextSibling);
  else toolbar.appendChild(btn);
}

/**
 * Book icon — links the block to the online docs page for its chart type.
 * Added only when the source declares a known chart type; the docs pages live
 * at `diagrammo.app/docs/chart-<id>` (one per base type).
 */
const DOCS_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';

function injectDocsButton(block: HTMLElement, source: string): void {
  const toolbar = block.querySelector<HTMLElement>('summary.dgmo-toolbar');
  if (!toolbar || toolbar.querySelector('.dgmo-docs')) return;
  const id = parseDgmoChartType(source);
  if (!id || !knownChartTypeIds.includes(id)) return;

  const doc = toolbar.ownerDocument;
  const link = doc.createElement('a');
  link.className = 'dgmo-toolbar-btn dgmo-docs';
  link.setAttribute('href', `${DOCS_BASE}/chart-${id}`);
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  link.setAttribute('aria-label', `Open ${id} documentation`);
  link.title = 'Documentation';
  const iconDoc = new DOMParser().parseFromString(DOCS_ICON, 'image/svg+xml');
  const icon = iconDoc.documentElement;
  if (icon) link.appendChild(doc.importNode(icon, true));
  // Sit just left of the open-in-editor link (rightmost).
  const openLink = toolbar.querySelector('a.dgmo-open');
  if (openLink) toolbar.insertBefore(link, openLink);
  else toolbar.appendChild(link);
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

    if (btn.matches('button.dgmo-expand')) {
      openDgmoLightbox(block);
      return;
    }

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

    if (insideSummary && btn.matches('a.dgmo-open, a.dgmo-docs')) {
      const href = (btn as HTMLAnchorElement).href;
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
    }
  });
}

// ============================================================
// Full-screen lightbox (expand toolbar button)
// ============================================================
//
// MIRROR of the canonical helper in @diagrammo/dgmo's `auto/shared.ts`
// (`openDgmoLightbox`), kept in sync with remark-dgmo's copy. Obsidian-specific
// differences: no innerHTML (plugin review guidelines) — the close glyph is a
// text node; and `block.ownerDocument` / its defaultView are used throughout so
// it works in Obsidian popout windows. The `.dgmo-lightbox*` CSS is generated
// from dgmo's BLOCK_CSS into styles.css.

const LIGHTBOX_XLINK_NS = 'http://www.w3.org/1999/xlink';
const LIGHTBOX_REF_ATTRS = [
  'clip-path',
  'mask',
  'filter',
  'fill',
  'stroke',
  'marker-start',
  'marker-mid',
  'marker-end',
];
let lightboxIdSeq = 0;

/**
 * Namespace a cloned SVG's ids + internal `url(#id)`/`href="#id"` refs so the
 * clone can't clash with the still-mounted inline copy (WebKit resolves
 * duplicate ids to the first match, corrupting gradients/clips/masks).
 */
function namespaceLightboxSvgIds(root: SVGElement, prefix: string): void {
  const map = new Map<string, string>();
  root.querySelectorAll('[id]').forEach((el) => {
    const oldId = el.getAttribute('id');
    if (!oldId) return;
    const newId = prefix + oldId;
    map.set(oldId, newId);
    el.setAttribute('id', newId);
  });
  if (map.size === 0) return;
  const remap = (value: string): string =>
    value.replace(/url\(#([^)]+)\)/g, (m, id: string) => {
      const next = map.get(id);
      return next ? `url(#${next})` : m;
    });
  root.querySelectorAll('*').forEach((el) => {
    for (const attr of LIGHTBOX_REF_ATTRS) {
      const v = el.getAttribute(attr);
      if (v && v.includes('url(#')) el.setAttribute(attr, remap(v));
    }
    const style = el.getAttribute('style');
    if (style && style.includes('url(#'))
      el.setAttribute('style', remap(style));
    const href = el.getAttribute('href');
    if (href && href.startsWith('#') && map.has(href.slice(1)))
      el.setAttribute('href', '#' + map.get(href.slice(1)));
    const xhref = el.getAttributeNS(LIGHTBOX_XLINK_NS, 'href');
    if (xhref && xhref.startsWith('#') && map.has(xhref.slice(1)))
      el.setAttributeNS(
        LIGHTBOX_XLINK_NS,
        'href',
        '#' + map.get(xhref.slice(1))
      );
  });
}

/**
 * Open the block's diagram in a full-viewport `<dialog>` lightbox: clone the
 * currently-visible color-mode SVG, namespace its ids, then `showModal()`.
 * Escape / backdrop-click / the close button dismiss and remove it.
 */
function openDgmoLightbox(block: HTMLElement): void {
  const doc = block.ownerDocument;
  const win = doc.defaultView;
  if (!win) return;

  const wrappers = block.querySelectorAll('.dgmo-light, .dgmo-dark, .dgmo-svg');
  let svg: SVGSVGElement | null = null;
  let bg: string | null = null;
  for (const w of Array.from(wrappers)) {
    if (win.getComputedStyle(w).display === 'none') continue;
    const found = w.querySelector('svg');
    if (found) {
      svg = found as SVGSVGElement;
      bg = w.getAttribute('data-dgmo-bg');
      break;
    }
  }
  if (!svg) svg = block.querySelector('svg');
  if (!svg) return;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  namespaceLightboxSvgIds(clone, `dgmo-lb-${++lightboxIdSeq}-`);

  const dialog = doc.createElement('dialog');
  dialog.className = 'dgmo-lightbox';
  dialog.setAttribute('aria-label', 'Diagram, full screen');

  const closeBtn = doc.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'dgmo-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close full screen');
  // No innerHTML (plugin guidelines): a text glyph, sized by the CSS.
  closeBtn.textContent = '✕';

  const host = doc.createElement('div');
  host.className = 'dgmo-lightbox-svg';
  // Always paint an opaque surface behind the enlarged diagram — transparent
  // embeds strip the chart bg from the SVG, so without this the note shows
  // through the expanded view. Use the block's own palette bg when stashed.
  if (bg) host.style.background = bg;
  host.appendChild(clone);

  dialog.appendChild(closeBtn);
  dialog.appendChild(host);
  doc.body.appendChild(dialog);

  const close = (): void => {
    if (dialog.open) dialog.close();
  };
  closeBtn.addEventListener('click', close);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
}

/**
 * Render just the diagram SVG (no block chrome, no toolbar, not editable) into
 * `container` — for gallery thumbnails in the "New diagram" picker. Errors
 * render nothing (the tile keeps its label). Maps go through the DI pipeline
 * like the main renderer.
 */
export async function renderDiagramThumbnail(
  source: string,
  container: HTMLElement,
  isDark: boolean,
  paletteId: string
): Promise<void> {
  container.replaceChildren();
  if (looksLikeMap(source)) {
    const out = buildMapSvg(source, isDark, paletteId);
    if ('error' in out) return;
    container.appendChild(container.ownerDocument.importNode(out.svgEl, true));
    scaleSvgToFit(container);
    return;
  }
  try {
    const result = await render(source, {
      theme: isDark ? 'dark' : 'light',
      palette: resolvePalette(paletteId),
    });
    if (result.diagnostics.some((d) => d.severity === 'error') || !result.svg) {
      return;
    }
    if (!container.isConnected) return;
    appendBlockHtml(
      container,
      `<div class="dgmo-svg" data-dgmo-bg="${resolvePalette(paletteId)[isDark ? 'dark' : 'light'].bg}">${normalizeSvgForEmbed(result.svg, { background: embedBackground })}</div>`
    );
  } catch {
    /* thumbnail best-effort — leave the tile label */
  }
}

/** Write-back hook for in-block editing (code blocks pass one; embeds don't). */
export type SaveFn = (next: string) => Promise<void>;

/**
 * Renders the standard block. When `onSave` is provided the source panel is
 * live-editable; the returned flush saves a pending edit and should be called
 * by the host's unload (Live Preview unmounts blocks on scroll — an
 * in-progress edit must not be lost). Null when the block isn't editable.
 */
export async function renderDgmo(
  source: string,
  container: HTMLElement,
  isDark: boolean,
  paletteId = 'nord',
  onSave?: SaveFn,
  vimMode = false
): Promise<FlushFn | null> {
  // The map chart type loads its geo data via Node `fs` in the public
  // `render()` — which fails in the Obsidian renderer and yields an empty SVG.
  // Render it through dgmo's DI pipeline with the bundled data instead.
  if (looksLikeMap(source)) {
    return renderMapDgmo(source, container, isDark, paletteId, onSave, vimMode);
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
    return null;
  }

  const firstError: DgmoError | undefined = diagnostics.find(
    (d) => d.severity === 'error'
  );
  if (firstError) {
    showError(container, formatDgmoError(firstError), source);
    return null;
  }

  if (!svg) {
    showError(container, 'No SVG output from dgmo render().', source);
    return null;
  }

  // normalizeSvgForEmbed tightens the export-canvas viewBox to the diagram's
  // content and strips fixed width/height, so block.css's responsive sizing
  // (`.dgmo-svg > svg { width:100%; height:auto }`) matches the content, not
  // the fixed 1200×800 canvas.
  const mounted = mountBlock(
    container,
    source,
    `<div class="dgmo-svg" data-dgmo-bg="${resolvePalette(paletteId)[isDark ? 'dark' : 'light'].bg}">${normalizeSvgForEmbed(svg, { background: embedBackground })}</div>`,
    isDark,
    paletteId,
    onSave,
    vimMode
  );
  return mounted?.flush ?? null;
}

/**
 * Live re-render for in-block editing: replace only the `.dgmo-svg` hero with
 * the draft's SVG (or the standard error card), leaving the block chrome and
 * the open source editor intact. Draft errors keep the editor usable — the
 * card sits where the diagram was.
 */
export async function updateDiagram(
  block: HTMLElement,
  source: string,
  isDark: boolean,
  paletteId: string
): Promise<void> {
  const slot = block.querySelector<HTMLElement>('.dgmo-svg');
  if (!slot) return;

  if (looksLikeMap(source)) {
    const out = buildMapSvg(source, isDark, paletteId);
    if (!block.isConnected) return;
    slot.replaceChildren();
    if ('error' in out) {
      appendBlockHtml(slot, errorBlockHtml(new Error(out.error), ''));
      return;
    }
    slot.appendChild(slot.ownerDocument.importNode(out.svgEl, true));
    scaleSvgToFit(slot);
    return;
  }

  let html: string;
  try {
    const result: { svg: string; diagnostics: DgmoError[] } = await render(
      source,
      {
        theme: isDark ? 'dark' : 'light',
        palette: resolvePalette(paletteId),
      }
    );
    const firstError = result.diagnostics.find((d) => d.severity === 'error');
    if (firstError) {
      html = errorBlockHtml(new Error(formatDgmoError(firstError)), '');
    } else if (!result.svg) {
      html = errorBlockHtml(new Error('No SVG output from dgmo render().'), '');
    } else {
      html = normalizeSvgForEmbed(result.svg, { background: embedBackground });
    }
  } catch (err) {
    html = errorBlockHtml(
      err instanceof Error ? err : new Error(String(err)),
      ''
    );
  }
  if (!block.isConnected) return;
  slot.replaceChildren();
  appendBlockHtml(slot, html);
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
  paletteId: string,
  onSave?: SaveFn,
  vimMode = false
): FlushFn | null {
  const out = buildMapSvg(source, isDark, paletteId);
  if ('error' in out) {
    showError(container, out.error, source);
    return null;
  }

  // Maps are rendered as live DOM (not an SVG string), so mount the block
  // chrome with an empty `.dgmo-svg` slot and import the node into it —
  // serializing a full geo basemap to string and back would be wasteful.
  const mounted = mountBlock(
    container,
    source,
    '<div class="dgmo-svg"></div>',
    isDark,
    paletteId,
    onSave,
    vimMode
  );
  const slot = mounted?.block.querySelector<HTMLElement>('.dgmo-svg');
  if (!slot) return null;
  slot.appendChild(slot.ownerDocument.importNode(out.svgEl, true));
  scaleSvgToFit(slot);
  return mounted?.flush ?? null;
}

/** Run the map DI pipeline off-DOM; the SVG element or a display error. */
function buildMapSvg(
  source: string,
  isDark: boolean,
  paletteId: string
): { svgEl: SVGSVGElement } | { error: string } {
  const palette = resolvePalette(paletteId)[isDark ? 'dark' : 'light'];

  let resolved: ReturnType<typeof resolveMap>;
  // `activeDocument` (not the global `document`) so map rendering works in
  // Obsidian popout windows, per the plugin review guidelines.
  const exportDiv = activeDocument.createElement('div');
  try {
    resolved = resolveMap(parseMap(source), mapData);
    // Content-aware canvas: height derived from the map's intrinsic projected
    // aspect (no vertical stretch). The viewBox-derived aspect-ratio set in
    // scaleSvgToFit makes the embed responsive at width:100%.
    const dims = mapExportDimensions(resolved, mapData, 1200);
    renderMapForExport(exportDiv, resolved, mapData, palette, isDark, dims);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  const firstError = resolved.diagnostics.find((d) => d.severity === 'error');
  if (firstError) return { error: formatDgmoError(firstError) };

  const svgEl = exportDiv.querySelector('svg');
  if (!svgEl) return { error: 'No SVG output from dgmo render().' };
  return { svgEl };
}
