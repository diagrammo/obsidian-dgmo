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
  type PaletteColors,
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

  if (parsed.type === 'sequence') {
    const seqParsed = parseSequenceDgmo(source);
    if (seqParsed.error) {
      showError(container, seqParsed.error);
      return;
    }
    renderSequenceDiagram(el, seqParsed, palette, isDark);
  } else if (parsed.type === 'wordcloud') {
    renderWordCloud(el, parsed, palette, isDark);
  } else if (parsed.type === 'arc') {
    renderArcDiagram(el, parsed, palette, isDark);
  } else if (parsed.type === 'timeline') {
    renderTimeline(el, parsed, palette, isDark);
  } else if (parsed.type === 'venn') {
    renderVenn(el, parsed, palette, isDark);
  } else if (parsed.type === 'quadrant') {
    renderQuadrant(el, parsed, palette, isDark);
  } else {
    // Default: slope chart
    renderSlopeChart(el, parsed, palette, isDark);
  }
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

  if (!isExtended) {
    const parsed = parseChart(source, palette);
    error = parsed.error;
    if (!error) {
      option = buildSimpleChartOption(parsed, palette, isDark);
    }
  } else {
    const parsed = parseExtendedChart(source, palette);
    error = parsed.error;
    if (!error) {
      option = buildExtendedChartOption(parsed, palette, isDark);
    }
  }

  if (error) {
    showError(container, error);
    return;
  }

  const wrapper = container.createDiv({ cls: 'dgmo-container-echarts' });
  wrapper.style.minHeight = `${chartHeight}px`;
  wrapper.style.height = `${chartHeight}px`;
  const chart = echarts.init(wrapper);
  chart.setOption(option!, true);
  activeCharts.add(chart);

  // Resize when the container becomes visible / changes size
  const resizeObserver = new ResizeObserver(() => {
    chart.resize();
  });
  resizeObserver.observe(wrapper);
}

/**
 * Main entry point: render dgmo source into a container element.
 */
export function renderDgmo(
  source: string,
  container: HTMLElement,
  isDark: boolean,
  paletteId = 'nord',
  chartHeight = 400,
): void {
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
  } else {
    renderD3Chart(source, container, palette, isDark);
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
