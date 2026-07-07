import {
  MarkdownRenderChild,
  Notice,
  Plugin,
  TFile,
  type MarkdownPostProcessorContext,
} from 'obsidian';
import { renderDgmo } from './render';
import { containsFence, replaceFencedSource } from './edit';
import { ensureInterFonts } from './fonts';
import {
  type DgmoEmbed,
  type DgmoEmbedHost,
  createDgmoEmbedPostProcessor,
} from './embed';
import { EXAMPLE_NOTE } from './examples';
import {
  type DgmoSettings,
  DEFAULT_SETTINGS,
  DgmoSettingTab,
} from './settings';

export default class DgmoPlugin extends Plugin implements DgmoEmbedHost {
  settings: DgmoSettings = DEFAULT_SETTINGS;

  /** Live `![[*.dgmo]]` embeds, so vault `modify` can re-render dependents. */
  private readonly embeds = new Set<DgmoEmbed>();

  /** Live ```dgmo code blocks, so a settings change can re-render them. */
  private readonly codeBlocks = new Set<DgmoCodeBlock>();

  override async onload() {
    await this.loadSettings();
    this.addSettingTab(new DgmoSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('dgmo', (source, el, ctx) => {
      ctx.addChild(new DgmoCodeBlock(el, source, this, ctx));
    });

    // Obsidian-style `![[foo.dgmo]]` transclusion (BL-101). Claims Obsidian's
    // `.internal-embed` spans for `.dgmo` targets in Reading mode + Live
    // Preview; non-`.dgmo` embeds keep native handling.
    this.registerMarkdownPostProcessor(createDgmoEmbedPostProcessor(this));

    // Re-render open embeds when the EMBEDDED `.dgmo` file changes (Obsidian
    // already re-runs post-processors when the HOST note changes).
    this.registerEvent(
      this.app.vault.on('modify', (f) => {
        if (!(f instanceof TFile) || f.extension !== 'dgmo') return;
        for (const embed of this.embeds) {
          if (embed.filePath === f.path) void embed.render();
        }
      })
    );

    // When the user toggles Obsidian's light/dark mode, re-render diagrams that
    // follow it (theme === 'auto') so they recolor without a note reload.
    this.registerEvent(
      this.app.workspace.on('css-change', () => {
        if (this.settings.theme === 'auto') this.refreshAll();
      })
    );

    this.addCommand({
      id: 'insert-example-note',
      name: 'Create example note with all chart types',
      callback: () => this.createExampleNote(),
    });
  }

  private async createExampleNote(): Promise<void> {
    const path = 'Diagrammo Examples.md';
    const existing = this.app.vault.getAbstractFileByPath(path);
    let file;
    if (existing) {
      file = await this.app.vault.create(path, EXAMPLE_NOTE).catch(async () => {
        await this.app.vault.adapter.write(path, EXAMPLE_NOTE);
        return this.app.vault.getAbstractFileByPath(path);
      });
      new Notice(`"${path}" overwritten with latest examples.`);
    } else {
      file = await this.app.vault.create(path, EXAMPLE_NOTE);
      new Notice('Diagrammo examples note created.');
    }
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }

  async loadSettings() {
    const loaded = (await this.loadData()) as Partial<DgmoSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(loaded ?? {}) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private resolveIsDark(): boolean {
    if (this.settings.theme === 'light') return false;
    if (this.settings.theme === 'dark') return true;
    return activeDocument.body.classList.contains('theme-dark');
  }

  // --- DgmoEmbedHost ---------------------------------------------------------
  getPalette(): string {
    return this.settings.palette;
  }

  isDark(): boolean {
    return this.resolveIsDark();
  }

  registerEmbed(embed: DgmoEmbed): void {
    this.embeds.add(embed);
  }

  unregisterEmbed(embed: DgmoEmbed): void {
    this.embeds.delete(embed);
  }

  registerCodeBlock(block: DgmoCodeBlock): void {
    this.codeBlocks.add(block);
  }

  unregisterCodeBlock(block: DgmoCodeBlock): void {
    this.codeBlocks.delete(block);
  }

  /** Re-render every live diagram (code blocks + embeds) in place — called when
   * the palette or theme setting changes so visible diagrams update without a
   * note reload. */
  refreshAll(): void {
    for (const block of this.codeBlocks) void block.render();
    for (const embed of this.embeds) void embed.render();
  }

  /**
   * Write an edited code-block body back into its note (in-block editing).
   * The section is re-located at save time and its current body verified
   * against what this block rendered from — if the note moved underneath the
   * editor, refuse rather than clobber. Throws (after a Notice) so the editor
   * keeps the draft.
   */
  async saveCodeBlockEdit(
    ctx: MarkdownPostProcessorContext,
    el: HTMLElement,
    oldSource: string,
    newSource: string
  ): Promise<void> {
    if (containsFence(newSource)) {
      new Notice('DGMO source cannot contain code fences (``` or ~~~).');
      throw new Error('fence in edited source');
    }
    const info = ctx.getSectionInfo(el);
    const file = this.app.vault.getFileByPath(ctx.sourcePath);
    if (!info || !file) {
      new Notice(
        'Cannot locate this block in its note — copy your edits and paste them manually.'
      );
      throw new Error('no section info for edited block');
    }
    let stale = false;
    await this.app.vault.process(file, (data) => {
      const next = replaceFencedSource(
        data,
        info.lineStart,
        info.lineEnd,
        oldSource,
        newSource
      );
      if (next == null) {
        stale = true;
        return data;
      }
      return next;
    });
    if (stale) {
      new Notice(
        'Note changed since this diagram rendered — copy your edits and retry.'
      );
      throw new Error('stale section on edited block');
    }
  }
}

/**
 * A single ```dgmo code block. `MarkdownRenderChild` gives the correct
 * mount/unmount lifecycle in Reading mode and Live Preview (blocks re-mount on
 * scroll/edit); tracking the live instances lets a settings change re-render
 * them in place.
 */
class DgmoCodeBlock extends MarkdownRenderChild {
  /** Saves an in-progress source edit; set per render, called on unmount so
   * a draft survives Live Preview's scroll-away block recycling. */
  private flushEdit: (() => Promise<void>) | null = null;

  constructor(
    node: HTMLElement,
    private readonly source: string,
    private readonly plugin: DgmoPlugin,
    private readonly ctx: MarkdownPostProcessorContext
  ) {
    super(node);
  }

  override onload(): void {
    this.plugin.registerCodeBlock(this);
    void this.render();
  }

  override onunload(): void {
    this.plugin.unregisterCodeBlock(this);
    void this.flushEdit?.();
  }

  async render(): Promise<void> {
    await ensureInterFonts();
    this.containerEl.empty();
    this.flushEdit = await renderDgmo(
      this.source,
      this.containerEl,
      this.plugin.isDark(),
      this.plugin.getPalette(),
      (next) =>
        this.plugin.saveCodeBlockEdit(
          this.ctx,
          this.containerEl,
          this.source,
          next
        )
    );
  }
}
