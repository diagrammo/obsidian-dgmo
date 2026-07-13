import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import { palettes } from '@diagrammo/dgmo';
import { renderDgmo } from './render';
import type DgmoPlugin from './main';

/** Live sample rendered in "Using diagrams" so the toolbar shown is the real
 * block chrome, not a mock. Small + valid; mirrors examples/bar/bar.dgmo. */
const SAMPLE_SOURCE = `bar Treasure Hauls by Port

Port Royal blue   850
Tortuga green     620
Nassau red       1100
Havana yellow     430`;

export interface DgmoSettings {
  palette: string;
  theme: 'auto' | 'light' | 'dark';
  transparentBackground: boolean;
  align: 'left' | 'center';
  maxWidth: 'full' | '720' | '560';
}

export const DEFAULT_SETTINGS: DgmoSettings = {
  palette: 'slate',
  theme: 'auto',
  transparentBackground: true,
  align: 'left',
  maxWidth: 'full',
};

const DOCS_URL = 'https://diagrammo.app/docs';
const REFERENCE_URL = 'https://diagrammo.app/reference';
const SETUP_URL = 'https://diagrammo.app/embed#obsidian';
const EDITOR_URL = 'https://online.diagrammo.app';
const APP_URL = 'https://diagrammo.app/app';
const AI_URL = 'https://diagrammo.app/ai';

/** Diagrammo bulb mark (self-contained: dark badge reads on light + dark). */
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' +
  '<rect width="100" height="100" rx="18" fill="#1f2933"/>' +
  '<path d="M41 71 L41 63.51 A28 28 0 1 1 59 63.51 L59 71" fill="none" stroke="#c9a227" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<rect x="36" y="43" width="7" height="9" rx="1.9" fill="#c0504d"/>' +
  '<rect x="45" y="37" width="7" height="15" rx="1.9" fill="#5b9357"/>' +
  '<rect x="54" y="30" width="7" height="22" rx="1.9" fill="#3b6ea5"/>' +
  '<rect x="36" y="75" width="28" height="4.6" rx="2.3" fill="#7d5ba6"/>' +
  '<rect x="36" y="82" width="28" height="4.6" rx="2.3" fill="#7d5ba6"/>' +
  '<rect x="36" y="89" width="28" height="4.6" rx="2.3" fill="#7d5ba6"/>' +
  '</svg>';

/** One hover-toolbar icon explained in the "Using diagrams" section. */
interface IconDoc {
  icon: string; // lucide id (Obsidian setIcon)
  name: string;
  desc: string;
}

/** Command-palette commands this plugin registers (name matches main.ts). */
const COMMANDS: Array<{ name: string; desc: string }> = [
  {
    name: 'New diagram: pick a chart type',
    desc: 'Fuzzy-search every chart type and insert a starter block at the cursor. The fast everyday path.',
  },
  {
    name: 'New diagram: browse the gallery',
    desc: 'Visual picker with categories and live thumbnails. Click a tile to insert at the cursor; ⌘/Ctrl-click to create a new note instead.',
  },
  {
    name: 'Open diagram under cursor in the online editor',
    desc: 'Opens the diagram block your cursor is in at online.diagrammo.app, with this note’s palette and theme applied.',
  },
  {
    name: 'Create example note with all chart types',
    desc: 'Generates the “Diagrammo Examples” note — same as the button above.',
  },
];

const TOOLBAR_ICONS: IconDoc[] = [
  {
    icon: 'code',
    name: 'View source',
    desc: 'Open the DGMO text below the diagram. Edit it right there — changes save back into your note automatically.',
  },
  {
    icon: 'maximize',
    name: 'Expand',
    desc: 'View the diagram full screen. Press Escape or click the backdrop to close.',
  },
  {
    icon: 'copy',
    name: 'Copy source',
    desc: 'Copy the diagram’s DGMO text to the clipboard.',
  },
  {
    icon: 'book-open',
    name: 'Documentation',
    desc: 'Open the online docs for this diagram’s chart type — syntax, options, and examples.',
  },
  {
    icon: 'external-link',
    name: 'Open in online editor',
    desc: 'Open the diagram at online.diagrammo.app for live preview, autocomplete, and PNG/SVG export — with this note’s palette and theme already applied.',
  },
];

export class DgmoSettingTab extends PluginSettingTab {
  plugin: DgmoPlugin;

  constructor(app: App, plugin: DgmoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.renderAbout(containerEl);
    this.renderGetStarted(containerEl);
    this.renderCommands(containerEl);
    this.renderAppearance(containerEl);
    this.renderLayout(containerEl);
    this.renderToolbarHelp(containerEl);
    this.renderResources(containerEl);
  }

  // --- Command palette reference ---------------------------------------------
  private renderCommands(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Commands').setHeading();

    const p = containerEl.createEl('p', { cls: 'setting-item-description' });
    p.appendText('Open the command palette (');
    p.createEl('kbd', { text: 'Ctrl/Cmd-P' });
    p.appendText(
      ') and search “Diagrammo” to run these. Assign hotkeys under Settings → Hotkeys.'
    );

    for (const cmd of COMMANDS) {
      new Setting(containerEl).setName(cmd.name).setDesc(cmd.desc);
    }
  }

  // --- Intro -----------------------------------------------------------------
  private renderAbout(containerEl: HTMLElement): void {
    const aboutEl = containerEl.createDiv({ cls: 'dgmo-settings-about' });

    const brandEl = aboutEl.createDiv({ cls: 'dgmo-settings-brand' });
    const logoEl = brandEl.createDiv({ cls: 'dgmo-settings-logo' });
    const svg = new DOMParser().parseFromString(
      LOGO_SVG,
      'image/svg+xml'
    ).documentElement;
    if (svg) logoEl.appendChild(logoEl.ownerDocument.importNode(svg, true));
    brandEl.createEl('span', {
      cls: 'dgmo-settings-wordmark',
      text: 'Diagrammo',
    });

    const introEl = aboutEl.createEl('p', { cls: 'setting-item-description' });
    introEl.appendText(
      'Diagrammo turns plain-text markup into charts and diagrams — bar, line, pie, sequence, timeline, maps, and more. Write a '
    );
    introEl.createEl('code', { text: '```dgmo' });
    introEl.appendText(
      ' code fence and it renders inline in reading mode and live preview.'
    );

    const docsEl = aboutEl.createEl('p', { cls: 'setting-item-description' });
    docsEl.createEl('a', {
      text: 'Browse the docs to see all the chart types →',
      href: DOCS_URL,
    });
  }

  // --- Get started (create example note) -------------------------------------
  private renderGetStarted(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Get started').setHeading();

    const desc = new DocumentFragment();
    desc.appendText(
      'Adds a “Diagrammo Examples” note to your vault with every chart type rendered from working sample data — the fastest way to see what’s possible and copy a starting point. '
    );
    desc.createEl('span', {
      text: 'You can also run “Diagrammo Diagrams: Create example note with all chart types” from the command palette.',
    });

    new Setting(containerEl)
      .setName('Create the example note')
      .setDesc(desc)
      .addButton((btn) =>
        btn
          .setButtonText('Create example note')
          .setCta()
          .onClick(() => void this.plugin.createExampleNote())
      );
  }

  // --- Appearance ------------------------------------------------------------
  private renderAppearance(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Appearance').setHeading();

    const paletteList = Object.values(palettes).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    new Setting(containerEl)
      .setName('Palette')
      .setDesc('Colour palette used for all dgmo diagrams.')
      .addDropdown((dropdown) => {
        for (const p of paletteList) dropdown.addOption(p.id, p.name);
        dropdown.setValue(this.plugin.settings.palette);
        dropdown.onChange(async (value) => {
          this.plugin.settings.palette = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAll();
        });
      });

    new Setting(containerEl)
      .setName('Theme')
      .setDesc("Auto follows Obsidian’s light/dark mode. Override to force one.")
      .addDropdown((dropdown) => {
        dropdown.addOption('auto', 'Auto (follow Obsidian)');
        dropdown.addOption('light', 'Light');
        dropdown.addOption('dark', 'Dark');
        dropdown.setValue(this.plugin.settings.theme);
        dropdown.onChange(async (value) => {
          this.plugin.settings.theme = value as DgmoSettings['theme'];
          await this.plugin.saveSettings();
          this.plugin.refreshAll();
        });
      });

    new Setting(containerEl)
      .setName('Transparent background')
      .setDesc(
        'Let diagrams blend into the note background instead of painting their own. Turn off to give every diagram a solid backdrop.'
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.transparentBackground);
        toggle.onChange(async (value) => {
          this.plugin.settings.transparentBackground = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAll();
        });
      });
  }

  // --- Layout ----------------------------------------------------------------
  private renderLayout(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Layout').setHeading();

    new Setting(containerEl)
      .setName('Alignment')
      .setDesc('Where diagrams sit within the note’s width.')
      .addDropdown((dropdown) => {
        dropdown.addOption('left', 'Left');
        dropdown.addOption('center', 'Center');
        dropdown.setValue(this.plugin.settings.align);
        dropdown.onChange(async (value) => {
          this.plugin.settings.align = value as DgmoSettings['align'];
          await this.plugin.saveSettings();
          this.plugin.applyLayoutVars();
        });
      });

    new Setting(containerEl)
      .setName('Maximum width')
      .setDesc(
        'Cap how wide a diagram can grow. Pair with Center to keep large charts from filling the whole note.'
      )
      .addDropdown((dropdown) => {
        dropdown.addOption('full', 'Full width');
        dropdown.addOption('720', 'Comfortable (720px)');
        dropdown.addOption('560', 'Compact (560px)');
        dropdown.setValue(this.plugin.settings.maxWidth);
        dropdown.onChange(async (value) => {
          this.plugin.settings.maxWidth = value as DgmoSettings['maxWidth'];
          await this.plugin.saveSettings();
          this.plugin.applyLayoutVars();
        });
      });
  }

  // --- Hover toolbar help ----------------------------------------------------
  private renderToolbarHelp(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Using diagrams').setHeading();

    const p = containerEl.createEl('p', { cls: 'setting-item-description' });
    p.appendText(
      'Here’s a real diagram — hover it to reveal the slim toolbar that sits beneath every rendered diagram:'
    );

    // Render an actual dgmo block so the chrome shown is exactly what users
    // get in a note. `.dgmo-settings-demo` keeps the toolbar always visible.
    const demoEl = containerEl.createDiv({ cls: 'dgmo-settings-demo' });
    void renderDgmo(
      SAMPLE_SOURCE,
      demoEl,
      this.plugin.isDark(),
      this.plugin.getPalette()
    );

    const list = containerEl.createDiv({ cls: 'dgmo-icon-guide' });
    for (const item of TOOLBAR_ICONS) {
      const row = list.createDiv({ cls: 'dgmo-icon-guide-row' });
      const iconEl = row.createDiv({ cls: 'dgmo-icon-guide-icon' });
      setIcon(iconEl, item.icon);
      const textEl = row.createDiv({ cls: 'dgmo-icon-guide-text' });
      textEl.createEl('span', {
        cls: 'dgmo-icon-guide-name',
        text: item.name,
      });
      textEl.createEl('span', {
        cls: 'setting-item-description',
        text: item.desc,
      });
    }
  }

  // --- Resource links --------------------------------------------------------
  private renderResources(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Learn more').setHeading();

    const links: Array<[string, string, string]> = [
      ['Documentation', DOCS_URL, 'Guides and per-chart-type docs for every diagram.'],
      ['Obsidian setup guide', SETUP_URL, 'Install, embed, and syntax basics for this plugin.'],
      ['Online editor', EDITOR_URL, 'Author diagrams in any browser, nothing to install.'],
      ['Desktop app', APP_URL, 'Native editor with export and offline use.'],
      ['AI & MCP', AI_URL, 'Let AI assistants draft diagrams for you.'],
      ['Syntax reference', REFERENCE_URL, 'The complete DGMO grammar — handy for power users and AI.'],
    ];
    for (const [name, href, desc] of links) {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addButton((btn) =>
          btn.setButtonText('Open').onClick(() => window.open(href, '_blank'))
        );
    }
  }
}
