/**
 * Manual page bookmark: user saves the current catalog page, later jumps
 * straight back to its URL (same tab, native pagination — safe at any depth,
 * no re-fetching). One bookmark per listing.
 */

export interface Bookmark {
  page: number;
  url: string;
}

const BOOKMARK_KEY = 'better_rule34_bookmarks_v1';

/** Query params that encode pagination state and must not split listing keys. */
const PAGE_PARAMS = ['from', 'from_videos', 'from_photos', 'page'];

/**
 * Canonical key for a listing URL: pathname + sorted search minus page
 * params, minus trailing page-number path segments ("/2/").
 * Pure and unit-tested.
 */
export function canonicalListKey(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    for (const p of PAGE_PARAMS) url.searchParams.delete(p);
    let path = url.pathname.replace(/\/\d+\/?$/, '/');
    if (path.length > 1 && !path.endsWith('/')) path += '/';
    const params = [...url.searchParams.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const qs = params.map(([k, v]) => `${k}=${v}`).join('&');
    return qs ? `${path}?${qs}` : path;
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

function refreshButton(btn: HTMLButtonElement, bm: Bookmark | null): void {
  btn.classList.toggle('saved', Boolean(bm));
  btn.title = bm
    ? `Bookmark p.${bm.page} — click: jump back, right-click: remove`
    : 'Bookmark this page — click: save, click again: jump back';
  btn.setAttribute('aria-label', btn.title);
}

/**
 * Mounts the bookmark button in a fixed dock with the CTRL fab.
 * Click: save current page, or jump to the saved URL. Right-click: remove.
 * Idempotent across repeat boots. Returns cleanup (removes button only).
 */
export function mountBookmarkButton(opts: BookmarkButtonOptions): () => void {
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

  refreshButton(button, getBookmark(opts.listKey));

  const onClick = () => {
    const existing = getBookmark(opts.listKey);
    if (existing) {
      window.location.href = existing.url;
      return;
    }
    setBookmark(opts.listKey, { page: opts.getPage(), url: opts.getUrl() });
    refreshButton(button, getBookmark(opts.listKey));
  };
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    clearBookmark(opts.listKey);
    refreshButton(button, null);
  };

  button.addEventListener('click', onClick);
  button.addEventListener('contextmenu', onContextMenu);
  return () => {
    button.removeEventListener('click', onClick);
    button.removeEventListener('contextmenu', onContextMenu);
    button.remove();
  };
}
