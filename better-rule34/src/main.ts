import { cleanAds } from './adcleaner';
import { AutoPager, findVideosContainer, isListingPage, unclipBodyOverflow } from './autopager';
import { canonicalListKey, mountBookmarkButton, type BookmarkHandle } from './bookmark';
import { FilterBar } from './filterbar';
import { hardenAnchor, hardenAnchorsIn, initNewTab, isWatchedId } from './newtab';
import { initNativeFilterPanel } from './nativefilter';
import { extractCardData, isAdCard, matchesClientFilter } from './parse';
import { CSS } from './styles';
import type { CardData, FilterState } from './types';

interface ManagedCard {
  el: HTMLElement;
  data: CardData;
}

let managedCards: ManagedCard[] = [];
let filterBar: FilterBar | null = null;
let autoPager: AutoPager | null = null;
let currentFilter: FilterState | null = null;
let bookmarkHandle: BookmarkHandle | null = null;

function injectStyles(): void {
  if (document.getElementById('br34-styles')) return;
  const style = document.createElement('style');
  style.id = 'br34-styles';
  style.textContent = CSS;
  (document.head || document.documentElement).append(style);
}

/** Overlay own click-history onto site watched flags (site marks unreliably). */
function applyOwnWatched(el: HTMLElement, data: CardData): void {
  if (data.id && isWatchedId(data.id)) {
    data.isWatched = true;
    el.classList.add('watched');
  }
}

function scanCards(): void {
  const container = findVideosContainer();
  if (!container) return;

  cleanAds(container);

  const existingMap = new Map<HTMLElement, ManagedCard>();
  for (const c of managedCards) {
    existingMap.set(c.el, c);
  }

  const updatedCards: ManagedCard[] = [];
  const cardElements = container.querySelectorAll<HTMLElement>('.item.thumb');

  for (const el of cardElements) {
    if (isAdCard(el)) {
      el.remove();
      continue;
    }

    const existing = existingMap.get(el);
    if (existing) {
      applyOwnWatched(existing.el, existing.data);
      updatedCards.push(existing);
      continue;
    }

    const data = extractCardData(el);
    if (data) {
      applyOwnWatched(el, data);
      updatedCards.push({ el, data });
    }
  }

  managedCards = updatedCards;
}

function applyFilter(): void {
  if (!currentFilter) return;

  let visibleCount = 0;
  for (const card of managedCards) {
    const isVisible = matchesClientFilter(card.data, currentFilter);
    card.el.dataset.br34Hidden = isVisible ? 'false' : 'true';
    if (isVisible) visibleCount++;
  }

  filterBar?.setCount(visibleCount, managedCards.length);
}

function boot(): void {
  injectStyles();
  unclipBodyOverflow();
  cleanAds();
  hardenAnchorsIn(document);
  initNewTab(document);

  // Watch pages: new-tab hardening only, no console/pager/bookmark.
  if (!isListingPage()) return;

  const container = findVideosContainer();
  if (!container) return;

  // Collapse the bulky native filter panel (default collapsed, idempotent).
  initNativeFilterPanel();

  const listKey = canonicalListKey(window.location.href);

  // Mount floating filter bar (FAB + Seductive Modal)
  if (!filterBar || !filterBar.fabElement.isConnected) {
    filterBar?.destroy();

    filterBar = new FilterBar({
      onFilterChange: (state) => {
        currentFilter = state;
        applyFilter();
      },
    });

    currentFilter = filterBar.getState();
  }

  // Scan currently existing video cards
  scanCards();

  // Initialize AutoPager
  if (!autoPager) {
    autoPager = new AutoPager({
      onNewCards: (newEls) => {
        for (const el of newEls) {
          for (const a of el.querySelectorAll<HTMLAnchorElement>('a[href*="/video/"]')) {
            hardenAnchor(a);
          }
          const data = extractCardData(el);
          if (data) {
            applyOwnWatched(el, data);
            managedCards.push({ el, data });
          } else {
            // Unidentifiable card (no video id): drop instead of tracking.
            el.remove();
          }
        }
        applyFilter();
      },
      onPageLoaded: () => {
        cleanAds();
        unclipBodyOverflow();
        initNativeFilterPanel();
        bookmarkHandle?.refresh();
      },
    });
    autoPager.init();
  }

  applyFilter();

  // Bookmark button docked next to the CTRL fab (idempotent on re-boot).
  if (filterBar && autoPager) {
    const pager = autoPager;
    bookmarkHandle = mountBookmarkButton({
      fab: filterBar.fabElement,
      listKey,
      getPage: () => pager.getCurrentPage(),
      getUrl: () => pager.getCurrentPageUrl(),
    });
  }
}

// Watch for DOM mutations
let scheduledTimer = 0;
function scheduleScan(): void {
  window.clearTimeout(scheduledTimer);
  scheduledTimer = window.setTimeout(() => {
    unclipBodyOverflow();
    cleanAds();
    initNativeFilterPanel();
    scanCards();
    applyFilter();
  }, 200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot();
  });
} else {
  boot();
}

// Ensure overflow:hidden wrapper is neutralized when jQuery ready fires
window.addEventListener('load', () => {
  unclipBodyOverflow();
  boot();
});

const observer = new MutationObserver((mutations) => {
  // If AutoPager is currently appending handled cards, skip redundant full DOM rescan
  if (autoPager?.getIsAppending()) return;

  let shouldScan = false;
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node instanceof HTMLElement) {
        if (node.classList.contains('item') || node.querySelector?.('.item.thumb')) {
          shouldScan = true;
          break;
        }
      }
    }
    if (shouldScan) break;
  }
  if (shouldScan) {
    scheduleScan();
  }
});

observer.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true,
});
