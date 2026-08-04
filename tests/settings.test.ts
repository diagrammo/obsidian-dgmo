// The declarative settings tab (Obsidian 1.13+).
//
// `getSettingDefinitions()` is what puts these settings into the app's settings
// search, and it is data — which makes it checkable here rather than only by
// clicking through a 1.13 vault. What matters and is easy to get wrong: every
// persisted setting is offered exactly once, each control's `key` really is a
// key of DgmoSettings (a typo silently produces a control that saves nothing),
// each dropdown offers the value the setting currently holds, and
// `setControlValue` refuses a value that isn't in the union.

import { describe, expect, it, vi } from 'vitest';
import type {
  SettingDefinitionControl,
  SettingDefinitionGroup,
  SettingDefinitionItem,
} from 'obsidian';
import {
  DEFAULT_SETTINGS,
  DgmoSettingTab,
  type DgmoSettings,
} from '../src/ui/settings';
import type DgmoPlugin from '../src/main';

function makeTab(overrides: Partial<DgmoSettings> = {}) {
  const settings: DgmoSettings = { ...DEFAULT_SETTINGS, ...overrides };
  const plugin = {
    settings,
    saveSettings: vi.fn(() => Promise.resolve()),
    refreshAll: vi.fn(),
    applyLayoutVars: vi.fn(),
    createExampleNote: vi.fn(() => Promise.resolve()),
    isDark: () => false,
    getPalette: () => settings.palette,
  };
  const tab = new DgmoSettingTab({} as never, plugin as unknown as DgmoPlugin);
  return { tab, plugin, settings };
}

function isGroup(i: SettingDefinitionItem): i is SettingDefinitionGroup {
  return 'type' in i && (i.type === 'group' || i.type === 'list');
}

/** Every definition, groups flattened into their items. */
function flatten(items: SettingDefinitionItem[]): SettingDefinitionItem[] {
  return items.flatMap((i) => (isGroup(i) ? (i.items ?? []) : [i]));
}

function controls(items: SettingDefinitionItem[]) {
  return flatten(items).filter(
    (i): i is SettingDefinitionControl =>
      'control' in i && i.control != null
  );
}

describe('DgmoSettingTab.getSettingDefinitions', () => {
  it('offers every persisted setting exactly once, keyed to a real field', () => {
    const { tab } = makeTab();
    const keys = controls(tab.getSettingDefinitions()).map((c) => c.control.key);

    expect([...keys].sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every row a name, and every group a heading with items', () => {
    const { tab } = makeTab();
    const items = tab.getSettingDefinitions();

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      if (isGroup(item)) {
        expect(item.heading, 'group heading').toBeTruthy();
        expect(item.items?.length, `items under ${item.heading}`).toBeGreaterThan(
          0
        );
      } else {
        expect(item.name).toBeTruthy();
      }
    }
    for (const def of flatten(items)) {
      if (!isGroup(def)) expect(def.name).toBeTruthy();
    }
  });

  it('matches each control type to the type the setting actually stores', () => {
    const { tab, settings } = makeTab();
    for (const def of controls(tab.getSettingDefinitions())) {
      const stored = settings[def.control.key as keyof DgmoSettings];
      const expected = typeof stored === 'boolean' ? 'toggle' : 'dropdown';
      expect(def.control.type, `${def.control.key}`).toBe(expected);
    }
  });

  it('every dropdown offers the value the setting currently holds', () => {
    // A dropdown whose options omit the stored value renders blank and the user
    // silently loses their setting on the next change.
    const { tab, settings } = makeTab({ maxWidth: '560', theme: 'dark' });
    for (const def of controls(tab.getSettingDefinitions())) {
      if (def.control.type !== 'dropdown') continue;
      const stored = String(settings[def.control.key as keyof DgmoSettings]);
      expect(Object.keys(def.control.options), `${def.control.key}`).toContain(
        stored
      );
    }
  });

  it('offers every palette dgmo ships', async () => {
    const { palettes } = await import('@diagrammo/dgmo');
    const { tab } = makeTab();
    const palette = controls(tab.getSettingDefinitions()).find(
      (c) => c.control.key === 'palette'
    );
    if (palette?.control.type !== 'dropdown') throw new Error('no palette row');
    expect(Object.keys(palette.control.options).sort()).toEqual(
      Object.values(palettes)
        .map((p) => p.id)
        .sort()
    );
  });

  it('indexes the commands for settings search', () => {
    const { tab } = makeTab();
    const names = flatten(tab.getSettingDefinitions())
      .filter((i) => !isGroup(i))
      .map((i) => ('name' in i ? i.name : ''));
    expect(names).toContain('New diagram: browse the gallery');
  });
});

describe('DgmoSettingTab.setControlValue', () => {
  it('persists a valid value and redraws the diagrams', async () => {
    const { tab, plugin, settings } = makeTab();
    await tab.setControlValue('palette', 'nord');

    expect(settings.palette).toBe('nord');
    expect(plugin.saveSettings).toHaveBeenCalledOnce();
    expect(plugin.refreshAll).toHaveBeenCalledOnce();
    expect(plugin.applyLayoutVars).not.toHaveBeenCalled();
  });

  it('applies layout settings through the CSS vars, not a re-render', async () => {
    const { tab, plugin, settings } = makeTab();
    await tab.setControlValue('align', 'center');

    expect(settings.align).toBe('center');
    expect(plugin.applyLayoutVars).toHaveBeenCalledOnce();
    expect(plugin.refreshAll).not.toHaveBeenCalled();
  });

  it('ignores a value outside the setting’s union, and saves nothing', async () => {
    const { tab, plugin, settings } = makeTab();
    await tab.setControlValue('theme', 'sepia');
    await tab.setControlValue('align', 'justified');
    await tab.setControlValue('transparentBackground', 'yes');
    await tab.setControlValue('nonesuch', true);

    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(settings.align).toBe(DEFAULT_SETTINGS.align);
    expect(settings.transparentBackground).toBe(
      DEFAULT_SETTINGS.transparentBackground
    );
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });

  it('takes a boolean for the toggle', async () => {
    const { tab, settings } = makeTab();
    await tab.setControlValue('transparentBackground', false);
    expect(settings.transparentBackground).toBe(false);
  });
});
