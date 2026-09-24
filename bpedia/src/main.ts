import { GM_xmlhttpRequest } from '$';
import './style.css';
import { PerformerProfile } from './types';
import { Cache } from './cache';
import { parseProfileHtml, extractPerformerName } from './parser';
import { ProgressBar } from './ui/progress';
import { FilterPanel } from './ui/filterPanel';

// In-memory profile store for the current page view
const pageProfiles = new Map<string, PerformerProfile>();

// Scraper queue
interface QueueItem {
  url: string;
  name: string;
}

const scrapeQueue: QueueItem[] = [];
const queuedUrls = new Set<string>(); // O(1) dedup instead of O(n) .some()
let isScraping = false;
// Append-only counters for a page view: the "done/total" display
// only moves forward and the total never shrinks on refresh.
let totalToScrape = 0;
let scrapedCount = 0;
const CONCURRENCY = 4;
let activeCount = 0;
const DISPATCH_GAP_MS = 60;
let nextDispatchAt = 0;
let consecutiveFailures = 0;
let cooldownUntil = 0;
const MAX_RETRIES = 3;
const itemRetries = new Map<string, number>();

// Coalesce rapid filter/tag updates into a single frame
function coalesce(run: () => void): () => void {
  let pending = 0;
  return () => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      run();
    });
  };
}

const scheduleFilterApply = coalesce(() => {
  FilterPanel.applyFiltersToPage(pageProfiles);
});

const scheduleTagRefresh = coalesce(() => {
  FilterPanel.populateDynamicTags(pageProfiles);
  scheduleFilterApply();
});

function main() {
  Cache.initDbCache();
  const thumbsContainer = document.getElementById('thumbs');
  if (!thumbsContainer) return;

  // Init UI
  FilterPanel.init(() => {
    FilterPanel.applyFiltersToPage(pageProfiles);
  });
  ProgressBar.init();

  // Process initial thumbnails
  thumbsContainer.querySelectorAll('.thumbshot').forEach((thumb) => {
    processThumbshot(thumb as HTMLElement);
  });

  startQueueProcessor();

  // Initial tag + filter pass (single pass, not double)
  FilterPanel.populateDynamicTags(pageProfiles);
  FilterPanel.applyFiltersToPage(pageProfiles);

  setupAutoPagerObserver(thumbsContainer);
  window.addEventListener('pagehide', () => {
    Cache.flushFilterSettings();
  });
}

function processThumbshot(thumb: HTMLElement): void {
  const anchor = thumb.querySelector('a');
  if (!anchor) return;

  const url = anchor.getAttribute('href');
  if (!url) return;

  const name = extractPerformerName(thumb, anchor);
  thumb.setAttribute('data-bp-name', name);

  // Check cache first
  const cached = Cache.getProfile(url);
  if (cached) {
    pageProfiles.set(url, cached);
  } else {
    enqueueThumb(url, name);
  }
}

/**
 * Queue a profile for scraping. The total only ever grows here —
 * retries reuse their original slot — so "done/total" never shrinks.
 */
function enqueueThumb(url: string, name: string): void {
  if (queuedUrls.has(url)) return;
  queuedUrls.add(url);
  scrapeQueue.push({ url, name });
  totalToScrape++;
  if (isScraping) ProgressBar.update(scrapedCount, totalToScrape);
}

function startQueueProcessor(): void {
  if (isScraping || scrapeQueue.length === 0) return;

  isScraping = true;

  ProgressBar.show();
  ProgressBar.update(scrapedCount, totalToScrape);
  pumpQueue();
}

/** Requeue (keeping the original total slot) with backoff, or give up after MAX_RETRIES. */
function handleRetryable(item: QueueItem, errorMsg: string): void {
  consecutiveFailures++;
  console.warn(errorMsg);
  cooldownUntil = Date.now() + Math.min(10000, consecutiveFailures * 3000);
  const retries = itemRetries.get(item.url) || 0;
  if (retries < MAX_RETRIES) {
    itemRetries.set(item.url, retries + 1);
    scrapeQueue.push(item);
  } else {
    console.error(`[BP] Max retries reached for ${item.name}. Skipping.`);
    itemRetries.delete(item.url);
    queuedUrls.delete(item.url);
    scrapedCount++;
    ProgressBar.update(scrapedCount, totalToScrape);
  }
}

/** Permanent failure: count it done so the counter keeps moving forward. */
function handleTerminal(item: QueueItem, errorMsg: string): void {
  console.warn(errorMsg);
  queuedUrls.delete(item.url);
  itemRetries.delete(item.url);
  scrapedCount++;
  ProgressBar.update(scrapedCount, totalToScrape);
}

/**
 * Parallel queue pump: keeps up to CONCURRENCY requests in flight with
 * dispatch starts spaced by DISPATCH_GAP_MS. A 429/503/403 (or network
 * error) parks the pump in a cooldown instead of hammering the site.
 */
function pumpQueue(): void {
  if (!isScraping) return;

  const now = Date.now();
  if (now < cooldownUntil) {
    setTimeout(() => {
      if (isScraping) pumpQueue();
    }, cooldownUntil - now);
    return;
  }

  while (activeCount < CONCURRENCY && scrapeQueue.length > 0) {
    const item = scrapeQueue.shift();
    if (!item) break;

    // Double-check cache: may have been stored while queued
    const cached = Cache.getProfile(item.url);
    if (cached) {
      queuedUrls.delete(item.url);
      pageProfiles.set(item.url, cached);
      scrapedCount++;
      ProgressBar.update(scrapedCount, totalToScrape);
      // Don't apply filters per-item during bulk scrape — coalesce
      scheduleFilterApply();
      continue;
    }

    activeCount++;
    const delay = Math.max(0, nextDispatchAt - Date.now());
    nextDispatchAt = Date.now() + delay + DISPATCH_GAP_MS;
    setTimeout(() => {
      try {
        dispatchItem(item);
      } catch (e) {
        // Synchronous dispatch failure: reclaim the slot, retry via normal path
        activeCount--;
        handleRetryable(item, `[BP] Dispatch failed for ${item.name}: ${e}`);
        pumpQueue();
      }
    }, delay);
  }

  if (scrapeQueue.length === 0 && activeCount === 0) {
    isScraping = false;
    ProgressBar.hide();
    // Final refresh after all scraping completes
    scheduleTagRefresh();
  }
}

function dispatchItem(item: QueueItem): void {
  const targetUrl = item.url.startsWith('http') ? item.url : window.location.origin + item.url;

  GM_xmlhttpRequest({
    method: 'GET',
    url: targetUrl,
    timeout: 30000,
    onload: (response: any) => {
      activeCount--;
      if (response.status === 200) {
        consecutiveFailures = 0;
        cooldownUntil = 0;
        try {
          const profile = parseProfileHtml(response.responseText, item.url, item.name);
          Cache.setProfile(item.url, profile);
          pageProfiles.set(item.url, profile);

          // Coalesced: schedule a single tag+filter refresh per frame
          scheduleTagRefresh();
        } catch (e) {
          console.error(`[BP] Parse error for ${item.name}:`, e);
        }
        itemRetries.delete(item.url);
        queuedUrls.delete(item.url);
        scrapedCount++;
        ProgressBar.update(scrapedCount, totalToScrape);
      } else if (response.status === 429 || response.status === 503 || response.status === 403) {
        handleRetryable(item, `[BP] Rate limited or blocked (${response.status}) for ${item.name}.`);
      } else {
        handleTerminal(item, `[BP] Fetch failed for ${item.name}: ${response.status}`);
      }
      pumpQueue();
    },
    onerror: (err: any) => onRequestFailed(item, `[BP] Network error for ${item.name}: ${err}`),
    ontimeout: () => onRequestFailed(item, `[BP] Timeout after 30s for ${item.name}.`)
  });
}

/** Shared failure path for onerror/ontimeout: reclaim slot, back off, re-pump. */
function onRequestFailed(item: QueueItem, errorMsg: string): void {
  activeCount--;
  handleRetryable(item, errorMsg);
  pumpQueue();
}

function setupAutoPagerObserver(thumbsContainer: HTMLElement): void {
  const observer = new MutationObserver((mutations) => {
    let added = false;

    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as HTMLElement;

        if (el.classList.contains('thumbshot')) {
          processThumbshot(el);
          added = true;
        } else {
          el.querySelectorAll('.thumbshot').forEach((inner) => {
            processThumbshot(inner as HTMLElement);
            added = true;
          });
        }
      }
    }

    if (added) {
      // Immediately show badges for cached profiles
      scheduleFilterApply();

      // Resume the pump if new work arrived; totals only grow via enqueueThumb
      if (scrapeQueue.length > 0) {
        if (!isScraping) {
          isScraping = true;
          ProgressBar.show();
        }
        ProgressBar.update(scrapedCount, totalToScrape);
        pumpQueue();
      }
    }
  });

  observer.observe(thumbsContainer, { childList: true, subtree: false });
}

main();
