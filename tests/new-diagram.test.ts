import { describe, expect, it, vi } from 'vitest';
import type { Editor } from 'obsidian';
import {
  dgmoBlockAtCursor,
  insertDiagramAtCursor,
} from '../src/new-diagram';
import type { DiagramTemplate } from '../src/templates';

/** Read-only fake editor for dgmoBlockAtCursor. */
function readEditor(text: string, cursorLine: number): Editor {
  const lines = text.split('\n');
  return {
    getCursor: () => ({ line: cursorLine, ch: 0 }),
    getLine: (i: number) => lines[i] ?? '',
    lastLine: () => lines.length - 1,
  } as unknown as Editor;
}

const NOTE = [
  '# Notes', // 0
  '', // 1
  '```dgmo', // 2
  'bar Booty', // 3
  'Pearl 42', // 4
  '```', // 5
  '', // 6
  'prose', // 7
  '```js', // 8
  'const x = 1;', // 9
  '```', // 10
].join('\n');

describe('dgmoBlockAtCursor', () => {
  it('returns the source when the cursor is inside a dgmo block', () => {
    expect(dgmoBlockAtCursor(readEditor(NOTE, 4))).toBe('bar Booty\nPearl 42');
  });

  it('matches on the fence line itself', () => {
    expect(dgmoBlockAtCursor(readEditor(NOTE, 2))).toBe('bar Booty\nPearl 42');
  });

  it('returns null when the cursor is outside any block', () => {
    expect(dgmoBlockAtCursor(readEditor(NOTE, 7))).toBeNull();
  });

  it('ignores non-dgmo fenced blocks', () => {
    expect(dgmoBlockAtCursor(readEditor(NOTE, 9))).toBeNull();
  });

  it('returns null on a bare header with no fences', () => {
    expect(dgmoBlockAtCursor(readEditor(NOTE, 0))).toBeNull();
  });
});

describe('insertDiagramAtCursor', () => {
  const tmpl: DiagramTemplate = {
    id: 'bar',
    name: 'Bar',
    family: 'data',
    description: 'Categorical comparison',
    source: 'bar Booty\nPearl 42',
  };

  function writeEditor(currentLine: string, ch: number) {
    const calls: { inserted?: string; cursor?: unknown } = {};
    const editor = {
      getCursor: () => ({ line: 0, ch }),
      getLine: () => currentLine,
      replaceRange: (text: string) => {
        calls.inserted = text;
      },
      setCursor: (pos: unknown) => {
        calls.cursor = pos;
      },
      focus: vi.fn(),
    } as unknown as Editor;
    return { editor, calls };
  }

  it('inserts a fenced dgmo block with the starter source', () => {
    const { editor, calls } = writeEditor('', 0);
    insertDiagramAtCursor(editor, tmpl);
    expect(calls.inserted).toContain('```dgmo\n');
    expect(calls.inserted).toContain('bar Booty\nPearl 42');
    expect(calls.inserted?.trimEnd().endsWith('```')).toBe(true);
  });

  it('prepends a newline when the cursor line already has content', () => {
    const { editor, calls } = writeEditor('some text', 9);
    insertDiagramAtCursor(editor, tmpl);
    expect(calls.inserted?.startsWith('\n```dgmo')).toBe(true);
  });

  it('does not prepend a newline on an empty line', () => {
    const { editor, calls } = writeEditor('', 0);
    insertDiagramAtCursor(editor, tmpl);
    expect(calls.inserted?.startsWith('```dgmo')).toBe(true);
  });
});
