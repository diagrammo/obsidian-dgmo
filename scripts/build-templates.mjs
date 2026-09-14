// Builds src/templates.gen.json — the chart-type list + per-type starter
// snippet powering the "New diagram" commands (fuzzy picker + gallery).
//
// Source of truth is the sibling dgmo-content repo: registry.json maps each
// chart TYPE to its primary example .dgmo file (the same starter the desktop
// app's New File dialog seeds from). dgmo-content is NOT an npm dependency and
// only exists in a local workspace — never in CI. So, like copy-example-note,
// we COMMIT the generated file and treat it as both build input and CI
// fallback: overwrite it from dgmo-content when the sibling is present, else
// quietly no-op and keep the committed copy.
//
// 🔴 It reads that sibling's WORKING TREE, and the sibling is shared by every
// session in this workspace, so it is routinely mid-edit. On 2026-09-02 that
// baked somebody's uncommitted drafts of two examples into this tracked file
// and they were committed (#661): the released plugin shipped a `sketch`
// template — *Site Architecture* where clean `main` had *Plunder Pipeline* —
// that existed nowhere in dgmo-content's history, so no reviewer could have
// seen it in a diff and no clean clone could reproduce it. It was only ever
// visible because a second machine regenerated the file and got something else.
//
// So a dirty read is now REFUSED rather than baked. Refusing means skipping the
// generation and keeping the committed file — the same shape a missing sibling
// already gets — and never failing, because this runs on `postinstall` and on
// every `test`, `typecheck`, `build` and `dev`. Making those impossible for
// anyone mid-edit would be a worse defect than the one being fixed.
//
// Reading a committed revision instead (`git show HEAD:…`) was the other
// candidate and was rejected: it would bake a revision nobody is editing, so
// somebody iterating on an example locally would stop seeing their own work in
// the plugin with nothing saying why. The escape below is for exactly that
// person, and the refusal names it every time it fires.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, '..', 'dgmo-content');
const registryPath = join(contentDir, 'registry.json');
const out = join(root, 'src', 'templates.gen.json');

if (!existsSync(registryPath)) {
  console.log(
    `[build-templates] sibling dgmo-content not found at ${registryPath} — keeping committed src/templates.gen.json`
  );
  process.exit(0);
}

const REGISTRY_REL = 'registry.json';
const ALLOW_DIRTY = 'DGMO_TEMPLATES_ALLOW_DIRTY';

/**
 * The subset of `paths` (repo-relative) that dgmo-content has uncommitted
 * changes to, or `null` when git cannot answer — no repo, no git on PATH, a
 * permission problem. A null is NOT a refusal: this script has always run in
 * places with no git at all, and turning "cannot check" into "cannot build"
 * would break an install for a reason nobody could act on.
 */
function dirtyAmong(paths) {
  let out;
  try {
    out = execFileSync(
      'git',
      ['-C', contentDir, 'status', '--porcelain', '--', ...paths],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
  } catch {
    return null;
  }
  // Porcelain v1: two status columns, a space, then the path. A rename carries
  // `old -> new`; the destination is what a later read would get.
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .map((p) => (p.includes(' -> ') ? p.slice(p.indexOf(' -> ') + 4) : p))
    .map((p) => p.replace(/^"|"$/g, ''));
}

const read = [];
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const entities = registry.entities ?? [];
const examples = registry.examples ?? [];

/** Primary example for a chart type: entity === type id and isPrimary. */
function primaryExample(typeId) {
  return examples.find((e) => e.entity === typeId && e.isPrimary);
}

const templates = [];
for (const ent of entities) {
  if (ent.kind !== 'type') continue; // variants surface via search only
  const ex = primaryExample(ent.id);
  if (!ex) {
    console.warn(
      `[build-templates] no primary example for "${ent.id}" — skipped`
    );
    continue;
  }
  const src = join(contentDir, ex.file);
  if (!existsSync(src)) {
    console.warn(`[build-templates] missing example file ${ex.file} — skipped`);
    continue;
  }
  read.push(ex.file);
  templates.push({
    id: ent.id,
    name: ent.name ?? ent.id,
    family: ent.family ?? 'data',
    description: ent.description ?? '',
    source: readFileSync(src, 'utf8').trimEnd(),
  });
}

templates.sort((a, b) => a.name.localeCompare(b.name));

// Everything above only READ. Nothing is written until the sibling is known to
// be clean in the files this bake actually consumed — the registry plus each
// primary example — so an unrelated edit elsewhere in dgmo-content never blocks
// a legitimate regeneration.
const dirty = dirtyAmong([REGISTRY_REL, ...read]);
if (dirty === null) {
  console.log(
    '[build-templates] could not ask git about dgmo-content — generating from the working tree as before'
  );
} else if (dirty.length > 0 && !process.env[ALLOW_DIRTY]) {
  console.log(
    `[build-templates] dgmo-content has uncommitted changes to ${dirty.length} file(s) this bake reads:`
  );
  for (const f of dirty) console.log(`[build-templates]   ${f}`);
  console.log(
    '[build-templates] keeping the committed src/templates.gen.json rather than baking a draft nobody can review (#661).'
  );
  console.log(
    `[build-templates] commit them in dgmo-content, or set ${ALLOW_DIRTY}=1 to bake them anyway while iterating.`
  );
  process.exit(0);
}

writeFileSync(out, JSON.stringify(templates, null, 2) + '\n');
console.log(
  `[build-templates] wrote ${templates.length} templates to src/templates.gen.json`
);
