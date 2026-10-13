// The example note's Live link section (#1276) — read against the plugin's own
// parsers, so the note shows only spellings this plugin actually renders.
//
// The note is the committed `src/example-note.md`, the file esbuild inlines into
// the command *Create example note with all chart types*. It is generated from
// dgmo-content, so a stale copy here ships a note without the section.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { liveLinkId } from '../src/render/live-link';
import { embedLiveLinkId } from '../src/render/embed';

// The language reference's diagram; its public source returned 200 on
// 2026-10-12. Every published example once pointed at a dead diagram (#783).
const ID = 'dgm_01M3PG3DQ6S89W7ZFM5Z06J1CD';

// `__dirname`, not `import.meta.url`: under jsdom the latter is not a file URL.
const note = readFileSync(join(__dirname, '../src/example-note.md'), 'utf8');
const settingsSource = readFileSync(
  join(__dirname, '../src/ui/settings.ts'),
  'utf8'
);

/** The `## Live link` section, up to the rule that closes it. */
function liveLinkSection(): string {
  const start = note.indexOf('\n## Live link\n');
  expect(
    start,
    'src/example-note.md has no "## Live link" section'
  ).toBeGreaterThan(-1);
  const end = note.indexOf('\n---\n', start);
  return note.slice(start, end === -1 ? undefined : end);
}

/** The bodies of every ```<lang> fence in `text`. */
function fences(text: string, lang: string): string[] {
  const re = new RegExp('^```' + lang + '\\n([\\s\\S]*?)^```$', 'gm');
  return [...text.matchAll(re)].map((m) => m[1]);
}

describe('example note — the Live link section', () => {
  it('shows three dgmo fences, each one a live link this plugin resolves', () => {
    const bodies = fences(liveLinkSection(), 'dgmo');
    expect(bodies).toHaveLength(3);
    for (const body of bodies) expect(liveLinkId(body)).toBe(ID);
  });

  it('shows the note-body spelling, which the embed handler resolves', () => {
    const [body] = fences(liveLinkSection(), 'markdown');
    const embed = body?.trim() ?? '';
    expect(embed).toBe(`![[live-link:${ID}]]`);
    // Obsidian hands the embed handler the inside of the brackets.
    expect(embedLiveLinkId(embed.slice(3, -2))).toBe(ID);
  });

  it('names the switch-off setting as the settings tab names it', () => {
    expect(liveLinkSection()).toContain('**Keep live links up to date**');
    expect(settingsSource).toContain("name: 'Keep live links up to date'");
  });
});
