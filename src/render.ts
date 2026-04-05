import * as echarts from 'echarts';
import {
  parseDgmoChartType,
  getRenderCategory,
  parseVisualization,
  parseSequenceDgmo,
  renderSlopeChart,
  renderArcDiagram,
  renderTimeline,
  renderWordCloud,
  renderVenn,
  renderQuadrant,
  renderSequenceDiagram,
  parseChart,
  parseExtendedChart,
  buildExtendedChartOption,
  buildSimpleChartOption,
  isExtendedChartType,
  getPalette,
  render,
  renderLegendSvg,
  getSimpleChartLegendGroups,
  getExtendedChartLegendGroups,
  getSeriesColors,
  computeScatterLabelGraphics,
  LEGEND_HEIGHT,
  type PaletteColors,
  type LegendGroupData,
  type ScatterLabelPoint,
  type ParsedExtendedChart,
} from '@diagrammo/dgmo';

/**
 * Track active ECharts instances so we can dispose them on unload.
 */
export const activeCharts = new Set<echarts.ECharts>();

/**
 * Resolve the palette colors for the current theme.
 */
function resolvePalette(isDark: boolean, paletteId: string): PaletteColors {
  const config = getPalette(paletteId);
  return isDark ? config.dark : config.light;
}

/**
 * Show a styled error message inside the container.
 */
function showError(container: HTMLElement, message: string): void {
  container.empty();
  const wrapper = container.createDiv({ cls: 'dgmo-error' });
  wrapper.createEl('p', { cls: 'dgmo-error-title', text: 'Parse error' });
  wrapper.createEl('p', { cls: 'dgmo-error-message', text: message });
}

/**
 * Make an SVG element scale to fill its container width.
 */
function scaleSvgToFit(container: HTMLElement): void {
  const svgEl = container.querySelector('svg');
  if (!svgEl) return;

  // If no viewBox exists, create one from the original width/height so
  // the SVG content scales properly when we set width to 100%.
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
 * Render a D3-backed chart into the container.
 */
function renderD3Chart(
  source: string,
  container: HTMLElement,
  palette: PaletteColors,
  isDark: boolean,
): void {
  const parsed = parseVisualization(source, palette);

  if (parsed.error) {
    showError(container, parsed.error);
    return;
  }

  const wrapper = container.createDiv({ cls: 'dgmo-container' });
  const el = wrapper.createDiv();

  // D3 renderers read clientWidth/clientHeight to size the SVG, but in
  // Obsidian the element has zero dimensions at render time (not laid out yet).
  // Pass explicit exportDims to bypass the container measurement.
  const dims = { width: 800, height: 500 };

  try {
    if (parsed.type === 'sequence') {
      const seqParsed = parseSequenceDgmo(source);
      if (seqParsed.error) {
        showError(container, seqParsed.error);
        return;
      }
      renderSequenceDiagram(el, seqParsed, palette, isDark, undefined, { exportWidth: dims.width });
    } else if (parsed.type === 'wordcloud') {
      renderWordCloud(el, parsed, palette, isDark, undefined, dims);
    } else if (parsed.type === 'arc') {
      renderArcDiagram(el, parsed, palette, isDark, undefined, dims);
    } else if (parsed.type === 'timeline') {
      renderTimeline(el, parsed, palette, isDark, undefined, dims);
    } else if (parsed.type === 'venn') {
      renderVenn(el, parsed, palette, isDark, undefined, dims);
    } else if (parsed.type === 'quadrant') {
      renderQuadrant(el, parsed, palette, isDark, undefined, dims);
    } else {
      // Default: slope chart
      renderSlopeChart(el, parsed, palette, isDark, undefined, dims);
    }
  } catch (err) {
    showError(
      container,
      `Render error (${parsed.type}): ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  // Check if the renderer produced any visible output
  if (!el.querySelector('svg')) {
    const details = [
      `type: ${parsed.type}`,
      `links: ${parsed.links?.length ?? 0}`,
      `items: ${parsed.items?.length ?? 0}`,
      `el size: ${el.clientWidth}x${el.clientHeight}`,
      `wrapper size: ${wrapper.clientWidth}x${wrapper.clientHeight}`,
      `container size: ${container.clientWidth}x${container.clientHeight}`,
      `el.children: ${el.children.length}`,
      `el.innerHTML length: ${el.innerHTML.length}`,
    ];
    showError(
      container,
      `No SVG output from ${parsed.type} renderer.\n${details.join('\n')}`
    );
    return;
  }

  scaleSvgToFit(el);
}

/**
 * Render an ECharts-backed chart into the container.
 */
function renderEChartsChart(
  source: string,
  container: HTMLElement,
  palette: PaletteColors,
  isDark: boolean,
  chartHeight: number,
): void {
  const chartType = parseDgmoChartType(source);
  const isExtended = chartType !== null && isExtendedChartType(chartType);

  let option: echarts.EChartsOption;
  let error: string | null | undefined;
  let legendGroups: LegendGroupData[] = [];
  let extendedParsed: ParsedExtendedChart | null = null;
  const colors = getSeriesColors(palette);

  if (!isExtended) {
    const parsed = parseChart(source, palette);
    error = parsed.error;
    if (!error) {
      option = buildSimpleChartOption(parsed, palette, isDark);
      legendGroups = getSimpleChartLegendGroups(parsed, colors);
    }
  } else {
    const parsed = parseExtendedChart(source, palette);
    error = parsed.error;
    if (!error) {
      option = buildExtendedChartOption(parsed, palette, isDark);
      legendGroups = getExtendedChartLegendGroups(parsed, colors);
      extendedParsed = parsed;
    }
  }

  if (error) {
    showError(container, error);
    return;
  }

  // Render custom legend above chart if legend data exists
  const firstGroup = legendGroups[0];
  let legendDiv: HTMLElement | null = null;

  if (firstGroup) {
    const legendResult = renderLegendSvg(legendGroups, {
      palette,
      isDark,
      containerWidth: 0,
      activeGroup: firstGroup.name,
    });

    if (legendResult.svg) {
      option = { ...option!, legend: undefined };

      // When there's a custom legend, extract the ECharts title and render it
      // as a separate div so the DOM order is: title → legend → chart.
      // Without this, the legend div appears above the ECharts-internal title.
      const titleObj = option!.title as { text?: string } | undefined;
      if (titleObj?.text) {
        const titleDiv = container.createDiv({ cls: 'dgmo-echarts-title' });
        titleDiv.style.textAlign = 'center';
        titleDiv.style.fontSize = '20px';
        titleDiv.style.fontWeight = 'bold';
        titleDiv.style.color = palette.text;
        titleDiv.style.padding = '8px 0 0';
        titleDiv.textContent = titleObj.text;
        option = { ...option!, title: undefined };
      }

      legendDiv = container.createDiv({ cls: 'dgmo-echarts-legend' });
      legendDiv.style.height = LEGEND_HEIGHT + 'px';
      legendDiv.innerHTML =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${legendResult.width}" height="${LEGEND_HEIGHT}">` +
        legendResult.svg +
        '</svg>';
    }
  }

  // Strip SSR-computed scatter labels — we'll recompute at runtime with actual dimensions
  const isScatter =
    extendedParsed?.type === 'scatter' &&
    extendedParsed.showLabels !== false &&
    (extendedParsed.scatterPoints?.length ?? 0) > 0;

  if (isScatter) {
    option = { ...option!, graphic: undefined };
  }

  const wrapper = container.createDiv({ cls: 'dgmo-container-echarts' });
  wrapper.style.minHeight = `${chartHeight}px`;
  wrapper.style.height = `${chartHeight}px`;
  const chart = echarts.init(wrapper);
  chart.setOption(option!, true);
  activeCharts.add(chart);

  // Compute scatter labels at runtime using actual pixel positions
  if (isScatter && extendedParsed) {
    const applyScatterLabels = () => {
      const points = extendedParsed!.scatterPoints!;
      const hasCategories = points.some((p) => p.category !== undefined);
      const categories = hasCategories
        ? ([...new Set(points.map((p) => p.category).filter(Boolean))] as string[])
        : [];
      const defaultSize = 15;

      const labelPoints: ScatterLabelPoint[] = [];
      for (const [i, pt] of points.entries()) {
        const pixel = chart.convertToPixel('grid', [pt.x, pt.y]);
        if (!pixel) continue;

        let color: string;
        if (hasCategories && pt.category) {
          const catIndex = categories.indexOf(pt.category);
          color =
            pt.color ??
            extendedParsed!.categoryColors?.[pt.category] ??
            colors[catIndex % colors.length] ??
            '#888';
        } else {
          color = pt.color ?? colors[i % colors.length] ?? '#888';
        }

        labelPoints.push({
          name: pt.name,
          px: pixel[0] ?? 0,
          py: pixel[1] ?? 0,
          color,
          size: pt.size,
        });
      }

      if (labelPoints.length === 0) return;

      const h = chart.getHeight();
      const graphic = computeScatterLabelGraphics(
        labelPoints,
        { top: 20, bottom: h - 20 },
        11,
        defaultSize,
        palette.bg,
      );
      chart.setOption(
        { graphic } as echarts.EChartsOption,
        { replaceMerge: ['graphic'] } as echarts.SetOptionOpts,
      );
    };

    // Apply after layout settles, then re-apply on resize
    setTimeout(applyScatterLabels, 50);
    const labelResizeObserver = new ResizeObserver(() => {
      setTimeout(applyScatterLabels, 200);
    });
    labelResizeObserver.observe(wrapper);
  }

  // Wire hover interactivity on legend
  if (legendDiv) {
    legendDiv.addEventListener('mouseover', (e) => {
      let el = e.target as HTMLElement | null;
      while (el && el !== legendDiv) {
        const seriesName = el.getAttribute?.('data-series-name');
        if (seriesName) {
          chart.dispatchAction({ type: 'highlight', seriesName });
          return;
        }
        el = el.parentElement;
      }
    });
    legendDiv.addEventListener('mouseout', (e) => {
      let el = e.target as HTMLElement | null;
      while (el && el !== legendDiv) {
        if (el.getAttribute?.('data-series-name')) {
          chart.dispatchAction({ type: 'downplay' });
          return;
        }
        el = el.parentElement;
      }
    });
  }

  // Resize when the container becomes visible / changes size
  const resizeObserver = new ResizeObserver(() => {
    chart.resize();
  });
  resizeObserver.observe(wrapper);
}

/**
 * Render a diagram type (flowchart, class, er, org, kanban, c4, etc.)
 * using the unified render() API which returns an SVG string.
 */
async function renderDiagramSvg(
  source: string,
  container: HTMLElement,
  isDark: boolean,
  paletteId: string,
): Promise<void> {
  let svg: string;
  try {
    svg = await render(source, {
      theme: isDark ? 'dark' : 'light',
      palette: paletteId,
    });
  } catch (err) {
    showError(
      container,
      `Render error: ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  if (!svg) {
    const chartType = parseDgmoChartType(source);
    showError(container, `No output from render() for type "${chartType}"`);
    return;
  }

  const wrapper = container.createDiv({ cls: 'dgmo-container' });
  wrapper.innerHTML = svg;
  scaleSvgToFit(wrapper);
}

/**
 * Main entry point: render dgmo source into a container element.
 */
export async function renderDgmo(
  source: string,
  container: HTMLElement,
  isDark: boolean,
  paletteId = 'nord',
  chartHeight = 400,
): Promise<void> {
  const chartType = parseDgmoChartType(source);

  if (!chartType) {
    showError(container, 'Missing chart type. Add a line like: chart: bar');
    return;
  }

  const category = getRenderCategory(chartType);

  if (!category) {
    showError(container, `Unknown chart type: ${chartType}`);
    return;
  }

  const palette = resolvePalette(isDark, paletteId);

  if (category === 'data-chart') {
    renderEChartsChart(source, container, palette, isDark, chartHeight);
  } else if (category === 'visualization' || chartType === 'sequence') {
    renderD3Chart(source, container, palette, isDark);
  } else {
    await renderDiagramSvg(source, container, isDark, paletteId);
  }
}

/**
 * Dispose all tracked ECharts instances.
 */
export function disposeAllCharts(): void {
  for (const chart of activeCharts) {
    chart.dispose();
  }
  activeCharts.clear();
}
