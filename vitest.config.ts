import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // renderMapForExport drives d3-selection against a real DOM container, so
    // the suite needs a browser-like environment.
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    // The real `obsidian` package is types-only (no runtime). Alias it to a
    // minimal stub so embed.ts (MarkdownRenderChild, etc.) is importable here.
    alias: {
      obsidian: fileURLToPath(
        new URL('./tests/__mocks__/obsidian.ts', import.meta.url)
      ),
    },
  },
});
