import {
  App,
  Editor,
  FuzzySuggestModal,
  Modal,
  Notice,
  TFile,
  type FuzzyMatch,
} from 'obsidian';
import { encodeDiagramUrl, resolvePaletteOrFallback } from '@diagrammo/dgmo';
import type DgmoPlugin from './main';
import { renderDiagramThumbnail } from './render';
import { templatesByFamily, type DiagramTemplate } from './templates';

const EDITOR_BASE = 'https://online.diagrammo.app';

/** Fenced ```dgmo block for a starter snippet. */
function fenceFor(source: string): string {
  return '```dgmo\n' + source.trimEnd() + '\n```\n';
}

/**
 * Insert a starter block at the editor's cursor on its own line(s), then park
 * the cursor on the first source line inside the block so the user can edit.
 */
export function insertDiagramAtCursor(
  editor: Editor,
  tmpl: DiagramTemplate
): void {
  const from = editor.getCursor();
  const line = editor.getLine(from.line);
  const needsLead = line.slice(0, from.ch).trim().length > 0;
  const block = (needsLead ? '\n' : '') + fenceFor(tmpl.source);
  editor.replaceRange(block, from);

  const firstSrcLine = from.line + (needsLead ? 1 : 0) + 1; // after ```dgmo
  const text = editor.getLine(firstSrcLine) ?? '';
  editor.setCursor({ line: firstSrcLine, ch: text.length });
  editor.focus();
  new Notice(`Inserted ${tmpl.name} diagram.`);
}

/** Create a new note seeded with the starter block and open it. */
export async function createDiagramNote(
  app: App,
  tmpl: DiagramTemplate
): Promise<void> {
  const base = `${tmpl.name} diagram`;
  let path = `${base}.md`;
  let n = 2;
  while (app.vault.getAbstractFileByPath(path)) path = `${base} ${n++}.md`;
  const file = await app.vault.create(path, fenceFor(tmpl.source));
  if (file instanceof TFile) await app.workspace.getLeaf().openFile(file);
  new Notice(`Created "${path}".`);
}

// ============================================================
// Fuzzy picker — the everyday driver (insert at cursor)
// ============================================================

export class NewDiagramFuzzyModal extends FuzzySuggestModal<DiagramTemplate> {
  constructor(
    app: App,
    private readonly items: DiagramTemplate[],
    private readonly onChoose: (t: DiagramTemplate) => void
  ) {
    super(app);
    this.setPlaceholder('Pick a chart type to insert…');
    this.setInstructions([
      { command: '↑↓', purpose: 'navigate' },
      { command: '↵', purpose: 'insert at cursor' },
      { command: 'esc', purpose: 'dismiss' },
    ]);
  }

  getItems(): DiagramTemplate[] {
    return this.items;
  }

  // Include description + id so fuzzy search matches on intent, not just name.
  getItemText(t: DiagramTemplate): string {
    return `${t.name} ${t.description} ${t.id}`;
  }

  override renderSuggestion(
    match: FuzzyMatch<DiagramTemplate>,
    el: HTMLElement
  ): void {
    const t = match.item;
    el.addClass('dgmo-suggest-row');
    const main = el.createDiv({ cls: 'dgmo-suggest-main' });
    main.createSpan({ cls: 'dgmo-suggest-name', text: t.name });
    if (t.description) {
      main.createSpan({ cls: 'dgmo-suggest-desc', text: t.description });
    }
  }

  onChooseItem(t: DiagramTemplate): void {
    this.onChoose(t);
  }
}

// ============================================================
// Gallery — category sidebar + live-rendered thumbnails
// ============================================================

export class DiagramGalleryModal extends Modal {
  private grid!: HTMLElement;
  private searchEl!: HTMLInputElement;
  private activeFamily = 'data';
  private query = '';
  private navItems = new Map<string, HTMLElement>();

  constructor(
    app: App,
    private readonly plugin: DgmoPlugin,
    private readonly onInsert: (t: DiagramTemplate) => void,
    private readonly onNewNote: (t: DiagramTemplate) => void
  ) {
    super(app);
  }

  override onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass('dgmo-gallery-modal');
    contentEl.empty();

    const header = contentEl.createDiv({ cls: 'dgmo-gallery-header' });
    header.createEl('h2', { text: 'New diagram' });
    this.searchEl = header.createEl('input', {
      cls: 'dgmo-gallery-search',
      attr: { type: 'text', placeholder: 'Search all chart types…' },
    });
    this.searchEl.addEventListener('input', () => {
      this.query = this.searchEl.value.trim().toLowerCase();
      this.renderGrid();
    });

    const body = contentEl.createDiv({ cls: 'dgmo-gallery-body' });
    const nav = body.createDiv({ cls: 'dgmo-gallery-nav' });
    for (const group of templatesByFamily()) {
      const item = nav.createDiv({
        cls: 'dgmo-gallery-nav-item',
        text: group.label,
      });
      item.addEventListener('click', () => {
        this.query = '';
        this.searchEl.value = '';
        this.setFamily(group.family);
      });
      this.navItems.set(group.family, item);
    }

    this.grid = body.createDiv({ cls: 'dgmo-gallery-grid' });

    const footer = contentEl.createDiv({ cls: 'dgmo-gallery-footer' });
    footer.createSpan({
      text: 'Click a tile to insert at the cursor · ⌘/Ctrl-click to create a new note instead.',
    });

    this.setFamily(this.activeFamily);
    window.setTimeout(() => this.searchEl.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private setFamily(family: string): void {
    this.activeFamily = family;
    for (const [fam, el] of this.navItems) {
      el.toggleClass('is-active', fam === family && this.query === '');
    }
    this.renderGrid();
  }

  private visibleTemplates(): DiagramTemplate[] {
    const groups = templatesByFamily();
    if (this.query) {
      return groups
        .flatMap((g) => g.items)
        .filter((t) =>
          `${t.name} ${t.description} ${t.id}`
            .toLowerCase()
            .includes(this.query)
        );
    }
    return groups.find((g) => g.family === this.activeFamily)?.items ?? [];
  }

  private renderGrid(): void {
    // Reflect search state in the nav (nothing active while searching).
    if (this.query) {
      for (const el of this.navItems.values()) el.removeClass('is-active');
    }
    this.grid.empty();
    const items = this.visibleTemplates();
    if (items.length === 0) {
      this.grid.createDiv({
        cls: 'dgmo-gallery-empty',
        text: 'No chart types match your search.',
      });
      return;
    }
    const isDark = this.plugin.isDark();
    const palette = this.plugin.getPalette();
    for (const t of items) {
      const tile = this.grid.createDiv({ cls: 'dgmo-gallery-tile' });
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', `Insert ${t.name} diagram`);
      const thumb = tile.createDiv({ cls: 'dgmo-gallery-thumb' });
      tile.createDiv({ cls: 'dgmo-gallery-tile-name', text: t.name });
      void renderDiagramThumbnail(t.source, thumb, isDark, palette);
      tile.addEventListener('click', (e) => {
        this.close();
        if (e.metaKey || e.ctrlKey) this.onNewNote(t);
        else this.onInsert(t);
      });
    }
  }
}

// ============================================================
// Open the block under the cursor in the online editor
// ============================================================

/** Source of the ```dgmo fence enclosing the cursor line, or null. */
export function dgmoBlockAtCursor(editor: Editor): string | null {
  const cur = editor.getCursor().line;
  const last = editor.lastLine();
  const fenceOpen = /^\s*(?:```+|~~~+)\s*dgmo\b/;
  const fenceClose = /^\s*(?:```+|~~~+)\s*$/;

  let start = -1;
  for (let i = cur; i >= 0; i--) {
    const line = editor.getLine(i);
    if (fenceOpen.test(line)) {
      start = i;
      break;
    }
    if (i !== cur && fenceClose.test(line)) return null; // hit a prior fence
  }
  if (start === -1) return null;

  let end = -1;
  for (let i = start + 1; i <= last; i++) {
    if (fenceClose.test(editor.getLine(i))) {
      end = i;
      break;
    }
  }
  if (end === -1 || cur > end) return null;

  const lines: string[] = [];
  for (let i = start + 1; i < end; i++) lines.push(editor.getLine(i));
  return lines.join('\n');
}

/** Open the cursor's dgmo block at online.diagrammo.app with palette + theme. */
export function openBlockInEditor(
  editor: Editor,
  paletteId: string,
  isDark: boolean
): void {
  const source = dgmoBlockAtCursor(editor);
  if (!source || !source.trim()) {
    new Notice('Put the cursor inside a dgmo diagram block first.');
    return;
  }
  const url =
    encodeDiagramUrl(source, {
      palette: resolvePaletteOrFallback(paletteId),
      theme: isDark ? 'dark' : 'light',
    }) ?? EDITOR_BASE;
  window.open(url, '_blank', 'noopener,noreferrer');
}
