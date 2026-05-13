// esbuild's dataurl loader converts these imports to base64 data URLs at build time.
// Source TTFs from @diagrammo/dgmo are pre-converted to woff2 (~65% smaller) and
// committed under assets/ — see scripts/build-fonts.mjs to regenerate.
// @ts-expect-error — .woff2 imports handled by esbuild dataurl loader
import interRegularUrl from '../assets/Inter-Regular.woff2';
// @ts-expect-error — .woff2 imports handled by esbuild dataurl loader
import interBoldUrl from '../assets/Inter-Bold.woff2';

let loaded = false;

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
  activeDocument.fonts.add(regular);
  activeDocument.fonts.add(bold);
}
