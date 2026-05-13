import { render, formatDgmoError, type DgmoError } from '@diagrammo/dgmo';

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
  paletteId = 'nord',
): Promise<void> {
  let svg: string;
  let diagnostics: DgmoError[];
  try {
    const result: { svg: string; diagnostics: DgmoError[] } = await render(
      source,
      {
        theme: isDark ? 'dark' : 'light',
        palette: paletteId,
      },
    );
    svg = result.svg;
    diagnostics = result.diagnostics;
  } catch (err) {
    showError(
      container,
      `Render error: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  const firstError: DgmoError | undefined = diagnostics.find(
    (d) => d.severity === 'error',
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
}
