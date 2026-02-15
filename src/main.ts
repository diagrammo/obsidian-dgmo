import { Plugin } from 'obsidian';
import { renderDgmo, disposeAllCharts } from './render';
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
