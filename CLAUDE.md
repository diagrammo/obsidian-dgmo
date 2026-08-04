# obsidian-dgmo — "Diagrammo Diagrams"

Obsidian community plugin (`manifest.json` id `dgmo`, installed from Settings → Community Plugins → Browse, or community.obsidian.md/plugins/dgmo). Renders ` ```dgmo ` fences and `![[foo.dgmo]]` embeds inline, in Reading mode and Live Preview. `isDesktopOnly: false` — it runs on mobile, so nothing on a user-facing path may touch Node.

## Commands

```bash
pnpm build        # gen:assets + esbuild → main.js (CJS bundle, repo root)
pnpm dev          # same, --watch (inline sourcemaps)
pnpm test         # Vitest + jsdom; `obsidian` is types-only, aliased to tests/__mocks__/obsidian.ts
pnpm typecheck lint format:check check:all   # check:all = knip + jscpd; CI runs every one
```

`gen:assets` (postinstall + every build/test/typecheck) regenerates four things — vendor map JSON, `src/example-note.md`, `src/templates.gen.json`, root `styles.css`. To try it in a vault, symlink the repo into `<vault>/.obsidian/plugins/dgmo/` and run `pnpm dev`.

## It bundles dgmo — that's the whole architecture

`@diagrammo/dgmo` is a **runtime dependency bundled into `main.js`**, not externalized: the plugin ships its own copy of the renderer, so **a dgmo bump is a plugin release**, and CI's `pnpm install --frozen-lockfile` means the lockfile — not the `^` range in `package.json` — decides which renderer version ships. Treat version numbers in `README.md` as decoration; the README claimed a dgmo 26 minors old until it was corrected 2026-07-31 (`3890860`).

Externalized in `esbuild.config.mjs`: `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`, `jsdom`, and node builtins. Electron supplies the builtins at runtime, which is the only reason dgmo's Node-only seams resolve at build time. CodeMirror coming from Obsidian is why the in-block editor costs no bundle weight — only the vim engine is bundled.

Keep this repo a thin integration layer: language and rendering bugs get fixed upstream in `dgmo/`.

`src/` is grouped by what a file does, not flat (reorganised 2026-08-03): **`src/render/`** turns DGMO into mounted DOM (`index.ts` is the block renderer, plus `fonts.ts`, `map-data.ts`, `embed.ts` for `![[foo.dgmo]]`), **`src/ui/`** is everything a person clicks (`settings.ts`, `new-diagram.ts`, `edit.ts`, `templates.ts`), and the root holds `main.ts` plus the four **generated** artifacts the scripts write to fixed paths — `styles.css`, `example-note.md`, `templates.gen.json`, and `examples.ts` which wraps the note. Generated paths are hardcoded in `scripts/*.mjs`, so moving one means editing its generator.

## Obsidian-specific constraints

- **`minAppVersion` is `1.5.7`, and that floor is load-bearing** — `Vault#getFileByPath` landed in Obsidian 1.5.7 (API changelog, checked 2026-08-03) and the plugin calls it in the in-block save path and the example-note command. It read `1.5.0` until 2026-08-03, which would have thrown a `TypeError` on 1.5.0–1.5.6. Anything newer than the floor gets the floor raised, never a version guard
- 🔴 **`main.js` must stay under 5 MB.** Above it, Obsidian Sync's Standard plan refuses the file and a paying user cannot get the plugin to a second device — the store flags it. esbuild minifies **whitespace and syntax only, never identifiers** (5.30 MB → 4.00 MB, set 2026-08-03); names stay intact so the shipped file is nowhere near the developer policy's "no obfuscated code" line. A dgmo bump can push this back over — check the size the build prints
- **No `innerHTML`/`outerHTML`** (plugin review guidelines) — go through `appendBlockHtml` in `src/render/index.ts` (DOMParser + `importNode`)
- **`createEl` / `createDiv`, never `document.createElement`** (also review guidelines). These live on `Node.prototype` at Obsidian runtime and do **not** exist in jsdom, so `tests/__mocks__/obsidian-dom.ts` installs them as a Vitest setup file. Note which prototype owns what: `empty`, `appendText`, `detach` and `insertAfter` are on **Node** — a `DocumentFragment` built for a setting description needs them and is not an Element
- **`activeDocument` / `el.ownerDocument`, never global `document`** — popout windows. The exception is a container that is never attached and never measured (the off-DOM map render target): a detached node has no window to belong to
- **Settings are declared, not drawn.** `controlSpecs()` in `src/ui/settings.ts` is the single table of persisted settings; `getSettingDefinitions()` hands it to Obsidian 1.13+, which is the **only** way these settings reach the app's settings search. Returning a non-empty array means `display()` is never called on 1.13+, so `display()` is the pre-1.13 fallback and the two must stay in step — add a setting to the table, never to one path. `tests/settings.test.ts` is what catches the drift
- **eslint keeps the `no-unsafe-*` family and the assertion rules ON here**, against the dgmo + app convention of disabling them — the store scorecard reports every one. The source satisfies them; switching one off needs a reason written beside it
- **`:has()` is flagged by Obsidian's scorecard.** `scripts/build-styles.mjs` rewrites dgmo's two frame selectors to `.dgmo-has-source` / `.dgmo-source-open` and `[data-theme="dark"]` → `body.theme-dark`; `frameSourcePanel()` mirrors the panel state onto those classes in JS. Edit `src/styles.css` — root `styles.css` is generated
- **Maps bypass `render()`.** dgmo's public `render()` loads geo data through Node `fs` and yields an empty SVG here, so `looksLikeMap` branches to the DI pipeline (`parseMap` → `resolveMap` → `renderMapForExport`) with `vendor/map-data` JSON inlined at build time, as the desktop app does
- `src/example-note.md` and `src/templates.gen.json` are generated from the **sibling `dgmo-content` repo but committed** — the generators no-op when the sibling is absent (CI has no workspace). `main.js` and `styles.css` are likewise tracked build artifacts despite `.gitignore`, so a build dirties the tree

## In-block editing — don't break these (`src/ui/edit.ts`)

Opening the `</>` source panel swaps the static `<pre>` for a live CodeMirror 6 view running dgmo's `dgmoExtension`.

- `dgmoExtension` assigns highlight **tags only**; the local `HighlightStyle` maps them to the same `.dgmo-tok-*` classes the static panel uses. Remove it and the editor renders as flat uncolored text
- **No commit ceremony** — the draft saves on blur, on closing the panel, and on unmount. `renderDgmo` returns a flush that the host's `onunload` must call, or Live Preview's scroll-away recycling eats the edit
- `replaceFencedSource` refuses the write when the note body no longer matches what the block rendered from — that guard is what stops a clobber; don't relax it
- Esc reverts, except under Vim, where Esc belongs to the lazy-loaded `@replit/codemirror-vim` compartment. `keydown`/`mousedown` are `stopPropagation`'d so Live Preview's outer editor doesn't also act

## Releasing

`scripts/release.sh obsidian-dgmo 1.24.0` from the workspace root. 🔴 **The tag has no `v` prefix** (`1.24.0`) and must equal both `package.json` and `manifest.json` — `.github/workflows/release.yml` fails the job otherwise, because the community store and BRAT read the manifest from the release at tag `<version>`. The release must carry **`manifest.json` + `main.js` + `styles.css`** (`fail_on_unmatched_files: true`). The store picks new versions up automatically.
