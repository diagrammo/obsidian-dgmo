import {
  MarkdownRenderChild,
  type App,
  type MarkdownPostProcessor,
  type TFile,
} from 'obsidian';
import { renderDgmo } from './render';
import { ensureInterFonts } from './fonts';

/**
 * Obsidian-style `![[foo.dgmo]]` embeds.
 *
 * Obsidian emits an `.internal-embed[src]` span for *every* `![[…]]`, including
 * unknown extensions like `.dgmo`. A markdown post-processor can claim those
 * spans and render the diagram ourselves — the same public-API pattern
 * Excalidraw and other custom-file-embed plugins use. We reuse `renderDgmo`
 * verbatim, so this is wiring, not new rendering.
 */

/**
 * Strip an Obsidian embed `src` down to its bare linkpath: drop a `#subpath`
 * fragment and a `|alias`/display suffix, then trim. Examples:
 *   `foo.dgmo`        → `foo.dgmo`
 *   `dir/foo.dgmo`    → `dir/foo.dgmo`
 *   `foo.dgmo#frag`   → `foo.dgmo`
 *   `foo.dgmo|alias`  → `foo.dgmo`
 *   `foo`             → `foo`  (bare name; resolved via Obsidian link rules)
 */
export function linkpathOf(src: string): string {
  let s = src.trim();
  const hash = s.indexOf('#');
  if (hash !== -1) s = s.slice(0, hash);
  const pipe = s.indexOf('|');
  if (pipe !== -1) s = s.slice(0, pipe);
  return s.trim();
}

/** Does this embed `src` name a `.dgmo` target by extension? */
export function isDgmoTarget(src: string): boolean {
  return /\.dgmo$/i.test(linkpathOf(src));
}

/** Injected seam so the resolve→read→render wiring is unit-testable. */
export interface EmbedDeps {
  read(file: TFile): Promise<string>;
  render(
    source: string,
    el: HTMLElement,
    isDark: boolean,
    palette: string
  ): Promise<void>;
  isDark(): boolean;
  palette(): string;
}

/** Render an embed error card with plain DOM (no Obsidian-only helpers). */
function showEmbedError(node: HTMLElement, message: string): void {
  node.replaceChildren();
  node.classList.add('dgmo-embed');
  const doc = node.ownerDocument;
  const wrapper = doc.createElement('div');
  wrapper.className = 'dgmo-error';
  const title = doc.createElement('p');
  title.className = 'dgmo-error-title';
  title.textContent = 'Embed error';
  const msg = doc.createElement('p');
  msg.className = 'dgmo-error-message';
  msg.textContent = message;
  wrapper.append(title, msg);
  node.appendChild(wrapper);
}

/**
 * Read `file` and render its diagram into `node`. Clears Obsidian's default
 * embed placeholder first. Read failures show an inline card, never throw.
 */
export async function renderEmbed(
  node: HTMLElement,
  file: TFile,
  deps: EmbedDeps
): Promise<void> {
  let content: string;
  try {
    content = await deps.read(file);
  } catch (err) {
    showEmbedError(
      node,
      `Could not read ${file.path}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return;
  }
  node.replaceChildren();
  node.classList.add('dgmo-embed');
  await deps.render(content, node, deps.isDark(), deps.palette());
}

/** What `DgmoEmbed` needs from the plugin, kept narrow to decouple from main. */
export interface DgmoEmbedHost {
  app: App;
  getPalette(): string;
  isDark(): boolean;
  registerEmbed(embed: DgmoEmbed): void;
  unregisterEmbed(embed: DgmoEmbed): void;
}

/**
 * A single `![[foo.dgmo]]` embed. `MarkdownRenderChild` gives the correct
 * mount/unmount lifecycle in both Reading mode and Live Preview (embeds
 * re-mount on scroll/edit), so we render once per mount and clean up.
 */
export class DgmoEmbed extends MarkdownRenderChild {
  constructor(
    private readonly node: HTMLElement,
    private readonly file: TFile | null,
    private readonly linkpath: string,
    private readonly host: DgmoEmbedHost
  ) {
    super(node);
  }

  /** Path of the referenced `.dgmo` file (for the vault `modify` listener). */
  get filePath(): string | null {
    return this.file?.path ?? null;
  }

  override onload(): void {
    this.host.registerEmbed(this);
    void this.render();
  }

  override onunload(): void {
    this.host.unregisterEmbed(this);
  }

  async render(): Promise<void> {
    if (!this.file) {
      showEmbedError(this.node, `File not found: ${this.linkpath}`);
      return;
    }
    await ensureInterFonts();
    await renderEmbed(this.node, this.file, {
      read: (f) => this.host.app.vault.cachedRead(f),
      render: renderDgmo,
      isDark: () => this.host.isDark(),
      palette: () => this.host.getPalette(),
    });
  }
}

/**
 * Markdown post-processor that claims `.internal-embed` spans pointing at
 * `.dgmo` files. Non-`.dgmo` embeds (md/img/pdf) are left for Obsidian's native
 * handling. A `.dgmo` linkpath that fails to resolve is still claimed so we can
 * show a clear "not found" card rather than Obsidian's generic placeholder.
 */
export function createDgmoEmbedPostProcessor(
  host: DgmoEmbedHost
): MarkdownPostProcessor {
  return (el, ctx) => {
    el.querySelectorAll<HTMLElement>('.internal-embed').forEach((node) => {
      const src = node.getAttribute('src') ?? '';
      const linkpath = linkpathOf(src);
      if (!linkpath) return;
      const file = host.app.metadataCache.getFirstLinkpathDest(
        linkpath,
        ctx.sourcePath
      );
      const claim =
        (file != null && file.extension === 'dgmo') ||
        (file == null && isDgmoTarget(src));
      if (!claim) return;
      ctx.addChild(new DgmoEmbed(node, file ?? null, linkpath, host));
    });
  };
}
