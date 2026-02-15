import { App, PluginSettingTab, Setting } from 'obsidian';
import { getAvailablePalettes } from '@diagrammo/dgmo';
import type DgmoPlugin from './main';

export interface DgmoSettings {
  palette: string;
  theme: 'auto' | 'light' | 'dark';
  chartHeight: number;
}

export const DEFAULT_SETTINGS: DgmoSettings = {
  palette: 'nord',
  theme: 'auto',
  chartHeight: 400,
};

export class DgmoSettingTab extends PluginSettingTab {
  plugin: DgmoPlugin;

  constructor(app: App, plugin: DgmoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // About section
    const aboutEl = containerEl.createDiv({ cls: 'dgmo-settings-about' });

    const introEl = aboutEl.createEl('p', { cls: 'setting-item-description' });
    introEl.appendText(
      'Diagrammo turns plain-text markup into beautiful charts and diagrams — bar, line, pie, sequence, arc, timeline, and more. Just write a ',
    );
    introEl.createEl('code', { text: '```dgmo' });
    introEl.appendText(' code fence and it renders inline in your notes.');

    const linksEl = aboutEl.createEl('p', { cls: 'setting-item-description' });
    linksEl.createEl('a', {
      text: 'diagrammo.app',
      href: 'https://diagrammo.app',
    });
    linksEl.appendText(
      ' — A dedicated desktop editor with live preview, export to PNG/SVG, and all the palettes and chart types in one place. Great for when you want to go beyond what a code fence can do.',
    );

    const cliEl = aboutEl.createEl('p', { cls: 'setting-item-description' });
    cliEl.appendText('You can also use dgmo from the terminal: ');
    cliEl.createEl('a', {
      text: 'brew tap diagrammo/dgmo',
      href: 'https://github.com/diagrammo/homebrew-dgmo',
    });
    cliEl.appendText(' or ');
    cliEl.createEl('a', {
      text: 'npm install @diagrammo/dgmo',
      href: 'https://www.npmjs.com/package/@diagrammo/dgmo',
    });
    cliEl.appendText('.');

    // Palette dropdown
    const palettes = getAvailablePalettes();
    new Setting(containerEl)
      .setName('Palette')
      .setDesc('Color palette used for all dgmo diagrams.')
      .addDropdown((dropdown) => {
        for (const p of palettes) {
          dropdown.addOption(p.id, p.name);
        }
        dropdown.setValue(this.plugin.settings.palette);
        dropdown.onChange(async (value) => {
          this.plugin.settings.palette = value;
          await this.plugin.saveSettings();
        });
      });

    // Theme override
    new Setting(containerEl)
      .setName('Theme')
      .setDesc('Auto follows Obsidian\'s light/dark mode. Override to force one.')
      .addDropdown((dropdown) => {
        dropdown.addOption('auto', 'Auto (follow Obsidian)');
        dropdown.addOption('light', 'Light');
        dropdown.addOption('dark', 'Dark');
        dropdown.setValue(this.plugin.settings.theme);
        dropdown.onChange(async (value) => {
          this.plugin.settings.theme = value as DgmoSettings['theme'];
          await this.plugin.saveSettings();
        });
      });

    // Chart height
    new Setting(containerEl)
      .setName('Chart height')
      .setDesc('Height in pixels for ECharts-based diagrams (bar, line, pie, etc.).')
      .addText((text) => {
        text.setPlaceholder('400');
        text.setValue(String(this.plugin.settings.chartHeight));
        text.onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num >= 100 && num <= 2000) {
            this.plugin.settings.chartHeight = num;
            await this.plugin.saveSettings();
          }
        });
      });
  }
}
