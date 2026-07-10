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
    console.warn(`[build-templates] no primary example for "${ent.id}" — skipped`);
    continue;
  }
  const src = join(contentDir, ex.file);
  if (!existsSync(src)) {
    console.warn(`[build-templates] missing example file ${ex.file} — skipped`);
    continue;
  }
  templates.push({
    id: ent.id,
    name: ent.name ?? ent.id,
    family: ent.family ?? 'data',
    description: ent.description ?? '',
    source: readFileSync(src, 'utf8').trimEnd(),
  });
}

templates.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(out, JSON.stringify(templates, null, 2) + '\n');
console.log(`[build-templates] wrote ${templates.length} templates to src/templates.gen.json`);
