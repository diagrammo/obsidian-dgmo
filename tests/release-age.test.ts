import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// pnpm refuses any version published less than three days ago
// (diagrammo/diagrammo#1781). Compromised npm versions have stayed live past a
// day, so the one-day hold this replaced left part of that window open.
const __dirname = dirname(fileURLToPath(import.meta.url));
const workspace = readFileSync(
  resolve(__dirname, '..', 'pnpm-workspace.yaml'),
  'utf8'
);

describe('pnpm release-age hold', () => {
  it('holds new versions for at least three days', () => {
    const m = workspace.match(/^minimumReleaseAge:\s*(\d+)\s*$/m);
    expect(m, 'minimumReleaseAge is set in pnpm-workspace.yaml').not.toBeNull();
    expect(Number(m?.[1])).toBeGreaterThanOrEqual(3 * 24 * 60);
  });
});
