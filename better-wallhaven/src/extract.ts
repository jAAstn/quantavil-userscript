export interface ThumbMeta {
  id: string;
  pageUrl: string;
  thumbUrl: string;
  res: string;
  favs: string;
  category: string;
  purity: string;
  fileType: string;
}

/** Zero-network parse: everything in this object comes from the already-loaded listing DOM. */
export function extractThumbMeta(thumb: HTMLElement): ThumbMeta {
  const id = thumb.getAttribute('data-wallpaper-id') || '';
  const link = thumb.querySelector('a.preview') as HTMLAnchorElement | null;
  const img = thumb.querySelector('img') as HTMLImageElement | null;
  const resEl = thumb.querySelector('.thumb-info .wall-res');
  const favEl = thumb.querySelector('.thumb-info .wall-favs');

  const cls = thumb.className || '';
  const category = cls.includes('thumb-anime')
    ? 'Anime'
    : cls.includes('thumb-people')
      ? 'People'
      : cls.includes('thumb-general')
        ? 'General'
        : '';
  const purity = cls.includes('thumb-nsfw')
    ? 'NSFW'
    : cls.includes('thumb-sketchy')
      ? 'Sketchy'
      : cls.includes('thumb-sfw')
        ? 'SFW'
        : '';

  const isPng = !!thumb.querySelector('.png');
  const thumbUrl = (img && (img.currentSrc || img.src || img.dataset.src)) || (img && img.getAttribute('data-src')) || '';

  return {
    id,
    pageUrl: (link && link.href) || (id ? `https://wallhaven.cc/w/${id}` : ''),
    thumbUrl,
    res: resEl ? resEl.textContent?.trim() || '' : '',
    favs: favEl ? favEl.textContent?.replace(/[^\d]/g, '').trim() || '0' : '0',
    category,
    purity,
    fileType: isPng ? 'PNG' : 'JPG',
  };
}

/** Derive larger thumb CDN URLs without any request. Costs data only if actually loaded. */
export function largerThumb(thumbUrl: string, kind: 'lg' | 'orig'): string {
  if (!thumbUrl || !thumbUrl.includes('/small/')) return thumbUrl;
  return thumbUrl.replace('/small/', kind === 'lg' ? '/lg/' : '/orig/');
}
