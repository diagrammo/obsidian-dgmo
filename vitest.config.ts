import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // renderMapForExport drives d3-selection against a real DOM container, so
    // the suite needs a browser-like environment.
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    // `createEl` and friends live on Node.prototype at Obsidian runtime, not in
    // the DOM spec — the source is required to use them, so the suite has to
    // install them before anything builds an element.
    setupFiles: ['./tests/__mocks__/obsidian-dom.ts'],
    // The real `obsidian` package is types-only (no runtime). Alias it to a
    // minimal stub so embed.ts (MarkdownRenderChild, etc.) is importable here.
    alias: {
      obsidian: fileURLToPath(
        new URL('./tests/__mocks__/obsidian.ts', import.meta.url)
      ),
    },
  },
});
