# Diagrammo Diagrams for Obsidian

Render [Diagrammo](https://diagrammo.app) diagrams inline in your Obsidian notes using ` ```dgmo ` code fences.

![bar, sequence, timeline, pie — all rendered inside Obsidian](https://diagrammo.app/og-image.png)

## Supported chart types

| Category | Types |
|----------|-------|
| **Charts** | bar, line, multi-line, area, pie, doughnut, radar, polar-area, bar-stacked |
| **Diagrams** | sequence, arc, timeline, venn, quadrant, slope, wordcloud |

## Usage

Write a fenced code block with the `dgmo` language tag:

````markdown
```dgmo
chart: bar
title: Quarterly Revenue
xlabel: Quarter
ylabel: Revenue ($M)

Q1: 4.2
Q2: 4.8
Q3: 5.1
Q4: 5.9
```
````

The diagram renders inline in reading mode and live preview.

## Example note

Open the command palette (`Cmd/Ctrl + P`) and run:

> **Diagrammo Diagrams: Create example note with all chart types**

This generates a `Diagrammo Examples.md` file in your vault with working examples of every chart type.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Palette** | Color palette for all diagrams (nord, catppuccin, etc.) | `nord` |
| **Theme** | Light, dark, or auto (follows Obsidian) | `auto` |
| **Chart height** | Height in pixels for chart-type diagrams | `400` |

## Install

### From Obsidian Community Plugins (coming soon)

1. Open **Settings > Community Plugins > Browse**
2. Search for "Diagrammo Diagrams"
3. Click **Install**, then **Enable**

### Manual install

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/diagrammo/obsidian-dgmo/releases)
2. Create a folder: `<vault>/.obsidian/plugins/obsidian-dgmo/`
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
npm run build     # One-shot build → main.js
npm run dev       # Watch mode (rebuilds on save)
```

The build (esbuild) produces `main.js` in the repo root, which Obsidian loads directly.

### Project structure

```
src/
├── main.ts       # Plugin lifecycle, markdown processor, example note command
├── render.ts     # Core rendering logic (ECharts + D3 charts)
├── settings.ts   # Settings UI (palette, theme, chart height)
└── examples.ts   # Full example note with all chart types
```

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
4. Create a GitHub release with tag `<version>` (e.g., `1.0.0`)
5. Attach these files to the release:
   - `main.js`
   - `manifest.json`
   - `styles.css`

### Obsidian Community Plugins

The plugin is submitted to the [Obsidian Community Plugins](https://github.com/obsidianmd/obsidian-releases) registry. New versions are picked up automatically from GitHub releases — just publish a new release with the required files.

## Links

- [diagrammo.app](https://diagrammo.app) — full desktop editor
- [@diagrammo/dgmo](https://github.com/diagrammo/dgmo) — the dgmo markup library and CLI
- [dgmo syntax reference](https://github.com/diagrammo/dgmo#readme)

## License

MIT
