// Minimal runtime stand-in for the `obsidian` module in unit tests. The real
// `obsidian` package ships types only (no runtime), so vitest aliases imports
// here. Only the runtime values our code constructs/extends need to exist;
// type-only imports are erased by the compiler.

export class MarkdownRenderChild {
  containerEl: HTMLElement;
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
  }
  onload(): void {}
  onunload(): void {}
}

// `TFile` is referenced as a value in a couple of `instanceof` checks elsewhere,
// so provide a constructable stub. Tests build plain `{ path, extension }`
// objects and cast, which is enough for the wiring under test.
export class TFile {
  path = '';
  extension = '';
}

// Runtime stand-ins for the modal/notice classes new-diagram.ts constructs or
// extends. Behaviourless — the unit tests exercise the pure helpers, not the UI.
export class Notice {
  constructor(_message?: string) {}
}

export class Modal {
  app: unknown;
  contentEl: HTMLElement = document.createElement('div');
  modalEl: HTMLElement = document.createElement('div');
  titleEl: HTMLElement = document.createElement('div');
  constructor(app: unknown) {
    this.app = app;
  }
  open(): void {}
  close(): void {}
  onOpen(): void {}
  onClose(): void {}
}

/** A settings row. Enough of the real `Setting` for the imperative pre-1.13
 * path to run and for a `render` definition to be handed something with the
 * documented element handles. */
export class Setting {
  settingEl: HTMLElement;
  infoEl: HTMLElement;
  nameEl: HTMLElement;
  descEl: HTMLElement;
  controlEl: HTMLElement;
  constructor(containerEl?: HTMLElement) {
    const doc = containerEl?.ownerDocument ?? document;
    this.settingEl = doc.createElement('div');
    this.settingEl.className = 'setting-item';
    containerEl?.appendChild(this.settingEl);
    this.infoEl = this.settingEl.appendChild(doc.createElement('div'));
    this.nameEl = this.infoEl.appendChild(doc.createElement('div'));
    this.descEl = this.infoEl.appendChild(doc.createElement('div'));
    this.controlEl = this.settingEl.appendChild(doc.createElement('div'));
  }
  setName(name: string | DocumentFragment): this {
    if (typeof name === 'string') this.nameEl.textContent = name;
    else this.nameEl.appendChild(name);
    return this;
  }
  setDesc(desc: string | DocumentFragment): this {
    if (typeof desc === 'string') this.descEl.textContent = desc;
    else this.descEl.appendChild(desc);
    return this;
  }
  setHeading(): this {
    this.settingEl.addClass('setting-item-heading');
    return this;
  }
  addButton(cb: (c: ButtonComponent) => unknown): this {
    cb(new ButtonComponent());
    return this;
  }
  addToggle(cb: (c: ToggleComponent) => unknown): this {
    cb(new ToggleComponent());
    return this;
  }
  addDropdown(cb: (c: DropdownComponent) => unknown): this {
    cb(new DropdownComponent());
    return this;
  }
}

export class ButtonComponent {
  setButtonText(_t: string): this {
    return this;
  }
  setCta(): this {
    return this;
  }
  onClick(_cb: () => unknown): this {
    return this;
  }
}

export class ToggleComponent {
  value = false;
  setValue(v: boolean): this {
    this.value = v;
    return this;
  }
  onChange(_cb: (v: boolean) => unknown): this {
    return this;
  }
}

export class DropdownComponent {
  options: Record<string, string> = {};
  value = '';
  addOption(value: string, label: string): this {
    this.options[value] = label;
    return this;
  }
  setValue(v: string): this {
    this.value = v;
    return this;
  }
  onChange(_cb: (v: string) => unknown): this {
    return this;
  }
}

/** The 1.13 settings-tab contract: `getSettingDefinitions` for the declarative
 * path, `get/setControlValue` reading the plugin's own settings object. */
export class PluginSettingTab {
  app: unknown;
  plugin: { settings?: unknown };
  containerEl: HTMLElement = document.createElement('div');
  settingItems: unknown[] = [];
  constructor(app: unknown, plugin: { settings?: unknown }) {
    this.app = app;
    this.plugin = plugin;
  }
  getSettingDefinitions(): unknown[] {
    return [];
  }
  getControlValue(key: string): unknown {
    return (this.plugin.settings as Record<string, unknown> | undefined)?.[key];
  }
  setControlValue(_key: string, _value: unknown): void | Promise<void> {}
  update(): void {}
  refreshDomState(): void {}
  display(): void {}
  hide(): void {}
}

/** Renders a lucide glyph in the real app; a marker attribute is enough here. */
export function setIcon(el: HTMLElement, icon: string): void {
  el.setAttribute('data-icon', icon);
}

/** Obsidian's own path cleaner: collapse slashes, strip the leading one. */
export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\//, '');
}

export class FuzzySuggestModal<T> {
  app: unknown;
  constructor(app: unknown) {
    this.app = app;
  }
  setPlaceholder(_p: string): void {}
  setInstructions(_i: unknown): void {}
  getItems(): T[] {
    return [];
  }
  getItemText(_t: T): string {
    return '';
  }
  renderSuggestion(_m: unknown, _el: HTMLElement): void {}
  onChooseItem(_t: T): void {}
  open(): void {}
  close(): void {}
}

/**
 * `requestUrl` — Obsidian's CORS-free HTTP call, and the plugin's only network
 * access (live links, BL-144).
 *
 * 🔴 The real one **throws on status 400+ unless `throw: false` is passed**, and
 * its `json` / `text` are **properties, not methods**. Both are modelled here on
 * purpose: a mock that resolved everything and exposed `json()` would let the
 * two defects most likely to ship pass every test.
 *
 * Tests set `__requestUrlHandler` to decide what comes back.
 */
export interface RequestUrlParam {
  url: string;
  method?: string;
  contentType?: string;
  body?: string | ArrayBuffer;
  headers?: Record<string, string>;
  throw?: boolean;
}

export interface RequestUrlResponse {
  status: number;
  headers: Record<string, string>;
  text: string;
  json: unknown;
}

let handler: ((param: RequestUrlParam) => Promise<RequestUrlResponse>) | null =
  null;

export function __setRequestUrlHandler(
  fn: ((param: RequestUrlParam) => Promise<RequestUrlResponse>) | null
): void {
  handler = fn;
}

export async function requestUrl(
  param: RequestUrlParam | string
): Promise<RequestUrlResponse> {
  const p: RequestUrlParam = typeof param === 'string' ? { url: param } : param;
  if (!handler) throw new Error(`no requestUrl handler set for ${p.url}`);
  const res = await handler(p);
  // The default that catches people out.
  if (p.throw !== false && res.status >= 400) {
    throw new Error(`Request failed, status ${String(res.status)}`);
  }
  return res;
}
