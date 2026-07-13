# Contributing to Diagrammo Diagrams

Thanks for helping improve the Diagrammo Diagrams plugin for Obsidian. This
plugin renders [DGMO](https://diagrammo.app) diagrams inside notes; it bundles
[`@diagrammo/dgmo`](https://github.com/diagrammo/dgmo) and wires it into
Obsidian's markdown post-processor and live-preview editor.

## Reporting issues

Open bugs and feature requests at
<https://github.com/diagrammo/obsidian-dgmo/issues>. Please include:

- Obsidian version and OS (desktop/mobile).
- The `dgmo` code block that reproduces the problem.
- What you expected vs. what rendered (a screenshot helps).

If the problem is with how a diagram itself renders (not how Obsidian mounts
it), it may belong upstream in [`@diagrammo/dgmo`](https://github.com/diagrammo/dgmo)
— we'll help route it.

## Development setup

Prerequisites: Node.js 18+.

```bash
npm install
npm run dev       # watch mode — rebuilds main.js on save (inline sourcemaps)
npm run build     # one-shot production build (esbuild, CJS bundle)
```

To test in a real vault, symlink or copy the repo into your vault's
`.obsidian/plugins/dgmo/` folder, then enable the plugin in Obsidian settings.
With `npm run dev` running, edit a note containing a ```` ```dgmo ```` block —
changes rebuild automatically (reload the plugin or the vault to pick them up).

## Project structure

```
src/
├── main.ts       # Plugin lifecycle, markdown post-processor, example-note command
├── render.ts     # Rendering dispatcher (delegates each chart type to @diagrammo/dgmo)
├── edit.ts       # In-block live editing (CodeMirror 6 source panel)
├── settings.ts   # Settings tab UI (palette dropdown, theme override)
└── examples.ts   # Example-note content with all chart types
```

`obsidian`, `electron`, and CodeMirror packages are externalized; everything
else (including `@diagrammo/dgmo` and its rendering deps) is bundled into a
single `main.js`.

## Pull requests

- Keep changes focused; one concern per PR.
- Match the surrounding code style — TypeScript, no new lint warnings.
- Run `npm run build` and confirm the plugin loads and renders in a vault
  before opening the PR.
- Prefer fixing DGMO **language/rendering** issues upstream in
  `@diagrammo/dgmo`; this repo should stay a thin Obsidian integration layer.

## Releasing

Maintainers publish releases from GitHub tags. Bump `version` in both
`package.json` and `manifest.json` (they must match), build, then create a
GitHub release whose tag is the bare version (e.g. `1.17.0`) with `main.js`,
`manifest.json`, and `styles.css` attached. Obsidian's community registry picks
up new versions automatically.

## License

By contributing you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
