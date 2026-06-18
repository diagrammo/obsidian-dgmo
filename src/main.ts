import { Notice, Plugin, TFile } from 'obsidian';
import { renderDgmo } from './render';
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

  override async onload() {
    await this.loadSettings();
    this.addSettingTab(new DgmoSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('dgmo', async (source, el) => {
      await ensureInterFonts();
      const isDark = this.resolveIsDark();
      await renderDgmo(source, el, isDark, this.settings.palette);
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
}
