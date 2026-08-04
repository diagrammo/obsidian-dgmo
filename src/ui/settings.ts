import {
  App,
  PluginSettingTab,
  Setting,
  setIcon,
  type SettingControl,
  type SettingDefinitionItem,
} from 'obsidian';
import { palettes } from '@diagrammo/dgmo';
import { renderDgmo } from '../render';
import type DgmoPlugin from '../main';

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

type ControlKey = keyof DgmoSettings;

/** One persisted setting, described once. */
interface ControlSpec {
  key: ControlKey;
  heading: 'Appearance' | 'Layout';
  name: string;
  desc: string;
  control: SettingControl<ControlKey>;
}

/**
 * The five settings, in one table.
 *
 * Both rendering paths read this: `getSettingDefinitions()` hands the `control`
 * objects straight to Obsidian 1.13+, which renders them and — the point of the
 * exercise — indexes them for the settings search. `display()` builds the same
 * rows by hand for older versions. Declaring them twice is how the two paths
 * would drift, so they are declared here instead.
 *
 * A function, not a constant: the palette list comes from dgmo at call time.
 */
function controlSpecs(): ControlSpec[] {
  const paletteOptions: Record<string, string> = {};
  for (const p of Object.values(palettes).sort((a, b) =>
    a.name.localeCompare(b.name)
  ))
    paletteOptions[p.id] = p.name;

  return [
    {
      key: 'palette',
      heading: 'Appearance',
      name: 'Palette',
      desc: 'Colour palette used for all dgmo diagrams.',
      control: {
        type: 'dropdown',
        key: 'palette',
        options: paletteOptions,
        defaultValue: DEFAULT_SETTINGS.palette,
      },
    },
    {
      key: 'theme',
      heading: 'Appearance',
      name: 'Theme',
      desc: 'Auto follows Obsidian’s light/dark mode. Override to force one.',
      control: {
        type: 'dropdown',
        key: 'theme',
        options: {
          auto: 'Auto (follow Obsidian)',
          light: 'Light',
          dark: 'Dark',
        },
        defaultValue: DEFAULT_SETTINGS.theme,
      },
    },
    {
      key: 'transparentBackground',
      heading: 'Appearance',
      name: 'Transparent background',
      desc: 'Let diagrams blend into the note background instead of painting their own. Turn off to give every diagram a solid backdrop.',
      control: {
        type: 'toggle',
        key: 'transparentBackground',
        defaultValue: DEFAULT_SETTINGS.transparentBackground,
      },
    },
    {
      key: 'align',
      heading: 'Layout',
      name: 'Alignment',
      desc: 'Where diagrams sit within the note’s width.',
      control: {
        type: 'dropdown',
        key: 'align',
        options: { left: 'Left', center: 'Center' },
        defaultValue: DEFAULT_SETTINGS.align,
      },
    },
    {
      key: 'maxWidth',
      heading: 'Layout',
      name: 'Maximum width',
      desc: 'Cap how wide a diagram can grow. Pair with Center to keep large charts from filling the whole note.',
      control: {
        type: 'dropdown',
        key: 'maxWidth',
        options: {
          full: 'Full width',
          '720': 'Comfortable (720px)',
          '560': 'Compact (560px)',
        },
        defaultValue: DEFAULT_SETTINGS.maxWidth,
      },
    },
  ];
}

const DOCS_URL = 'https://diagrammo.app/docs';
const REFERENCE_URL = 'https://diagrammo.app/reference';
const SETUP_URL = 'https://diagrammo.app/embed#obsidian';
const EDITOR_URL = 'https://online.diagrammo.app';
const APP_URL = 'https://diagrammo.app/app';
const AI_URL = 'https://diagrammo.app/ai';

/** Diagrammo "Quorum" mark on ink badge (self-contained: reads on light + dark). */
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">' +
  '<rect width="100" height="100" rx="18" fill="#1f2933"/>' +
  '<g transform="translate(9 9) scale(0.82)">' +
  '<rect x="11" y="8" width="22" height="39.5" rx="2.5" fill="#c0504d"/>' +
  '<rect x="11" y="52.5" width="22" height="22.1" rx="2.5" fill="#5b9357"/>' +
  '<rect x="11" y="79.6" width="22" height="12.4" rx="2.5" fill="#4f96c4"/>' +
  '<path fill="#3a9188" d="M45 11.12 A3 3 0 0 1 48.23 8.12 A42 42 0 0 1 86.52 43.65 A3 3 0 0 1 83.78 47.10 L72.76 47.92 A3 3 0 0 1 69.59 45.47 A25 25 0 0 0 47.68 25.14 A3 3 0 0 1 45 22.16 Z"/>' +
  '<path fill="#7d5ba6" d="M83.78 52.90 A3 3 0 0 1 86.52 56.35 A42 42 0 0 1 74.53 79.87 A3 3 0 0 1 70.13 79.67 L62.99 71.24 A3 3 0 0 1 63.12 67.23 A25 25 0 0 0 69.59 54.53 A3 3 0 0 1 72.76 52.08 Z"/>' +
  '<path fill="#cc7a33" d="M65.43 83.08 A3 3 0 0 1 64.27 87.32 A42 42 0 0 1 48.23 91.88 A3 3 0 0 1 45 88.88 L45 77.84 A3 3 0 0 1 47.68 74.86 A25 25 0 0 0 55.78 72.56 A3 3 0 0 1 59.63 73.69 Z"/>' +
  '</g>' +
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

/** "Learn more" rows — name, destination, why you'd go there. Read by both
 * rendering paths, same as `COMMANDS` and `controlSpecs()`. */
const RESOURCE_LINKS: Array<[string, string, string]> = [
  [
    'Documentation',
    DOCS_URL,
    'Guides and per-chart-type docs for every diagram.',
  ],
  [
    'Obsidian setup guide',
    SETUP_URL,
    'Install, embed, and syntax basics for this plugin.',
  ],
  [
    'Online editor',
    EDITOR_URL,
    'Author diagrams in any browser, nothing to install.',
  ],
  ['Desktop app', APP_URL, 'Native editor with export and offline use.'],
  ['AI & MCP', AI_URL, 'Let AI assistants draft diagrams for you.'],
  [
    'Syntax reference',
    REFERENCE_URL,
    'The complete DGMO grammar — handy for power users and AI.',
  ],
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

  /**
   * The tab, declared rather than drawn (Obsidian 1.13+).
   *
   * This is what puts these settings into the app's settings search: a tab that
   * only implements `display()` is invisible to it, however good the tab looks.
   * Returning a non-empty array here means `display()` is never called on 1.13+,
   * so that method survives only as the fallback for older versions — the two
   * must stay in step, which is why the controls come from `controlSpecs()` and
   * the prose blocks from the same private renderers both paths use.
   */
  override getSettingDefinitions(): SettingDefinitionItem[] {
    const specs = controlSpecs();
    const controls = (heading: ControlSpec['heading']) =>
      specs
        .filter((s) => s.heading === heading)
        .map((s) => ({ name: s.name, desc: s.desc, control: s.control }));

    return [
      {
        name: 'About Diagrammo',
        searchable: false,
        render: (setting) =>
          this.asBlock(setting, (el) => this.renderAbout(el)),
      },
      {
        type: 'group',
        heading: 'Get started',
        items: [
          {
            name: 'Create the example note',
            desc: this.exampleNoteDesc(),
            aliases: ['examples', 'chart types', 'sample'],
            action: () => void this.plugin.createExampleNote(),
          },
        ],
      },
      {
        type: 'group',
        heading: 'Commands',
        items: [
          {
            name: 'How to run these',
            searchable: false,
            render: (setting) =>
              this.asBlock(setting, (el) => this.renderCommandsIntro(el)),
          },
          // Each command is a searchable row, so someone typing "gallery" into
          // settings search finds the command rather than nothing.
          ...COMMANDS.map((cmd) => ({ name: cmd.name, desc: cmd.desc })),
        ],
      },
      { type: 'group', heading: 'Appearance', items: controls('Appearance') },
      { type: 'group', heading: 'Layout', items: controls('Layout') },
      {
        type: 'group',
        heading: 'Using diagrams',
        items: [
          {
            name: 'The hover toolbar',
            aliases: ['source', 'copy', 'expand', 'full screen', 'toolbar'],
            render: (setting) =>
              this.asBlock(setting, (el) => this.renderToolbarHelpBody(el)),
          },
        ],
      },
      {
        type: 'group',
        heading: 'Learn more',
        items: RESOURCE_LINKS.map(([name, href, desc]) => ({
          name,
          desc,
          action: () => window.open(href, '_blank', 'noopener,noreferrer'),
        })),
      },
    ];
  }

  /** Persist one declarative control. `unknown` in, so each value is checked
   * against its own union before it reaches the settings object. */
  override async setControlValue(key: string, value: unknown): Promise<void> {
    const s = this.plugin.settings;
    switch (key) {
      case 'palette':
        if (typeof value !== 'string') return;
        s.palette = value;
        break;
      case 'theme':
        if (value !== 'auto' && value !== 'light' && value !== 'dark') return;
        s.theme = value;
        break;
      case 'transparentBackground':
        if (typeof value !== 'boolean') return;
        s.transparentBackground = value;
        break;
      case 'align':
        if (value !== 'left' && value !== 'center') return;
        s.align = value;
        break;
      case 'maxWidth':
        if (value !== 'full' && value !== '720' && value !== '560') return;
        s.maxWidth = value;
        break;
      default:
        return;
    }
    await this.applyChange(key);
  }

  /** Save, then make the change visible without a note reload. Layout rides on
   * body-level CSS vars; everything else needs the diagrams redrawn. */
  private async applyChange(key: ControlKey): Promise<void> {
    await this.plugin.saveSettings();
    if (key === 'align' || key === 'maxWidth') this.plugin.applyLayoutVars();
    else this.plugin.refreshAll();
  }

  /** Let a `render` row hold a full-width block instead of a name/control pair. */
  private asBlock(setting: Setting, draw: (el: HTMLElement) => void): void {
    setting.settingEl.empty();
    setting.settingEl.addClass('dgmo-settings-block');
    draw(setting.settingEl);
  }

  /** Pre-1.13 fallback. Never called on 1.13+ — see getSettingDefinitions. */
  override display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.renderAbout(containerEl);
    this.renderGetStarted(containerEl);
    this.renderCommands(containerEl);
    this.renderControls(containerEl, 'Appearance');
    this.renderControls(containerEl, 'Layout');
    this.renderToolbarHelp(containerEl);
    this.renderResources(containerEl);
  }

  /** The `controlSpecs()` table, drawn imperatively for pre-1.13 Obsidian. */
  private renderControls(
    containerEl: HTMLElement,
    heading: ControlSpec['heading']
  ): void {
    new Setting(containerEl).setName(heading).setHeading();

    for (const spec of controlSpecs()) {
      if (spec.heading !== heading) continue;
      const row = new Setting(containerEl)
        .setName(spec.name)
        .setDesc(spec.desc);
      const { control } = spec;
      if (control.type === 'toggle') {
        row.addToggle((toggle) => {
          toggle.setValue(this.plugin.settings[spec.key] === true);
          toggle.onChange(
            (value) => void this.setControlValue(spec.key, value)
          );
        });
      } else if (control.type === 'dropdown') {
        row.addDropdown((dropdown) => {
          for (const [value, label] of Object.entries(control.options))
            dropdown.addOption(value, label);
          dropdown.setValue(String(this.plugin.settings[spec.key]));
          dropdown.onChange(
            (value) => void this.setControlValue(spec.key, value)
          );
        });
      }
    }
  }

  // --- Command palette reference ---------------------------------------------
  private renderCommands(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Commands').setHeading();
    this.renderCommandsIntro(containerEl);

    for (const cmd of COMMANDS) {
      new Setting(containerEl).setName(cmd.name).setDesc(cmd.desc);
    }
  }

  private renderCommandsIntro(containerEl: HTMLElement): void {
    const p = containerEl.createEl('p', { cls: 'setting-item-description' });
    p.appendText('Open the command palette (');
    p.createEl('kbd', { text: 'Ctrl/Cmd-P' });
    p.appendText(
      ') and search “Diagrammo” to run these. Assign hotkeys under Settings → Hotkeys.'
    );
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
  private exampleNoteDesc(): DocumentFragment {
    const desc = new DocumentFragment();
    desc.appendText(
      'Adds a “Diagrammo Examples” note to your vault with every chart type rendered from working sample data — the fastest way to see what’s possible and copy a starting point. '
    );
    desc.createEl('span', {
      text: 'You can also run “Diagrammo Diagrams: Create example note with all chart types” from the command palette.',
    });
    return desc;
  }

  private renderGetStarted(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Get started').setHeading();

    const desc = this.exampleNoteDesc();

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

  // --- Hover toolbar help ----------------------------------------------------
  private renderToolbarHelp(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Using diagrams').setHeading();
    this.renderToolbarHelpBody(containerEl);
  }

  private renderToolbarHelpBody(containerEl: HTMLElement): void {
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

    for (const [name, href, desc] of RESOURCE_LINKS) {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addButton((btn) =>
          btn
            .setButtonText('Open')
            .onClick(() => window.open(href, '_blank', 'noopener,noreferrer'))
        );
    }
  }
}
