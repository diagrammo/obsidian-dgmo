// esbuild's dataurl loader converts these imports to base64 data URLs at build time
// @ts-expect-error — .ttf imports handled by esbuild dataurl loader
import interRegularUrl from '@diagrammo/dgmo/fonts/Inter-Regular.ttf';
// @ts-expect-error — .ttf imports handled by esbuild dataurl loader
import interBoldUrl from '@diagrammo/dgmo/fonts/Inter-Bold.ttf';

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
  document.fonts.add(regular);
  document.fonts.add(bold);
}
