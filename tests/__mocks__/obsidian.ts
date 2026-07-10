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
  constructor(app: unknown) {
    this.app = app;
  }
  open(): void {}
  close(): void {}
  onOpen(): void {}
  onClose(): void {}
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
