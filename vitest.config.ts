import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // renderMapForExport drives d3-selection against a real DOM container, so
    // the suite needs a browser-like environment.
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
