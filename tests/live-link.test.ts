// Live links in a note (BL-144) — one case per row of the outcome table.
//
// 🔴 The default path is exercised, not just the injected one. Every test of the
// browser half of this feature passed for its whole lifetime while the feature
// threw `Illegal invocation` in every release, because every test injected a
// `vi.fn()` — a plain function with no opinion about `this` — and the throw
// landed in a catch that reads any failure as "offline". So the adapter is
// driven through the real `requestUrl` shape, including the two defaults that
// bite: it THROWS on 400+ unless told not to, and its `json`/`text` are
// properties rather than methods.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __setRequestUrlHandler } from './__mocks__/obsidian';
import {
  renderLiveLink,
  requestUrlFetch,
  liveLinkId,
  PluginFolderStore,
  type LiveLinkCacheMap,
  type LiveLinkStore,
} from '../src/render/live-link';

const ID = 'dgm_01KYRFCJZ2BHS18XRBEAZ0Y120';
const SOURCE = 'pie Treasure\nGold 60\nSilver 40';
const OLDER = 'pie Treasure\nGold 50\nSilver 50';

function memoryStore(initial: LiveLinkCacheMap = {}): LiveLinkStore & {
  map: LiveLinkCacheMap;
} {
  return {
    map: { ...initial },
    async read() {
      return this.map;
    },
    async write(next: LiveLinkCacheMap) {
      this.map = next;
    },
  };
}

function cacheOf(source: string): LiveLinkCacheMap {
  return {
    [ID]: { source, dgmoVersion: '0.60.0', updatedAt: 1, fetchedAt: 2 },
  };
}

/** A container plus a record of what got drawn into it. */
function harness(
  store: LiveLinkStore,
  opts: Partial<{ enabled: boolean }> = {}
) {
  const container = document.createElement('div');
  const drawn: string[] = [];
  return {
    container,
    drawn,
    ctx: {
      store,
      enabled: opts.enabled ?? true,
      draw: async (s: string) => {
        container.replaceChildren();
        drawn.push(s);
      },
      drawCard: async () => {
        container.replaceChildren();
        drawn.push('<card>');
      },
      now: () => 1000,
    },
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

beforeEach(() => {
  __setRequestUrlHandler(null);
});

describe('liveLinkId — which fences are pointers', () => {
  it('reads all three spellings', () => {
    expect(liveLinkId(`live-link ${ID}`)).toBe(ID);
    expect(liveLinkId(`https://online.diagrammo.app/d/${ID}`)).toBe(ID);
    expect(liveLinkId(`![[live-link:${ID}]]`)).toBe(ID);
  });

  it('reads the titled form through its url line', () => {
    expect(
      liveLinkId(
        `live-link Platform architecture\nurl https://online.diagrammo.app/d/${ID}`
      )
    ).toBe(ID);
    expect(liveLinkId(`live-link Platform architecture\nurl ${ID}`)).toBe(ID);
  });

  it('leaves an ordinary diagram alone', () => {
    expect(liveLinkId('pie Treasure\nGold 60')).toBeNull();
    expect(liveLinkId('sequence A\nA -> B hello')).toBeNull();
    // A comment before the declaration must not hide it.
    expect(liveLinkId(`// a note\nlive-link ${ID}`)).toBe(ID);
  });
});

describe('renderLiveLink — the outcome table', () => {
  it('a cold open draws the card first, then the diagram', async () => {
    const store = memoryStore();
    const h = harness(store);
    const r = await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: async () => json({ source: SOURCE, updatedAt: 7 }),
    });
    expect(r).toBe('drawn');
    // The card is not an error state — it is what a pointer looks like before
    // it resolves, and the reader should never see an empty box.
    expect(h.drawn).toEqual(['<card>', SOURCE]);
    expect(store.map[ID]?.source).toBe(SOURCE);
    expect(store.map[ID]?.fetchedAt).toBe(1000);
  });

  it('a warm open draws the cached copy BEFORE any fetch', async () => {
    const store = memoryStore(cacheOf(OLDER));
    const h = harness(store);
    let drawnBeforeFetch: string[] = [];
    await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: async () => {
        drawnBeforeFetch = [...h.drawn];
        return json({ source: SOURCE, updatedAt: 9 });
      },
    });
    expect(drawnBeforeFetch).toEqual([OLDER]);
    expect(h.drawn).toEqual([OLDER, SOURCE]);
  });

  it('an unchanged diagram is not redrawn', async () => {
    const store = memoryStore(cacheOf(SOURCE));
    const h = harness(store);
    await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: async () => json({ source: SOURCE, updatedAt: 9 }),
    });
    expect(h.drawn).toEqual([SOURCE]);
  });

  it('offline with a copy keeps the copy and says so', async () => {
    const store = memoryStore(cacheOf(OLDER));
    const h = harness(store);
    const r = await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: () => Promise.reject(new Error('no route to host')),
    });
    expect(r).toBe('cached');
    expect(h.drawn).toEqual([OLDER]);
    expect(h.container.textContent).toContain('showing your last copy');
    // A failed fetch must never cost the reader a good diagram.
    expect(store.map[ID]?.source).toBe(OLDER);
  });

  it('offline with no copy draws the card and names being offline', async () => {
    const h = harness(memoryStore());
    const r = await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: () => Promise.reject(new Error('no route to host')),
    });
    expect(r).toBe('offline');
    expect(h.container.textContent).toContain('Offline');
  });

  it('404 with a copy keeps the copy', async () => {
    const store = memoryStore(cacheOf(OLDER));
    const h = harness(store);
    const r = await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: async () => new Response('', { status: 404 }),
    });
    expect(r).toBe('cached');
    expect(h.container.textContent).toContain('no longer resolves');
    expect(store.map[ID]).toBeDefined();
  });

  it('404 with no copy names the id, because it can only be a typo', async () => {
    const h = harness(memoryStore());
    const r = await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: async () => new Response('', { status: 404 }),
    });
    expect(r).toBe('missing');
    expect(h.container.textContent).toContain(ID);
  });

  it('🔴 410 refuses the cache AND deletes it', async () => {
    // The rule this file exists to protect. The author took the diagram back;
    // a local copy must not outlive that decision.
    const store = memoryStore(cacheOf(OLDER));
    const h = harness(store);
    const r = await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: async () => new Response('', { status: 410 }),
    });
    expect(r).toBe('tombstone');
    expect(h.drawn[h.drawn.length - 1]).toBe('<card>');
    expect(h.container.textContent).toContain('unshared by its author');
    expect(store.map[ID]).toBeUndefined();
  });

  it('turned off: the card, no request, and the cache is left alone', async () => {
    const store = memoryStore(cacheOf(OLDER));
    const fetchImpl = vi.fn();
    const h = harness(store, { enabled: false });
    const r = await renderLiveLink(ID, h.container, {
      ...h.ctx,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r).toBe('disabled');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(store.map[ID]?.source).toBe(OLDER);
  });
});

describe('requestUrlFetch — the adapter, against the real requestUrl shape', () => {
  it('passes throw:false, so a 410 arrives as a status and not an exception', async () => {
    let seen: { throw?: boolean } | null = null;
    __setRequestUrlHandler(async (p) => {
      seen = p;
      return { status: 410, headers: {}, text: '', json: null };
    });
    const res = await requestUrlFetch()('https://api.diagrammo.app/x');
    expect(seen).toMatchObject({ throw: false });
    expect(res.status).toBe(410);
  });

  it('without throw:false the mock throws — proving the guard above is load-bearing', async () => {
    __setRequestUrlHandler(async () => ({
      status: 410,
      headers: {},
      text: '',
      json: null,
    }));
    const { requestUrl } = await import('./__mocks__/obsidian');
    await expect(
      requestUrl({ url: 'https://api.diagrammo.app/x' })
    ).rejects.toThrow('status 410');
  });

  it('reads `text` as a property and hands back a real Response', async () => {
    __setRequestUrlHandler(async () => ({
      status: 200,
      headers: {},
      text: JSON.stringify({ source: SOURCE }),
      json: { source: SOURCE },
    }));
    const res = await requestUrlFetch()('https://api.diagrammo.app/x');
    await expect(res.json()).resolves.toEqual({ source: SOURCE });
  });

  it('🔴 imposes its own deadline, because requestUrl cannot be aborted', async () => {
    vi.useFakeTimers();
    try {
      __setRequestUrlHandler(
        () => new Promise(() => {}) // never settles, like a hung socket
      );
      const pending = requestUrlFetch(50)('https://api.diagrammo.app/x');
      await vi.advanceTimersByTimeAsync(60);
      const res = await pending;
      // 504, so it reads as `unavailable` — "not right now", never "gone".
      expect(res.status).toBe(504);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('PluginFolderStore', () => {
  const io = (files: Record<string, string>) => ({
    files,
    read: async (p: string) => files[p] ?? '',
    write: async (p: string, d: string) => void (files[p] = d),
    exists: async (p: string) => p in files,
  });

  it('reads the file once and serves later reads from memory', async () => {
    const f = io({ 'x/cache.json': JSON.stringify(cacheOf(SOURCE)) });
    const reads: string[] = [];
    const store = new PluginFolderStore(
      { ...f, read: async (p) => (reads.push(p), f.read(p)) },
      'x/cache.json'
    );
    await store.read();
    await store.read();
    expect(reads).toHaveLength(1);
  });

  it('a corrupt file is treated as absent, never as a failure', async () => {
    const store = new PluginFolderStore(
      io({ 'x/cache.json': '{{{' }),
      'x/cache.json'
    );
    await expect(store.read()).resolves.toEqual({});
  });

  it('🔴 a null path degrades to memory — manifest.dir is OPTIONAL', async () => {
    const store = new PluginFolderStore(io({}), null);
    await store.write(cacheOf(SOURCE));
    await expect(store.read()).resolves.toEqual(cacheOf(SOURCE));
  });

  it('a write failure costs a refetch, never a render', async () => {
    const store = new PluginFolderStore(
      {
        read: async () => '',
        exists: async () => false,
        write: () => Promise.reject(new Error('read-only vault')),
      },
      'x/cache.json'
    );
    await expect(store.write(cacheOf(SOURCE))).resolves.toBeUndefined();
  });
});
