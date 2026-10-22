# Community listing screenshots

The images on community.obsidian.md/plugins/dgmo: mock Obsidian notes holding real dgmo renders. Upload them in file-name order (sequence first).

- `diagrams/*.dgmo` — the diagram sources
- `scripts/listing-screenshots.mjs` — lays them into note pages and captures each at 3000×2000

```bash
node scripts/listing-screenshots.mjs
```

Re-run after a dgmo bump that changes how these chart types look. The countdown and clock show the time the script runs. Needs a Chromium: `$CHROME`, or Playwright's `chrome-headless-shell` in `~/Library/Caches/ms-playwright`.
