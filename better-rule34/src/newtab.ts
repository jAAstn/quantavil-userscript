import { videoIdFromHref } from './parse';

const WATCHED_KEY = 'better_rule34_watched_v1';
const MAX_WATCHED = 2000;

function readWatchedIds(): string[] {
  try {
    const raw = localStorage.getItem(WATCHED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

/**
 * In-memory cache so per-card scans don't re-parse localStorage for every
 * card. Invalidated/updated by markWatched; call invalidateWatchedCache() if
 * storage is ever written from outside this module.
 */
let cachedIds: Set<string> | null = null;

export function invalidateWatchedCache(): void {
  cachedIds = null;
}

/** Ordered set of clicked video ids (oldest first). Persisted for UNWATCHED filtering. */
export function getWatchedIds(): Set<string> {
  if (!cachedIds) cachedIds = new Set(readWatchedIds());
  return cachedIds;
}

export function isWatchedId(id: string): boolean {
  if (!id) return false;
  return getWatchedIds().has(id);
}

export function markWatched(id: string): void {
  if (!id) return;
  try {
    const ids = readWatchedIds().filter((v) => v !== id);
    ids.push(id);
    while (ids.length > MAX_WATCHED) ids.shift();
    localStorage.setItem(WATCHED_KEY, JSON.stringify(ids));
    // Keep the scan cache in sync without forcing a re-parse.
    if (cachedIds) {
      cachedIds.delete(id);
      cachedIds.add(id);
      while (cachedIds.size > MAX_WATCHED) {
        const oldest = cachedIds.values().next();
        if (oldest.done) break;
        cachedIds.delete(oldest.value);
      }
    }
  } catch {
    // Ignore (private mode quota etc.)
  }
}

/** Closest video anchor for a click target, or null outside cards. */
export function findVideoAnchor(from: HTMLElement | null): HTMLAnchorElement | null {
  if (!from) return null;
  const anchor = from.closest?.('a[href*="/video/"]');
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (!/\/video\//.test(anchor.getAttribute('href') || '')) return null;
  return anchor;
}

/** Progressive enhancement so middle-click / long-press / no-JS-open all land in a new tab. */
export function hardenAnchor(a: HTMLAnchorElement): void {
  if (a.target !== '_blank') a.target = '_blank';
  const rel = (a.getAttribute('rel') || '').toLowerCase();
  if (!rel.includes('noopener')) {
    a.setAttribute('rel', (rel ? `${rel} ` : '') + 'noopener');
  }
}

export function hardenAnchorsIn(root: ParentNode): void {
  const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]');
  for (const a of anchors) hardenAnchor(a);
}

interface ClickModifiers {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Pure decision: intercept only plain left-clicks.
 * Middle-click and Ctrl/Cmd-click already open new tabs natively and must
 * keep default behavior (and must not double-open via window.open).
 */
export function shouldNewTabClick(e: ClickModifiers): boolean {
  return e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
}

/**
 * Delegated handler: plain left-click on a card link opens the video in a
 * new tab and records the id as watched; middle-click keeps its native
 * new-tab behavior and only records the id. Returns the cleanup function.
 * Idempotent — repeat boots reuse the single document listener.
 */
let newTabWired = false;
export function initNewTab(scope: ParentNode = document): () => void {
  hardenAnchorsIn(scope);
  if (newTabWired) return () => {};
  newTabWired = true;
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target || !(target instanceof Element)) return;
    const anchor = findVideoAnchor(target as HTMLElement);
    if (!anchor) return;
    hardenAnchor(anchor);
    if (!shouldNewTabClick(e)) return;
    const href = anchor.getAttribute('href') || anchor.href;
    if (!href) return;
    e.preventDefault();
    e.stopPropagation();
    markWatched(videoIdFromHref(href));
    window.open(anchor.href, '_blank', 'noopener');
  };
  const onAuxClick = (e: MouseEvent) => {
    if (e.button !== 1) return;
    const target = e.target as HTMLElement | null;
    if (!target || !(target instanceof Element)) return;
    const anchor = findVideoAnchor(target as HTMLElement);
    if (!anchor) return;
    const href = anchor.getAttribute('href') || anchor.href;
    if (!href) return;
    markWatched(videoIdFromHref(href));
  };

  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onAuxClick, true);
  return () => {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('auxclick', onAuxClick, true);
  };
}
