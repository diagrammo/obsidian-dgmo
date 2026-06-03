# Diagrammo Diagrams for Obsidian

Render [Diagrammo](https://diagrammo.app) diagrams inline in your Obsidian notes using ` ```dgmo ` code fences. Works on desktop and mobile.

![bar, sequence, timeline, pie — all rendered inside Obsidian](https://diagrammo.app/og-image.png)

## Supported chart types

All 40+ chart types from [`@diagrammo/dgmo`](https://github.com/diagrammo/dgmo) render in Obsidian:

| Category | Types |
|----------|-------|
| **Data** | arc, area, bar, bar-stacked, chord, doughnut, function, heatmap, line, multi-line, pie, polar-area, radar, sankey, scatter, slope |
| **Business** | cycle, funnel, journey-map, org, pyramid, quadrant, tech-radar, venn, wordcloud |
| **Project** | gantt, kanban, timeline |
| **Software** | boxes-and-lines, c4, class, er, flowchart, infra, mindmap, sequence, sitemap, state, wireframe |

Run **Diagrammo Diagrams: Create example note with all chart types** from the command palette to see every chart type rendered with working sample data. Full language reference at [diagrammo.app/docs](https://diagrammo.app/docs).

## Usage

Write a fenced code block with the `dgmo` language tag:

````markdown
```dgmo
bar Quarterly Revenue
x-label Quarter
y-label Revenue ($M)

Q1 4.2
Q2 4.8
Q3 5.1
Q4 5.9
```
````

The diagram renders inline in reading mode and live preview. Hover any rendered diagram to reveal a small open-in-new-tab icon in the top-right corner — click it to pop the source open in [online.diagrammo.app](https://online.diagrammo.app) for live editing, with the same palette and theme.

## Example note

Open the command palette (`Cmd/Ctrl + P`) and run:

> **Diagrammo Diagrams: Create example note with all chart types**

This creates a `Diagrammo Examples.md` file in your vault with working examples of every supported chart type.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Palette** | Color palette for all diagrams — all 13 dgmo palettes available (nord, atlas, blueprint, slate, tidewater, solarized, catppuccin, dracula, rose-pine, gruvbox, monokai, tokyo-night, one-dark) | `nord` |
| **Theme** | Light, dark, or auto (follows Obsidian's theme) | `auto` |

## Install

### From Obsidian Community Plugins (recommended)

The plugin is listed at [community.obsidian.md/plugins/dgmo](https://community.obsidian.md/plugins/dgmo).

1. Open **Settings > Community Plugins > Browse**
2. Search for "Diagrammo Diagrams"
3. Click **Install**, then **Enable**

### With BRAT (beta / pre-release builds)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) installs and auto-updates plugins straight from GitHub. Use it if you want to test unreleased changes before they hit the Community Plugins store.

1. In Obsidian, open **Settings > Community Plugins > Browse**, install **Obsidian42 - BRAT**, and enable it
2. Open **Settings > BRAT > Beta Plugin List** and click **Add Beta Plugin**
3. Paste this repo URL: `https://github.com/diagrammo/obsidian-dgmo`
4. Leave the version dropdown on **Latest version** and click **Add Plugin**
5. Enable **Diagrammo Diagrams** under **Settings > Community Plugins**

### Manual install

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/diagrammo/obsidian-dgmo/releases)
2. Create a folder: `<vault>/.obsidian/plugins/dgmo/`
3. Copy the three files into that folder
4. Enable the plugin in **Settings > Community Plugins**

## Development

### Prerequisites

- Node.js 18+

### Setup

```bash
npm install
```

### Commands

```bash
npm run build     # One-shot build → main.js (esbuild, CJS bundle)
npm run dev       # Watch mode (rebuilds on save, inline sourcemaps)
```

The build bundles `@diagrammo/dgmo` and its rendering dependencies into a single `main.js` in the repo root, which Obsidian loads directly. `obsidian`, `electron`, and CodeMirror packages are externalized.

### Project structure

```
src/
├── main.ts       # Plugin lifecycle, markdown post-processor, example note command
├── render.ts     # Rendering dispatcher (delegates each chart type to @diagrammo/dgmo)
├── settings.ts   # Settings tab UI (palette dropdown, theme override)
└── examples.ts   # Example note content with all chart types
```

### Dependencies

- `@diagrammo/dgmo` `^0.14.1` — diagram parsing and rendering (bundled by esbuild; brings its own transitive rendering deps)
- `obsidian` `^1.12.3` — Obsidian plugin API (dev only, externalized)

### Testing locally

1. Run `npm run dev` (watch mode)
2. Symlink or copy the repo into your vault's `.obsidian/plugins/dgmo/` folder
3. Enable the plugin in Obsidian settings
4. Edit a note with a ` ```dgmo ` code fence — changes rebuild automatically

## Releasing

### GitHub release

1. Bump `version` in both `package.json` and `manifest.json` (must match)
2. Build: `npm run build`
3. Commit and push
4. Create a GitHub release with tag `<version>` (e.g., `1.0.1`)
5. Attach these files to the release:
   - `main.js`
   - `manifest.json`
   - `styles.css`

### Obsidian Community Plugins

The plugin is listed in the [Obsidian Community Plugins](https://github.com/obsidianmd/obsidian-releases) registry. New versions are picked up automatically from GitHub releases — just publish a new release with the required files attached.

## Links

- [community.obsidian.md/plugins/dgmo](https://community.obsidian.md/plugins/dgmo) — official Obsidian plugin page
- [diagrammo.app](https://diagrammo.app) — full desktop editor
- [@diagrammo/dgmo](https://github.com/diagrammo/dgmo) — the dgmo markup library and CLI
- [dgmo syntax reference](https://github.com/diagrammo/dgmo#readme)

## License

MIT
