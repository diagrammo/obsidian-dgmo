import { Notice, Plugin } from 'obsidian';
import { renderDgmo, disposeAllCharts } from './render';
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

    this.registerMarkdownCodeBlockProcessor('dgmo', (source, el) => {
      const isDark = this.resolveIsDark();
      renderDgmo(source, el, isDark, this.settings.palette, this.settings.chartHeight);
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
    if (existing) {
      new Notice(`"${path}" already exists — open it or delete it first.`);
      return;
    }
    const file = await this.app.vault.create(path, EXAMPLE_NOTE);
    await this.app.workspace.getLeaf().openFile(file);
    new Notice('Created Diagrammo examples note.');
  }

  onunload() {
    disposeAllCharts();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private resolveIsDark(): boolean {
    if (this.settings.theme === 'light') return false;
    if (this.settings.theme === 'dark') return true;
    return document.body.classList.contains('theme-dark');
  }
}
