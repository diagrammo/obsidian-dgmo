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
