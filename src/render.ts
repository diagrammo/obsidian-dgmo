import {
  render,
  formatDgmoError,
  encodeDiagramUrl,
  palettes,
  type DgmoError,
  type PaletteConfig,
} from '@diagrammo/dgmo';
import {
  looksLikeMap,
  parseMap,
  resolveMap,
  renderMapForExport,
} from '@diagrammo/dgmo/internal';
import { mapData } from './map-data';

function resolvePalette(id: string): PaletteConfig {
  return Object.values(palettes).find((p) => p.id === id) ?? palettes.nord;
}

function showError(container: HTMLElement, message: string): void {
  container.empty();
  const wrapper = container.createDiv({ cls: 'dgmo-error' });
  wrapper.createEl('p', { cls: 'dgmo-error-title', text: 'Parse error' });
  wrapper.createEl('p', { cls: 'dgmo-error-message', text: message });
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
      `Render error: ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  const firstError: DgmoError | undefined = diagnostics.find(
    (d) => d.severity === 'error'
  );
  if (firstError) {
    showError(container, formatDgmoError(firstError));
    return;
  }

  if (!svg) {
    showError(container, 'No SVG output from dgmo render().');
    return;
  }

  const wrapper = container.createDiv({ cls: 'dgmo-container' });
  const svgDoc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const svgNode = svgDoc.documentElement;
  if (svgNode) wrapper.appendChild(wrapper.doc.importNode(svgNode, true));
  scaleSvgToFit(wrapper);
  addEditButton(wrapper, source, isDark, paletteId);
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
  const exportDiv = document.createElement('div');
  try {
    resolved = resolveMap(parseMap(source), mapData);
    // Fixed export canvas; scaleSvgToFit makes the result responsive.
    renderMapForExport(exportDiv, resolved, mapData, palette, isDark, {
      width: 1200,
      height: 800,
    });
  } catch (err) {
    showError(
      container,
      `Render error: ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  const firstError = resolved.diagnostics.find((d) => d.severity === 'error');
  if (firstError) {
    showError(container, formatDgmoError(firstError));
    return;
  }

  const svgEl = exportDiv.querySelector('svg');
  if (!svgEl) {
    showError(container, 'No SVG output from dgmo render().');
    return;
  }

  const wrapper = container.createDiv({ cls: 'dgmo-container' });
  wrapper.appendChild(wrapper.doc.importNode(svgEl, true));
  scaleSvgToFit(wrapper);
  addEditButton(wrapper, source, isDark, paletteId);
}

function addEditButton(
  wrapper: HTMLElement,
  source: string,
  isDark: boolean,
  paletteId: string
): void {
  const url = encodeDiagramUrl(source, {
    palette: resolvePalette(paletteId),
    theme: isDark ? 'dark' : 'light',
  });
  if (!url) return; // too large to share — silently skip

  const link = wrapper.createEl('a', {
    cls: 'dgmo-edit-link',
    href: url,
    attr: {
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': 'Edit this diagram on online.diagrammo.app',
      title: 'Edit on online.diagrammo.app',
    },
  });
  link.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';
}
