/**
 * Manual page bookmark: user saves the current catalog page, later jumps
 * straight back to its URL (same tab, native pagination — safe at any depth,
 * no re-fetching). One bookmark per listing.
 */
import { isPaginationKey, stripPageSegment } from './routes';

export interface Bookmark {
  page: number;
  url: string;
}

const BOOKMARK_KEY = 'better_rule34_bookmarks_v1';

/**
 * Canonical key for a listing URL: pathname + sorted search minus page
 * params, minus trailing page-number path segments ("/2/").
 * Pure and unit-tested.
 */
export function canonicalListKey(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    for (const k of [...url.searchParams.keys()]) {
      if (isPaginationKey(k)) {
        url.searchParams.delete(k);
      }
    }

    let pathname = url.pathname;
    // Normalize root to /latest-updates/ as they represent the same catalog
    if (!pathname || pathname === '/') {
      pathname = '/latest-updates/';
    } else {
      // Strip trailing page-number path segments ("/2/") via shared helper.
      pathname = stripPageSegment(pathname);
    }

    if (pathname.length > 1 && !pathname.endsWith('/')) {
      pathname += '/';
    }

    const params = [...url.searchParams.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const qs = params.map(([k, v]) => `${k}=${v}`).join('&');
    return qs ? `${pathname}?${qs}` : pathname;
  } catch {
    return urlStr;
  }
}


export interface BookmarkStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function resolveStore(store?: BookmarkStore): BookmarkStore | null {
  if (store) return store;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Ignore (no storage available)
  }
  return null;
}

function readAll(store?: BookmarkStore): Record<string, Bookmark> {
  const s = resolveStore(store);
  if (!s) return {};
  try {
    const raw = s.getItem(BOOKMARK_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, Bookmark>;
  } catch {
    return {};
  }
}

export function getBookmark(key: string, store?: BookmarkStore): Bookmark | null {
  if (!key) return null;
  const bm = readAll(store)[key];
  if (!bm || typeof bm.page !== 'number' || typeof bm.url !== 'string' || !bm.url) return null;
  return bm;
}

export function setBookmark(key: string, bm: Bookmark, store?: BookmarkStore): void {
  const s = resolveStore(store);
  if (!s || !key || !bm.url || bm.page < 1) return;
  try {
    const all = readAll(store);
    all[key] = { page: bm.page, url: bm.url };
    s.setItem(BOOKMARK_KEY, JSON.stringify(all));
  } catch {
    // Ignore
  }
}

export function clearBookmark(key: string, store?: BookmarkStore): void {
  const s = resolveStore(store);
  if (!s || !key) return;
  try {
    const all = readAll(store);
    if (all[key]) {
      delete all[key];
      s.setItem(BOOKMARK_KEY, JSON.stringify(all));
    }
  } catch {
    // Ignore
  }
}

export interface BookmarkButtonOptions {
  /** The filter FAB element — adopted into the shared dock next to the button. */
  fab: HTMLElement;
  listKey: string;
  getPage: () => number;
  getUrl: () => string;
}

const BOOKMARK_SVG = `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 2h8v12l-4-3-4 3z"/></svg>`;

function refreshButton(btn: HTMLButtonElement, bm: Bookmark | null, curPage = 1): void {
  btn.classList.toggle('saved', Boolean(bm));
  if (!bm) {
    btn.title = `Bookmark page ${curPage} — click: save`;
  } else if (curPage < bm.page) {
    btn.title = `Bookmark at p.${bm.page} — click: jump to p.${bm.page}, right-click: remove`;
  } else if (curPage > bm.page) {
    btn.title = `Current p.${curPage} (saved p.${bm.page}) — click: update to p.${curPage}, right-click: remove`;
  } else {
    btn.title = `Bookmarked at p.${bm.page} — click: remove, right-click: remove`;
  }
  btn.setAttribute('aria-label', btn.title);
}

export interface BookmarkHandle {
  cleanup: () => void;
  refresh: () => void;
}

/**
 * Mounts the bookmark button in a fixed dock with the CTRL fab.
 * Click: save current page, or update if further, or jump if earlier, or toggle remove.
 * Right-click: remove.
 * Idempotent across repeat boots.
 */
export function mountBookmarkButton(opts: BookmarkButtonOptions): BookmarkHandle {
  let dock = document.querySelector<HTMLElement>('.br34-dock');
  if (!dock) {
    dock = document.createElement('div');
    dock.className = 'br34-dock';
    document.body.append(dock);
  }
  // Adopt the FAB into the dock (moves the node, listeners survive).
  dock.append(opts.fab);

  let btn = dock.querySelector<HTMLButtonElement>('.br34-bookmark-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'br34-bookmark-btn';
    btn.innerHTML = BOOKMARK_SVG;
    dock.prepend(btn);
  }
  const button = btn;

  const updateState = () => {
    refreshButton(button, getBookmark(opts.listKey), opts.getPage());
  };

  updateState();

  // Guard against duplicate listener binding on re-boot
  if (button.dataset.br34Wired === 'true') {
    return {
      cleanup: () => {},
      refresh: updateState,
    };
  }
  button.dataset.br34Wired = 'true';

  const onClick = () => {
    const existing = getBookmark(opts.listKey);
    const curPage = opts.getPage();
    const curUrl = opts.getUrl();

    if (!existing) {
      setBookmark(opts.listKey, { page: curPage, url: curUrl });
      updateState();
      return;
    }

    if (curPage < existing.page) {
      // User is earlier in catalog than bookmark -> jump to saved bookmark
      window.location.href = existing.url;
    } else if (curPage > existing.page) {
      // User progressed deeper in catalog -> update bookmark to current page
      setBookmark(opts.listKey, { page: curPage, url: curUrl });
      updateState();
    } else {
      // User is on bookmarked page and clicks again -> toggle remove
      clearBookmark(opts.listKey);
      updateState();
    }
  };

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    clearBookmark(opts.listKey);
    updateState();
  };

  button.addEventListener('click', onClick);
  button.addEventListener('contextmenu', onContextMenu);

  const cleanup = () => {
    button.removeEventListener('click', onClick);
    button.removeEventListener('contextmenu', onContextMenu);
    button.remove();
    delete button.dataset.br34Wired;
  };

  return {
    cleanup,
    refresh: updateState,
  };
}

