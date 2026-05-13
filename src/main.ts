import { Notice, Plugin } from 'obsidian';
import { renderDgmo } from './render';
import { ensureInterFonts } from './fonts';
import { EXAMPLE_NOTE } from './examples';
import {
  type DgmoSettings,
  DEFAULT_SETTINGS,
  DgmoSettingTab,
} from './settings';

export default class DgmoPlugin extends Plugin {
  settings: DgmoSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new DgmoSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('dgmo', async (source, el) => {
      await ensureInterFonts();
      const isDark = this.resolveIsDark();
      await renderDgmo(source, el, isDark, this.settings.palette);
    });

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
    if (file && 'extension' in file) {
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
}
