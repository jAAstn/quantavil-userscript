import { describe, expect, it } from 'bun:test';
import {
  canonicalListKey,
  clearBookmark,
  getBookmark,
  setBookmark,
  type BookmarkStore,
} from '../src/bookmark';
import { shouldNewTabClick } from '../src/newtab';
import { videoIdFromHref, viewsToNearestStep } from '../src/parse';

function memStore(): BookmarkStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const origin = 'https://rule34video.com';

describe('videoIdFromHref', () => {
  it('extracts numeric ids and rejects non-video hrefs', () => {
    expect(videoIdFromHref('/video/12345/slug/')).toBe('12345');
    expect(videoIdFromHref(`${origin}/video/987/`)).toBe('987');
    expect(videoIdFromHref('/latest-updates/2/')).toBe('');
    expect(videoIdFromHref('')).toBe('');
  });
});

describe('viewsToNearestStep', () => {
  const steps = [0, 1000, 5000, 10000, 25000, 50000, 100000];
  it('snaps exact, near, and migrated values to the closest step', () => {
    expect(viewsToNearestStep(5000, steps)).toBe(2);
    expect(viewsToNearestStep(90000, steps)).toBe(6);
    expect(viewsToNearestStep(1000000, steps)).toBe(6);
    expect(viewsToNearestStep(0, steps)).toBe(0);
  });
});

describe('shouldNewTabClick', () => {
  it('intercepts only plain left-clicks', () => {
    const plain = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
    expect(shouldNewTabClick(plain)).toBe(true);
    expect(shouldNewTabClick({ ...plain, button: 1 })).toBe(false);
    expect(shouldNewTabClick({ ...plain, ctrlKey: true })).toBe(false);
    expect(shouldNewTabClick({ ...plain, metaKey: true })).toBe(false);
    expect(shouldNewTabClick({ ...plain, shiftKey: true })).toBe(false);
  });
});

describe('canonicalListKey', () => {
  it('strips page params and trailing page segments, sorts the rest', () => {
    expect(canonicalListKey(`${origin}/latest-updates/3/?from_videos=3`)).toBe('/latest-updates/');
    expect(canonicalListKey(`${origin}/search/?q=a&from_videos=48&q=a`)).toBe('/search/?q=a&q=a');
    expect(canonicalListKey(`${origin}/tags/futa/2/`)).toBe('/tags/futa/');
  });
});

describe('bookmark store', () => {
  it('round-trips one bookmark per listing key', () => {
    const store = memStore();
    expect(getBookmark('/latest-updates/', store)).toBeNull();
    setBookmark('/latest-updates/', { page: 4, url: `${origin}/latest-updates/4/` }, store);
    expect(getBookmark('/latest-updates/', store)).toEqual({
      page: 4,
      url: `${origin}/latest-updates/4/`,
    });
    // Other listings are independent
    expect(getBookmark('/search/?q=a', store)).toBeNull();
    clearBookmark('/latest-updates/', store);
    expect(getBookmark('/latest-updates/', store)).toBeNull();
  });

  it('rejects invalid bookmarks', () => {
    const store = memStore();
    setBookmark('/x/', { page: 0, url: `${origin}/x/` }, store);
    setBookmark('/x/', { page: 2, url: '' }, store);
    setBookmark('', { page: 2, url: `${origin}/x/` }, store);
    expect(getBookmark('/x/', store)).toBeNull();
  });
});
