// ============================================================
// Live links — following a pointer from inside a note
// ============================================================
//
// A `live-link` fence names a diagram published to Diagrammo Cloud instead of
// carrying its own source. This module turns that name into the author's
// current drawing, and keeps drawing it when there is no network.
//
// 🔴 **This is the plugin's only network access.** Nothing else in `src/` makes
// a request. Obsidian's Developer Policies allow it and require one thing in
// return — a README disclosure naming the service — which `README.md` carries.
// Anything added here that *counts readers* would be client-side telemetry,
// which is banned outright. Don't.
//
// The reading of a response — what 200/404/410/5xx MEAN — is not here either.
// It is `fetchLiveLink` in `@diagrammo/dgmo/live-link-resolve`, shared with the
// docs wrappers so that six HTTP statuses have one interpretation across every
// surface. What lives here is the part that is genuinely a NOTE's opinion:
// draw the last copy first, say so when it is stale, and never outlive a
// withdrawal.

import { requestUrl } from 'obsidian';
import {
  parseCloudReference,
  referenceShareUrl,
} from '@diagrammo/dgmo/cloud-reference';
import {
  fetchLiveLink,
  type LiveLinkFetch,
} from '@diagrammo/dgmo/live-link-resolve';

/** How long a reader waits before we give up and draw what we have. */
export const LIVE_LINK_TIMEOUT_MS = 8_000;

/** One remembered diagram. Mirrors the wrappers' entry, minus their `id` key. */
export interface LiveLinkCacheEntry {
  source: string;
  dgmoVersion: string;
  updatedAt: number;
  fetchedAt: number;
}

export type LiveLinkCacheMap = Record<string, LiveLinkCacheEntry>;

/**
 * Where the remembered copies are kept.
 *
 * Injected so every branch below is testable without a vault, and because the
 * real one is the plugin's own folder — which the Vault API does not reach.
 */
export interface LiveLinkStore {
  read(): Promise<LiveLinkCacheMap>;
  write(map: LiveLinkCacheMap): Promise<void>;
}

/** Everything the render needs that isn't the fence itself. */
export interface LiveLinkContext {
  store: LiveLinkStore;
  /** False when the reader has turned the setting off. */
  enabled: boolean;
  /** Draw DGMO source into the container. The block renderer, injected. */
  draw: (source: string) => Promise<void>;
  /** Draw the reference card — what a pointer looks like unresolved. */
  drawCard: () => Promise<void>;
  /** Injected in tests; defaults to the `requestUrl` adapter below. */
  fetchImpl?: typeof fetch;
  /** Injected in tests. */
  now?: () => number;
}

/**
 * `requestUrl` shaped like `fetch`, because that is the seam `fetchLiveLink`
 * takes and Obsidian's own guidance says to use `requestUrl` rather than
 * `fetch` on a plugin that runs on mobile.
 *
 * Three details, each of which is a defect if missed — all read out of
 * `obsidian.d.ts` on 2026-08-04 rather than remembered:
 *
 * 🔴 `throw: false`. `requestUrl` throws on any status 400 or above by default,
 * so without this the **410 tombstone arrives as an exception** and is
 * indistinguishable from being offline — which would quietly keep publishing a
 * diagram its author withdrew.
 *
 * 🔴 **`requestUrl` has no timeout and cannot be aborted.** `RequestUrlParam` is
 * `{url, method, contentType, body, headers, throw}` — there is no `signal`. The
 * `AbortSignal` that `fetchLiveLink` passes therefore does nothing here, so the
 * deadline has to be imposed on this side or a hung request hangs the render of
 * somebody's note.
 *
 * ⚠️ `RequestUrlResponse.json` and `.text` are **properties, not methods**.
 * `await r.json()` does not work. Handing back a real `Response` built from
 * `r.text` keeps that quirk from leaking any further.
 */
export function requestUrlFetch(
  timeoutMs = LIVE_LINK_TIMEOUT_MS
): typeof fetch {
  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : String(input);
    const answer = requestUrl({
      url,
      throw: false,
      headers: { accept: 'application/json' },
    });
    // The deadline `requestUrl` cannot enforce. A 504 rather than a throw, so
    // it lands as `unavailable` — a timeout is "not right now", never "gone".
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<Response>((resolve) => {
      timer = setTimeout(
        () => resolve(new Response('', { status: 504 })),
        timeoutMs
      );
    });
    try {
      const r = await Promise.race([
        answer.then((res) => new Response(res.text, { status: res.status })),
        deadline,
      ]);
      return r;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }) as typeof fetch;
}

/** The filesystem primitives a store needs. Obsidian's adapter satisfies this. */
export interface LiveLinkFileIo {
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/**
 * The remembered copies, in the plugin's own folder.
 *
 * ⚠️ **Not the vault, and this is deliberate.** Every docs wrapper commits its
 * cache to `.dgmo/references/` so a clean CI checkout builds without the network
 * and a change arrives as a reviewable diff. A vault has neither property — and
 * spec §38.5 forbids the shape outright, because a diagram vault is often a git
 * repo and a file rewritten on every visit means *reading* a diagram dirties the
 * tree.
 *
 * ⚠️ **Not `data.json` either.** That is rewritten whenever a setting changes
 * and is read whole at load; a cache has a different lifetime and a different
 * size curve.
 *
 * ⚠️ **Written through the vault ADAPTER, which is otherwise forbidden here.**
 * The rule against the adapter is about vault NOTES, where going behind
 * Obsidian's back leaves the metadata cache and any open view holding a stale
 * body. The plugin config folder is not a note, has no cache and no view, and
 * the Vault API does not reach it at all.
 *
 * Held in memory after the first read: a note with ten live links must not read
 * the same file ten times.
 */
export class PluginFolderStore implements LiveLinkStore {
  private map: LiveLinkCacheMap | null = null;
  private writing: Promise<void> = Promise.resolve();

  /**
   * @param io   the vault adapter
   * @param path where to keep it — `null` when the plugin has no folder, in
   *             which case this degrades to memory for the session. 🔴
   *             `PluginManifest.dir` is OPTIONAL (`dir?: string`), so this is a
   *             real branch and not defensive padding.
   */
  constructor(
    private readonly io: LiveLinkFileIo,
    private readonly path: string | null
  ) {}

  async read(): Promise<LiveLinkCacheMap> {
    if (this.map) return this.map;
    this.map = {};
    if (!this.path) return this.map;
    try {
      if (!(await this.io.exists(this.path))) return this.map;
      const parsed: unknown = JSON.parse(await this.io.read(this.path));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        this.map = parsed as LiveLinkCacheMap;
      }
    } catch {
      // A corrupt cache is not a failure: it is treated as absent, and the next
      // successful fetch overwrites it. Refusing to render a note because a
      // JSON file got mangled would be a far worse trade.
    }
    return this.map;
  }

  async write(map: LiveLinkCacheMap): Promise<void> {
    this.map = map;
    if (!this.path) return;
    const path = this.path;
    // Serialized: several blocks in one note resolve concurrently, and two
    // overlapping writes of the whole map lose one of them.
    this.writing = this.writing.then(async () => {
      try {
        await this.io.write(path, JSON.stringify(map, null, 2));
      } catch {
        // Losing the cache costs a refetch. It must never cost a render.
      }
    });
    return this.writing;
  }
}

/** The id a fence points at, or null when it is not a live link at all. */
export function liveLinkId(source: string): string | null {
  const firstLine = source
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('//'));
  if (!firstLine) return null;
  // The whole-line spellings (a share link, `![[live-link:<id>]]`) and the
  // fence form all go through the shared parser — never a local regex.
  const whole = parseCloudReference(firstLine);
  if (whole) return whole.id;
  // The titled form: `live-link <Title>` + `url <target>`. dgmo's own parser
  // owns that shape; rather than reimplement it, take the `url` line's value
  // through the same shared parser via its bare-id spelling.
  const urlLine = source
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^url\s+/i.test(l));
  if (!urlLine) return null;
  const value = urlLine.replace(/^url\s+/i, '').trim();
  return (
    parseCloudReference(value)?.id ??
    parseCloudReference(`live-link ${value}`)?.id ??
    null
  );
}

/** One dimmed line under the diagram. Never a Notice — a note is for reading. */
function appendNote(container: HTMLElement, text: string): void {
  const el = container.createDiv({ cls: 'dgmo-live-link-note' });
  el.appendText(text);
}

function appendLink(container: HTMLElement, id: string, text: string): void {
  const el = container.createDiv({ cls: 'dgmo-live-link-note' });
  const a = el.createEl('a', {
    text,
    href: referenceShareUrl({ id }),
  });
  // `setAttribute`, not Obsidian's `setAttr`: the latter is an augmentation of
  // `Element.prototype` that exists at Obsidian runtime and NOT in jsdom, so it
  // passes review and fails every test. Plain DOM works in both.
  a.setAttribute('target', '_blank');
  a.setAttribute('rel', 'noopener noreferrer');
}

/**
 * Draw a live link: the last copy immediately, the current one when it arrives.
 *
 * Returns what happened, so a caller can test the branch it cares about without
 * reading the DOM.
 */
export async function renderLiveLink(
  id: string,
  container: HTMLElement,
  ctx: LiveLinkContext
): Promise<
  'drawn' | 'cached' | 'card' | 'tombstone' | 'missing' | 'disabled' | 'offline'
> {
  const now = ctx.now ?? ((): number => Date.now());
  const map = await ctx.store.read();
  const cached = map[id];

  // Turned off: exactly what a never-fetched pointer looks like. The cache is
  // deliberately NOT cleared — turning it back on should not re-fetch the world.
  if (!ctx.enabled) {
    await ctx.drawCard();
    return 'disabled';
  }

  // 1 — draw what we already have, before anything touches the network. The
  // reader is opening a note, not loading an app.
  let drewCached = false;
  if (cached) {
    await ctx.draw(cached.source);
    drewCached = true;
  } else {
    await ctx.drawCard();
  }

  // 2 — ask.
  const answer: LiveLinkFetch = await fetchLiveLink(
    { id },
    {
      fetchImpl: ctx.fetchImpl ?? requestUrlFetch(),
      timeoutMs: LIVE_LINK_TIMEOUT_MS,
      // A person is waiting. One attempt; the next note-open is the retry.
      retries: 0,
    }
  );

  // 3 — reconcile.
  if (answer.kind === 'ok') {
    const { entry } = answer;
    if (!drewCached || entry.source !== cached?.source) {
      await ctx.draw(entry.source);
    }
    await ctx.store.write({
      ...map,
      [id]: {
        source: entry.source,
        dgmoVersion: entry.dgmoVersion,
        updatedAt: entry.updatedAt,
        fetchedAt: now(),
      },
    });
    return 'drawn';
  }

  if (answer.kind === 'gone') {
    // 🔴 The author took it back. A local copy must not outlive that decision —
    // stale-but-still-shared is fine, stale-after-revoked is publishing
    // something somebody retracted. Drop the entry as well as the drawing.
    const rest: LiveLinkCacheMap = {};
    for (const [key, value] of Object.entries(map))
      if (key !== id) rest[key] = value;
    await ctx.store.write(rest);
    container.replaceChildren();
    await ctx.drawCard();
    appendNote(
      container,
      'This diagram was unshared by its author. Ask them to publish it again, or delete the live link.'
    );
    return 'tombstone';
  }

  if (answer.kind === 'missing') {
    if (drewCached) {
      appendNote(
        container,
        'This diagram no longer resolves — showing your last copy. It may have been deleted.'
      );
      return 'cached';
    }
    appendLink(container, id, `No diagram with id ${id}. Check the link.`);
    return 'missing';
  }

  // `unavailable` — network, timeout, 5xx. Never a reason to lose a good copy.
  if (drewCached) {
    appendNote(container, 'Offline — showing your last copy.');
    return 'cached';
  }
  appendNote(
    container,
    'Offline, and this diagram has not been opened here before.'
  );
  return 'offline';
}
