// Re-make the community-listing screenshots: mock Obsidian notes holding real
// dgmo renders. Each diagram is drawn by the plugin's own @diagrammo/dgmo from
// listing/diagrams/*.dgmo, laid into a note page, and captured by a headless
// Chromium at 3000x2000. Not part of the build or the release.
//
//   node scripts/listing-screenshots.mjs
//
// Chromium: $CHROME, else the newest chrome-headless-shell in Playwright's
// cache. Full Chrome for Testing hangs on --screenshot here; the shell exits.
// Output: listing/<n>-<name>.png. Upload in file-name order.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { render } from '@diagrammo/dgmo';

const ROOT = resolve(import.meta.dirname, '..', 'listing');

async function svg(name) {
  const source = readFileSync(join(ROOT, 'diagrams', `${name}.dgmo`), 'utf8');
  const r = await render(source, { theme: 'dark', palette: 'slate' });
  const errors = r.diagnostics.filter((d) => d.severity === 'error');
  if (errors.length) throw new Error(`${name}.dgmo: ${errors[0].message}`);
  // Size comes from the page; the root's own width/height would fight it.
  return r.svg.replace(/(<svg[^>]*?) (width|height)="[^"]*"/g, '$1');
}

const todo = (title, items) =>
  `<h2>${title}</h2>` +
  items
    .map(
      ([done, text]) =>
        `<div class=todo><span class="bx${done ? '' : ' o'}">${done ? '✓' : ''}</span>${text}</div>`
    )
    .join('');

const PAGES = [
  {
    file: '1-sequence',
    vault: [
      '📁 ADRs',
      '📁 Runbooks',
      'Checkout flow',
      'Architecture',
      'On-call notes',
    ],
    title: 'Checkout flow',
    intro:
      'What happens when someone presses Buy. The diagram is a <code>dgmo</code> code block in this note.',
    body: async () =>
      `<div style="margin-top:14px">${await svg('checkout-sequence')}</div>`,
  },
  {
    file: '2-architecture',
    vault: [
      '📁 ADRs',
      '📁 Runbooks',
      'Checkout flow',
      'Architecture',
      'On-call notes',
    ],
    title: 'Architecture',
    intro:
      'What checkout runs on, and what is still being built. A <code>dgmo</code> code block, so it diffs in git.',
    body: async () =>
      `<div class=row style="align-items:flex-start;margin-top:18px"><div style="flex:2.4">${await svg('checkout-architecture')}</div>` +
      `<div style="flex:1;padding-top:150px">${todo('This sprint', [
        [1, 'Payments on the new API'],
        [0, 'Queue in production'],
        [0, 'Pick an email vendor'],
      ])}</div></div>`,
  },
  {
    file: '3-data',
    vault: [
      '📁 Meetings',
      '📁 Projects',
      'Q3 review',
      'Checkout flow',
      'Architecture',
    ],
    title: 'Q3 review',
    intro:
      "The numbers for Thursday's review. Each chart is a <code>dgmo</code> code block, so next quarter is a copy and edit.",
    body: async () =>
      `<div class=row style="margin-top:14px"><div style="flex:1">${await svg('tickets-bar')}</div><div style="flex:1">${await svg('revenue-pie')}</div></div>` +
      `<div class=row style="margin-top:14px"><div style="flex:1">${await svg('revenue-line')}</div>` +
      `<div style="flex:1;padding-left:10px">${todo('Takeaways', [
        [1, 'Revenue more than doubled since April'],
        [1, 'Team plan is now half of revenue'],
        [1, 'Critical tickets down to 6 a month'],
      ])}</div></div>`,
  },
  {
    file: '4-trip-note',
    vault: [
      '📁 Daily',
      '📁 People',
      'Trip to Japan',
      'Reading list',
      'Okafor family',
    ],
    title: 'Trip to Japan',
    intro:
      'Chidi turns 50 in Kyoto. Every chart below is a <code>dgmo</code> code block in this note.',
    body: async () =>
      `<div>${await svg('birthday-countdown')}</div>` +
      `<div class=row style="align-items:flex-start"><div style="flex:1.7">${await svg('agent-clock')}` +
      `<div style="margin-top:26px">${todo('To do', [
        [1, 'Flights booked'],
        [1, 'Ryokan in Gion, 3 nights'],
        [0, 'JR Pass for the bullet train'],
        [0, 'Birthday dinner reservation'],
      ])}</div></div><div style="flex:1;max-width:330px">${await svg('trip-fund-goal')}</div></div>`,
  },
];

// Obsidian's dark chrome, roughly: a vault sidebar and one open note.
const STYLE = `
html,body{margin:0;background:#161b22}
body{width:1200px;height:800px;overflow:hidden;font-family:Inter,system-ui,sans-serif;color:#c9d1d9;display:flex}
.side{width:190px;background:#11151b;border-right:1px solid #2a313b;padding:28px 18px;box-sizing:border-box;font-size:15px;color:#7d8590}
.side div{white-space:nowrap;padding:6px 10px;border-radius:6px;margin-bottom:2px}
.side .on{background:#252c36;color:#e6edf3}
.side .h{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#59616b;margin:6px 0 10px}
.note{flex:1;padding:34px 40px 0;box-sizing:border-box}
h1{font-size:34px;margin:0 0 6px;color:#e6edf3}
h2{font-size:20px;color:#e6edf3;margin:0 0 10px 4px}
p{font-size:17px;margin:0 0 6px;color:#9da7b3}
.row{display:flex;gap:28px;align-items:center}
svg{display:block;width:100%;height:auto}
code{background:#252c36;border-radius:4px;padding:1px 6px;font-size:16px;color:#e6edf3}
.todo{font-size:17px;margin:0 0 10px 4px;display:flex;align-items:center;gap:10px}
.bx{width:18px;height:18px;border-radius:4px;background:#7c5cff;color:#fff;font-size:13px;display:inline-flex;align-items:center;justify-content:center}
.bx.o{background:none;border:1.5px solid #59616b;box-sizing:border-box}`;

// Trim each render to its drawing: drop the full-canvas background rect, then
// fit the viewBox to what is left, so the diagram fills its slot.
const TIGHTEN = `for (const svg of document.querySelectorAll('.note svg')) {
  const vb = svg.viewBox.baseVal;
  for (const r of svg.querySelectorAll('rect'))
    if (+r.getAttribute('width') >= vb.width * 0.95 && +(r.getAttribute('height') || 0) >= vb.height * 0.9) r.remove();
  svg.style.background = 'none';
  const b = svg.getBBox();
  svg.setAttribute('viewBox', [b.x - 8, b.y - 8, b.width + 16, b.height + 16].join(' '));
}`;

function chromium() {
  if (process.env.CHROME) return process.env.CHROME;
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  const builds = existsSync(cache)
    ? readdirSync(cache)
        .filter((d) => /^chromium_headless_shell-\d+$/.test(d))
        .sort()
    : [];
  for (const build of builds.reverse()) {
    const bin = join(
      cache,
      build,
      'chrome-headless-shell-mac-arm64',
      'chrome-headless-shell'
    );
    if (existsSync(bin)) return bin;
  }
  throw new Error(
    'No Chromium found. Set CHROME to a Chrome or Chromium binary.'
  );
}

const chrome = chromium();
const work = join(tmpdir(), 'dgmo-listing');
mkdirSync(work, { recursive: true });
for (const page of PAGES) {
  const side = page.vault
    .map((v) =>
      v.startsWith('📁')
        ? `<div>${v}</div>`
        : `<div${v === page.title ? ' class=on' : ''}>📄 ${v}</div>`
    )
    .join('');
  const html =
    `<!doctype html><meta charset=utf-8><style>${STYLE}</style>` +
    `<div class=side><div class=h>Vault</div>${side}</div>` +
    `<div class=note><h1>${page.title}</h1><p>${page.intro}</p>${await page.body()}</div>` +
    `<script>${TIGHTEN}</script>`;
  const htmlPath = join(work, `${page.file}.html`);
  writeFileSync(htmlPath, html);
  const out = join(ROOT, `${page.file}.png`);
  execFileSync(
    chrome,
    [
      '--hide-scrollbars',
      '--force-device-scale-factor=2.5',
      '--window-size=1200,800',
      `--screenshot=${out}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'ignore', timeout: 60_000 }
  );
  console.log(`wrote ${out}`);
}
