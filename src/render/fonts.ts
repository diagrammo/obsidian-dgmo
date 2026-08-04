// esbuild's dataurl loader converts these imports to base64 data URLs at build time.
// Source TTFs from @diagrammo/dgmo are pre-converted to woff2 (~65% smaller) and
// committed under assets/ — see scripts/build-fonts.mjs to regenerate.
// Typed by the `*.woff2` declaration in assets.d.ts.
import interRegularUrl from '../../assets/Inter-Regular.woff2';
import interBoldUrl from '../../assets/Inter-Bold.woff2';

let loaded = false;

/** The faces this plugin added, so unload can take them back out again. */
let faces: FontFace[] = [];

/** Register Inter font faces. Idempotent, called on first render. */
export async function ensureInterFonts(): Promise<void> {
  if (loaded) return;
  loaded = true;

  const regular = new FontFace('Inter', `url(${interRegularUrl})`, {
    weight: '400',
    style: 'normal',
  });
  const bold = new FontFace('Inter', `url(${interBoldUrl})`, {
    weight: '700',
    style: 'normal',
  });

  await Promise.all([regular.load(), bold.load()]);
  faces = [regular, bold];
  for (const face of faces) activeDocument.fonts.add(face);
}

/** Unregister them again on plugin unload. `document.fonts` belongs to the app,
 * not to this plugin's DOM, so faces left behind outlive a disable/uninstall —
 * an "Inter" family the vault never asked for. */
export function removeInterFonts(): void {
  for (const face of faces) activeDocument.fonts.delete(face);
  faces = [];
  loaded = false;
}
