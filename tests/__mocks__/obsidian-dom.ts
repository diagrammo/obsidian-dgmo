// Obsidian's DOM helpers, for jsdom.
//
// `createEl` / `createDiv` / `createSpan` / `createSvg` are not part of the DOM —
// Obsidian installs them onto `Node.prototype` (and as globals) at runtime, and
// the plugin review guidelines ask plugins to use them instead of
// `document.createElement`. The `obsidian` npm package is types-only, so under
// Vitest they simply do not exist and any code path that builds DOM throws
// `createEl is not a function`.
//
// This is a faithful-enough implementation of the documented `DomElementInfo`
// contract for the subset the plugin uses. It is loaded as a setup file, so the
// prototype is patched before any test imports the source.

interface DomElementInfo {
  cls?: string | string[];
  text?: string | DocumentFragment;
  attr?: Record<string, string | number | boolean | null>;
  title?: string;
  parent?: Node;
  value?: string;
  type?: string;
  placeholder?: string;
  href?: string;
  prepend?: boolean;
}

function applyInfo(el: HTMLElement | SVGElement, o?: DomElementInfo | string) {
  if (o == null) return;
  if (typeof o === 'string') {
    if (o) el.addClass(o);
    return;
  }
  if (o.cls) {
    for (const c of Array.isArray(o.cls) ? o.cls : o.cls.split(/\s+/))
      if (c) el.classList.add(c);
  }
  if (o.text != null) {
    if (typeof o.text === 'string') el.textContent = o.text;
    else el.appendChild(o.text);
  }
  for (const key of ['title', 'value', 'type', 'placeholder', 'href'] as const) {
    const v = o[key];
    if (v != null) el.setAttribute(key, String(v));
  }
  if (o.attr) {
    for (const [k, v] of Object.entries(o.attr)) {
      if (v == null || v === false) continue;
      el.setAttribute(k, v === true ? '' : String(v));
    }
  }
}

function attach(parent: Node | null, el: Node, prepend?: boolean) {
  if (!parent) return;
  if (prepend && parent.firstChild) parent.insertBefore(el, parent.firstChild);
  else parent.appendChild(el);
}

function makeEl(
  doc: Document,
  parent: Node | null,
  tag: string,
  o?: DomElementInfo | string,
  cb?: (el: never) => void
) {
  const el = doc.createElement(tag);
  applyInfo(el, o);
  attach(typeof o === 'object' && o?.parent ? o.parent : parent, el, typeof o === 'object' ? o?.prepend : false);
  cb?.(el as never);
  return el;
}

function ownerDoc(node: Node): Document {
  return node.nodeType === 9 ? (node as Document) : (node.ownerDocument as Document);
}

/** Patch a window's prototypes plus its globals. Idempotent. */
export function installObsidianDom(win: Window & typeof globalThis): void {
  const nodeProto = win.Node.prototype as unknown as Record<string, unknown>;
  const elProto = win.Element.prototype as unknown as Record<string, unknown>;

  nodeProto['createEl'] = function (
    this: Node,
    tag: string,
    o?: DomElementInfo | string,
    cb?: (el: never) => void
  ) {
    return makeEl(ownerDoc(this), this, tag, o, cb);
  };
  nodeProto['createDiv'] = function (
    this: Node,
    o?: DomElementInfo | string,
    cb?: (el: never) => void
  ) {
    return makeEl(ownerDoc(this), this, 'div', o, cb);
  };
  nodeProto['createSpan'] = function (
    this: Node,
    o?: DomElementInfo | string,
    cb?: (el: never) => void
  ) {
    return makeEl(ownerDoc(this), this, 'span', o, cb);
  };
  nodeProto['createSvg'] = function (
    this: Node,
    tag: string,
    o?: DomElementInfo | string,
    cb?: (el: never) => void
  ) {
    const el = ownerDoc(this).createElementNS('http://www.w3.org/2000/svg', tag);
    applyInfo(el, o);
    attach(this, el);
    cb?.(el as never);
    return el;
  };

  elProto['addClass'] = function (this: Element, ...cls: string[]) {
    this.classList.add(...cls);
  };
  elProto['removeClass'] = function (this: Element, ...cls: string[]) {
    this.classList.remove(...cls);
  };
  elProto['toggleClass'] = function (
    this: Element,
    cls: string | string[],
    value: boolean
  ) {
    for (const c of Array.isArray(cls) ? cls : [cls]) this.classList.toggle(c, value);
  };
  elProto['setText'] = function (this: Element, text: string) {
    this.textContent = text;
  };
  elProto['empty'] = function (this: Element) {
    this.replaceChildren();
  };
  elProto['appendText'] = function (this: Element, text: string) {
    this.appendChild(ownerDoc(this).createTextNode(text));
  };

  const g = win as unknown as Record<string, unknown>;
  g['createEl'] = (tag: string, o?: DomElementInfo | string, cb?: (el: never) => void) =>
    makeEl(win.document, null, tag, o, cb);
  g['createDiv'] = (o?: DomElementInfo | string, cb?: (el: never) => void) =>
    makeEl(win.document, null, 'div', o, cb);
  g['createSpan'] = (o?: DomElementInfo | string, cb?: (el: never) => void) =>
    makeEl(win.document, null, 'span', o, cb);
  g['createFragment'] = (cb?: (el: DocumentFragment) => void) => {
    const f = win.document.createDocumentFragment();
    cb?.(f);
    return f;
  };
  // Obsidian's popout-aware document handle; in tests there is one window.
  g['activeDocument'] = win.document;
  g['activeWindow'] = win;
}

installObsidianDom(globalThis as unknown as Window & typeof globalThis);
