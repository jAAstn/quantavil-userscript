import { describe, expect, it } from 'bun:test';

function fakeThumb(opts: {
  id?: string;
  cls?: string;
  res?: string;
  favs?: string;
  png?: boolean;
  href?: string;
  thumbUrl?: string;
}) {
  return {
    getAttribute: (k: string) => (k === 'data-wallpaper-id' ? opts.id || '' : null),
    className: opts.cls || '',
    querySelector: (sel: string) => {
      if (sel === 'a.preview') return opts.href || opts.id ? { href: opts.href || `https://wallhaven.cc/w/${opts.id}` } : null;
      if (sel === 'img') return { currentSrc: '', src: '', dataset: { src: opts.thumbUrl || '' }, getAttribute: () => opts.thumbUrl || '' };
      if (sel === '.thumb-info .wall-res') return opts.res ? { textContent: opts.res } : null;
      if (sel === '.thumb-info .wall-favs') return opts.favs != null ? { textContent: opts.favs } : null;
      if (sel === '.png') return opts.png ? {} : null;
      return null;
    },
  } as any;
}

describe('extractThumbMeta (zero-network)', () => {
  it('parses free listing fields without fetch', async () => {
    const { extractThumbMeta } = await import('../src/extract');
    const m = extractThumbMeta(
      fakeThumb({ id: 'jel1jq', cls: 'thumb thumb-jel1jq thumb-sfw thumb-general', res: '3840 x 2160', favs: '53', thumbUrl: 'https://th.wallhaven.cc/small/je/jel1jq.jpg' })
    );
    expect(m.id).toBe('jel1jq');
    expect(m.res).toBe('3840 x 2160');
    expect(m.favs).toBe('53');
    expect(m.category).toBe('General');
    expect(m.purity).toBe('SFW');
    expect(m.fileType).toBe('JPG');
    expect(m.thumbUrl).toContain('th.wallhaven.cc/small/je/jel1jq.jpg');
  });

  it('detects PNG badge and anime category', async () => {
    const { extractThumbMeta } = await import('../src/extract');
    const m = extractThumbMeta(
      fakeThumb({ id: '1qodm3', cls: 'thumb thumb-sfw thumb-anime', res: '5768 x 2688', favs: '48', png: true })
    );
    expect(m.fileType).toBe('PNG');
    expect(m.category).toBe('Anime');
  });

  it('derives lg/orig thumb URLs without requests', async () => {
    const { largerThumb } = await import('../src/extract');
    expect(largerThumb('https://th.wallhaven.cc/small/je/jel1jq.jpg', 'lg')).toBe('https://th.wallhaven.cc/lg/je/jel1jq.jpg');
    expect(largerThumb('https://th.wallhaven.cc/small/je/jel1jq.jpg', 'orig')).toBe('https://th.wallhaven.cc/orig/je/jel1jq.jpg');
    expect(largerThumb('', 'lg')).toBe('');
  });
});
