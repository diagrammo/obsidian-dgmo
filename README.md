# Diagrammo Diagrams for Obsidian

Write a `dgmo` code block and it renders as a diagram inline in your notes — reading mode and live preview, desktop and mobile.

[Diagrammo](https://diagrammo.app) gives you **45 chart types** from one small plain-text language: data viz, software architecture, project planning, hierarchies, geographic maps, and more. Because the diagrams are plain text, they're searchable in Obsidian, diffable in git or Sync history, and never go stale the way an exported image does.

📖 **Setup guide:** [diagrammo.app/embed#obsidian](https://diagrammo.app/embed#obsidian)

![A geographic map with routes and points of interest, written as plain text in Diagrammo](https://diagrammo.app/readme/map.gif)

## Supported chart types

Every chart type from [`@diagrammo/dgmo`](https://github.com/diagrammo/dgmo) renders in Obsidian:

| Category | Types |
|----------|-------|
| **Data & charts** | arc, area, bar, chord, doughnut, funnel, function, heatmap, line, multi-line, pie, polar-area, radar, sankey, scatter, slope, treemap, wordcloud |
| **Business & strategy** | cycle, journey-map, map, org, pyramid, quadrant, ring, tech-radar, venn |
| **Project & process** | gantt, kanban, pert, raci, rasci, daci, timeline |
| **Software & architecture** | boxes-and-lines, c4, class, er, flowchart, infra, mindmap, sequence, sitemap, state, wireframe |

Run **Diagrammo Diagrams: Create example note with all chart types** from the command palette to see every chart type rendered with working sample data. Full language reference at [diagrammo.app/reference](https://diagrammo.app/reference).

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

The diagram renders inline in reading mode and live preview. Hover any rendered diagram to reveal a slim icon toolbar below it: view the DGMO source in place (`</>`), copy the source, or open it in [online.diagrammo.app](https://online.diagrammo.app) for live editing with the same palette and theme.

## Author in the Diagrammo app

This plugin renders the exact same DGMO that powers the **[Diagrammo desktop app](https://diagrammo.app/app)** (native macOS, offline, auto-updating) and the **[online editor](https://online.diagrammo.app)** (any browser, nothing to install). When you want a heavier authoring session, open a diagram there for **live preview, autocomplete, optional vim keybindings, all 7 palettes (light/dark/transparent), and one-click PNG/SVG export plus shareable links** — then paste the text straight back into your note. Same language, same palettes, everywhere. There's even an [MCP server](https://diagrammo.app/ai) so AI assistants can draft diagrams for you.

## Example note

Open the command palette (`Cmd/Ctrl + P`) and run:

> **Diagrammo Diagrams: Create example note with all chart types**

This creates a `Diagrammo Examples.md` file in your vault with working examples of every supported chart type.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Palette** | Color palette for all diagrams — all 7 dgmo palettes available (slate, atlas, blueprint, tidewater, nord, catppuccin, tokyo-night) | `slate` |
| **Theme** | Light, dark, or auto (follows Obsidian's theme) | `auto` |

## Install

1. Open **Settings > Community Plugins > Browse** in Obsidian
2. Search for "Diagrammo Diagrams"
3. Click **Install**, then **Enable**

Or install directly from [community.obsidian.md/plugins/dgmo](https://community.obsidian.md/plugins/dgmo).

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

- `@diagrammo/dgmo` `^0.30.0` — diagram parsing and rendering (bundled by esbuild; brings its own transitive rendering deps)
- `obsidian` `^1.12.3` — Obsidian plugin API (dev only, externalized)

### Testing locally

1. Run `npm run dev` (watch mode)
2. Symlink or copy the repo into your vault's `.obsidian/plugins/dgmo/` folder
3. Enable the plugin in Obsidian settings
4. Edit a note with a `dgmo` code block — changes rebuild automatically

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
