import { describe, expect, it, vi } from 'vitest';
import type { TFile } from 'obsidian';
import {
  DgmoEmbed,
  type DgmoEmbedHost,
  type EmbedDeps,
  createDgmoEmbedPostProcessor,
  isDgmoTarget,
  linkpathOf,
  renderEmbed,
} from '../src/embed';

function fileStub(path: string): TFile {
  const ext = path.includes('.') ? path.split('.').pop()! : '';
  return { path, extension: ext } as unknown as TFile;
}

describe('linkpathOf', () => {
  it.each([
    ['foo.dgmo', 'foo.dgmo'],
    ['dir/foo.dgmo', 'dir/foo.dgmo'],
    ['foo', 'foo'],
    ['foo.dgmo#frag', 'foo.dgmo'],
    ['foo.dgmo|alias', 'foo.dgmo'],
    ['  foo.dgmo  ', 'foo.dgmo'],
    ['foo.dgmo#frag|alias', 'foo.dgmo'],
  ])('%s → %s', (src, expected) => {
    expect(linkpathOf(src)).toBe(expected);
  });
});

describe('isDgmoTarget', () => {
  it.each([
    ['foo.dgmo', true],
    ['dir/foo.DGMO', true],
    ['foo.dgmo#frag', true],
    ['foo.dgmo|alias', true],
    ['foo', false],
    ['foo.md', false],
    ['foo.png', false],
    ['foo.pdf', false],
  ])('%s → %s', (src, expected) => {
    expect(isDgmoTarget(src)).toBe(expected);
  });
});

describe('renderEmbed', () => {
  it('reads the file then renders its content into the node', async () => {
    const node = document.createElement('div');
    const read = vi.fn().mockResolvedValue('flowchart\nA -> B');
    const render = vi.fn().mockResolvedValue(undefined);
    const d: EmbedDeps = {
      read,
      render,
      isDark: () => true,
      palette: () => 'nord',
    };
    const file = fileStub('foo.dgmo');

    await renderEmbed(node, file, d);

    expect(read).toHaveBeenCalledWith(file);
    expect(render).toHaveBeenCalledWith(
      'flowchart\nA -> B',
      node,
      true,
      'nord'
    );
    expect(node.classList.contains('dgmo-embed')).toBe(true);
  });

  it('shows an error card (and does not render) when the read fails', async () => {
    const node = document.createElement('div');
    const read = vi.fn().mockRejectedValue(new Error('EACCES'));
    const render = vi.fn().mockResolvedValue(undefined);
    const d: EmbedDeps = {
      read,
      render,
      isDark: () => false,
      palette: () => 'nord',
    };

    await renderEmbed(node, fileStub('foo.dgmo'), d);

    expect(render).not.toHaveBeenCalled();
    expect(node.querySelector('.dgmo--error')?.textContent).toContain('EACCES');
  });
});

describe('createDgmoEmbedPostProcessor', () => {
  function host(resolve: (linkpath: string) => TFile | null): {
    host: DgmoEmbedHost;
    added: DgmoEmbed[];
  } {
    const added: DgmoEmbed[] = [];
    return {
      added,
      host: {
        app: {
          metadataCache: { getFirstLinkpathDest: (lp: string) => resolve(lp) },
          vault: { cachedRead: vi.fn() },
        } as unknown as DgmoEmbedHost['app'],
        getPalette: () => 'nord',
        isDark: () => false,
        registerEmbed: () => {},
        unregisterEmbed: () => {},
      },
    };
  }

  function embedSpan(src: string): HTMLElement {
    const span = document.createElement('span');
    span.className = 'internal-embed';
    span.setAttribute('src', src);
    return span;
  }

  function run(host: DgmoEmbedHost, nodes: HTMLElement[]) {
    const el = document.createElement('div');
    nodes.forEach((n) => el.appendChild(n));
    const added: DgmoEmbed[] = [];
    const ctx = {
      sourcePath: 'notes/host.md',
      addChild: (c: DgmoEmbed) => added.push(c),
    };
    void createDgmoEmbedPostProcessor(host)(
      el,
      ctx as unknown as Parameters<
        ReturnType<typeof createDgmoEmbedPostProcessor>
      >[1]
    );
    return added;
  }

  it('claims a resolvable .dgmo embed', () => {
    const { host: h } = host((lp) => fileStub(lp));
    const added = run(h, [embedSpan('foo.dgmo')]);
    expect(added).toHaveLength(1);
    expect(added[0]!.filePath).toBe('foo.dgmo');
  });

  it('claims a bare name that resolves to a .dgmo file', () => {
    const { host: h } = host(() => fileStub('diagrams/foo.dgmo'));
    const added = run(h, [embedSpan('foo')]);
    expect(added).toHaveLength(1);
    expect(added[0]!.filePath).toBe('diagrams/foo.dgmo');
  });

  it('claims an unresolved .dgmo target (to show a not-found card)', () => {
    const { host: h } = host(() => null);
    const added = run(h, [embedSpan('missing.dgmo')]);
    expect(added).toHaveLength(1);
    expect(added[0]!.filePath).toBeNull();
  });

  it('ignores non-.dgmo embeds (md/img/pdf)', () => {
    const { host: h } = host((lp) => fileStub(lp));
    const added = run(h, [
      embedSpan('note.md'),
      embedSpan('pic.png'),
      embedSpan('doc.pdf'),
    ]);
    expect(added).toHaveLength(0);
  });

  it('ignores a bare name that resolves to a non-.dgmo file', () => {
    const { host: h } = host(() => fileStub('note.md'));
    const added = run(h, [embedSpan('note')]);
    expect(added).toHaveLength(0);
  });
});
