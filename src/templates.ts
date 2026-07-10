// Chart-type list + per-type starter snippets for the "New diagram" commands.
// The data is generated from dgmo-content's registry.json at build time
// (scripts/build-templates.mjs) and inlined by esbuild's JSON loader.
import rawTemplates from './templates.gen.json';

export interface DiagramTemplate {
  id: string;
  name: string;
  family: string;
  description: string;
  source: string;
}

export const templates: DiagramTemplate[] = rawTemplates as DiagramTemplate[];

/** Sidebar order for the gallery; mirrors the desktop app's categories. */
export const FAMILY_ORDER = [
  'data',
  'software',
  'project',
  'business',
  'life',
] as const;

export const FAMILY_LABEL: Record<string, string> = {
  data: 'Data',
  software: 'Software',
  project: 'Project',
  business: 'Business',
  life: 'Life',
};

/** Templates grouped by family, in FAMILY_ORDER, each group name-sorted. */
export function templatesByFamily(): Array<{
  family: string;
  label: string;
  items: DiagramTemplate[];
}> {
  return FAMILY_ORDER.map((family) => ({
    family,
    label: FAMILY_LABEL[family] ?? family,
    items: templates
      .filter((t) => t.family === family)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0);
}
