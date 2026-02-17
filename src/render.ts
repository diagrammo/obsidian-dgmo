import * as echarts from 'echarts';
import {
  parseDgmoChartType,
  getDgmoFramework,
  parseD3,
  parseSequenceDgmo,
  renderSlopeChart,
  renderArcDiagram,
  renderTimeline,
  renderWordCloud,
  renderVenn,
  renderQuadrant,
  renderSequenceDiagram,
  parseChart,
  parseEChart,
  buildEChartsOption,
  buildEChartsOptionFromChart,
  getPalette,
  type PaletteColors,
} from '@diagrammo/dgmo';

// Standard chart types that use parseChart + buildEChartsOptionFromChart
const STANDARD_CHART_TYPES = new Set([
  'bar',
  'line',
  'multi-line',
  'area',
  'pie',
  'doughnut',
  'radar',
  'polar-area',
  'bar-stacked',
]);

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
  const parsed = parseD3(source, palette);

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
  const isStandard = chartType !== null && STANDARD_CHART_TYPES.has(chartType);

  let option: echarts.EChartsOption;
  let error: string | undefined;

  if (isStandard) {
    const parsed = parseChart(source, palette);
    error = parsed.error;
    if (!error) {
      option = buildEChartsOptionFromChart(parsed, palette, isDark);
    }
  } else {
    const parsed = parseEChart(source, palette);
    error = parsed.error;
    if (!error) {
      option = buildEChartsOption(parsed, palette, isDark);
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

  const framework = getDgmoFramework(chartType);

  if (!framework) {
    showError(container, `Unknown chart type: ${chartType}`);
    return;
  }

  const palette = resolvePalette(isDark, paletteId);

  if (framework === 'echart') {
    renderEChartsChart(source, container, palette, isDark, chartHeight);
  } else if (framework === 'd3') {
    renderD3Chart(source, container, palette, isDark);
  } else {
    // Mermaid — skip for scaffold
    showError(container, `Mermaid-backed charts are not yet supported in Obsidian.`);
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
