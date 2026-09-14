// The template bake refuses a dirty dgmo-content (#661).
//
// 🔴 `scripts/build-templates.mjs` reads a SIBLING checkout's working tree, and
// that sibling is shared by every session in this workspace, so it is routinely
// mid-edit. On 2026-09-02 it baked somebody's uncommitted drafts of two
// examples into the tracked `src/templates.gen.json` and they were committed:
// the released plugin shipped a `sketch` template that existed nowhere in
// dgmo-content's history, so no reviewer could have seen it in a diff and no
// clean clone could reproduce it. It was visible only because a second machine
// regenerated the file and got something different.
//
// 🔴 The refusal must never FAIL. This script runs on `postinstall` and at the
// front of `test`, `typecheck`, `build` and `dev`, so a hard error would make
// all of them impossible for anyone with an example open. It skips the write
// and keeps the committed file — the shape a missing sibling already gets.
//
// Driven as a real subprocess against a real scratch git repo, because what is
// under test is what `git status --porcelain` says about a working tree, and a
// mock of that would be a mock of the only thing that ever went wrong.

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = join(import.meta.dirname, '../scripts/build-templates.mjs');
const COMMITTED =
  '[{"id":"kept","name":"Kept","family":"data","description":"","source":"the committed bake"}]\n';

function git(cwd: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.email=t@example.com',
      '-c',
      'user.name=t',
      '-c',
      'init.defaultBranch=main',
      ...args,
    ],
    { cwd, encoding: 'utf8' }
  ).trim();
}

/** A plugin checkout with a committed artifact, beside a clean dgmo-content. */
function world() {
  const base = mkdtempSync(join(tmpdir(), 'build-templates-'));
  const plugin = join(base, 'obsidian-dgmo');
  const content = join(base, 'dgmo-content');
  mkdirSync(join(plugin, 'scripts'), { recursive: true });
  mkdirSync(join(plugin, 'src'), { recursive: true });
  mkdirSync(join(content, 'examples'), { recursive: true });

  cpSync(SCRIPT, join(plugin, 'scripts', 'build-templates.mjs'));
  writeFileSync(join(plugin, 'src', 'templates.gen.json'), COMMITTED);

  writeFileSync(
    join(content, 'registry.json'),
    JSON.stringify({
      entities: [{ id: 'pie', kind: 'type', name: 'Pie', family: 'data' }],
      examples: [{ entity: 'pie', isPrimary: true, file: 'examples/pie.dgmo' }],
    })
  );
  writeFileSync(
    join(content, 'examples', 'pie.dgmo'),
    'pie Committed\nGold 60\n'
  );

  git(content, 'init', '-q');
  git(content, 'add', '-A');
  git(content, 'commit', '-q', '-m', 'examples');

  const run = (env: NodeJS.ProcessEnv = {}) => {
    const out = execFileSync(
      'node',
      [join(plugin, 'scripts', 'build-templates.mjs')],
      {
        encoding: 'utf8',
        env: { ...process.env, ...env },
      }
    );
    return {
      out,
      artifact: readFileSync(join(plugin, 'src', 'templates.gen.json'), 'utf8'),
    };
  };
  const dirty = () =>
    writeFileSync(
      join(content, 'examples', 'pie.dgmo'),
      'pie A Draft Nobody Reviewed\nGold 99\n'
    );

  return { base, plugin, content, run, dirty };
}

describe('the template bake and a dirty dgmo-content (#661)', () => {
  it('bakes normally when the sibling is clean', () => {
    const w = world();
    const { out, artifact } = w.run();
    expect(out).toContain('wrote 1 templates');
    expect(artifact).toContain('pie Committed');
  });

  it('refuses a dirty sibling, keeping the committed artifact byte for byte', () => {
    const w = world();
    w.dirty();
    const { out, artifact } = w.run();

    // 🔴 The committed file survives untouched — this is the whole defect.
    expect(artifact).toBe(COMMITTED);
    expect(artifact).not.toContain('A Draft Nobody Reviewed');
    // It names the file, so the person can act without guessing.
    expect(out).toContain('examples/pie.dgmo');
    expect(out).toContain('keeping the committed src/templates.gen.json');
  });

  it('names the escape in the refusal, rather than leaving it to be found', () => {
    const w = world();
    w.dirty();
    expect(w.run().out).toContain('DGMO_TEMPLATES_ALLOW_DIRTY=1');
  });

  it('bakes the draft when the escape is set, for somebody iterating locally', () => {
    const w = world();
    w.dirty();
    const { artifact } = w.run({ DGMO_TEMPLATES_ALLOW_DIRTY: '1' });
    expect(artifact).toContain('A Draft Nobody Reviewed');
  });

  it('never exits non-zero on a dirty sibling — it runs on postinstall', () => {
    const w = world();
    w.dirty();
    // execFileSync throws on a non-zero exit, so reaching the assertion IS it.
    expect(() => w.run()).not.toThrow();
  });

  it('ignores a dirty file this bake does not read', () => {
    const w = world();
    writeFileSync(
      join(w.content, 'unrelated.md'),
      'not part of any template\n'
    );
    const { out, artifact } = w.run();
    // An untracked neighbour must not block a legitimate regeneration.
    expect(out).toContain('wrote 1 templates');
    expect(artifact).toContain('pie Committed');
  });

  it('still keeps the committed artifact when there is no sibling at all', () => {
    const w = world();
    execFileSync('rm', ['-rf', w.content]);
    const { out, artifact } = w.run();
    expect(out).toContain('keeping committed src/templates.gen.json');
    expect(artifact).toBe(COMMITTED);
  });
});
