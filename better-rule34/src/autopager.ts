import { cleanAds } from './adcleaner';
import { isAdCard, resolveNextPageUrl } from './parse';
import { hardenAnchor } from './newtab';

export interface AutoPagerOptions {
  onNewCards: (elements: HTMLElement[]) => void;
  onPageLoaded?: (pageNumber: number) => void;
}

/** True on catalog listing pages; false on watch/login/static pages. */
export function isListingPage(urlStr: string = window.location.href): boolean {
  try {
    const url = new URL(urlStr);
    if (/\/video(\/|$)/.test(url.pathname)) return false;
    if (/^\/(login|signup|invite|premium|static|info|feedback)/.test(url.pathname)) return false;
    return true;
  } catch {
    return true;
  }
}

export function findVideosContainer(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('.content_general .thumbs') ||
    document.querySelector<HTMLElement>('[id^="custom_list_videos_"][id$="_items"].thumbs') ||
    document.querySelector<HTMLElement>('.twocolumns .thumbs') ||
    document.querySelector<HTMLElement>('.thumbs') ||
    document.querySelector<HTMLElement>('[id$="_items"]')
  );
}

export function unclipBodyOverflow(): void {
  // Rule34Video runs $('body').wrapInner('<div style="position:relative;overflow:hidden">');
  // This clips viewport scrolling and prevents scroll detection/IntersectionObserver!
  const wrappers = document.querySelectorAll<HTMLElement>('body > div');
  for (const w of wrappers) {
    if (w.style.overflow === 'hidden') {
      w.style.overflow = 'visible';
    }
  }
}

/**
 * Single source of truth for "next page" resolution from a fetched/native
 * document. Returns null when the server offers no continuation (last page).
 * data-parameters (KVS async paging) wins over raw href; no fabrication here.
 */
export function parseNextLink(
  root: Document | Element,
  baseUrl: string,
): { url: string | null; fromParam: number | null } {
  const nextLink = root.querySelector<HTMLAnchorElement>(
    '.pagination .item.pager.next a, .pagination .item.active + .item a, .pagination a.next',
  );
  if (!nextLink) return { url: null, fromParam: null };

  const raw = nextLink.getAttribute('href') || '';
  const dataParams = nextLink.getAttribute('data-parameters') || '';
  if (raw && !raw.startsWith('#') && !raw.startsWith('javascript:')) {
    const resolved = resolveNextPageUrl(baseUrl, raw);
    return { url: resolved || null, fromParam: null };
  }
  if (dataParams) {
    const match = /(?:from_videos|from):(\d+)/.exec(dataParams);
    if (match) {
      return { url: null, fromParam: parseInt(match[1], 10) };
    }
  }
  return { url: null, fromParam: null };
}

export class AutoPager {
  private container: HTMLElement | null = null;
  private statusContainer: HTMLElement | null = null;
  private sentinel: HTMLElement | null = null;
  private observer: IntersectionObserver | null = null;
  private nextUrl: string | null = null;
  private currentPage = 1;
  private initialPage = 1;
  private lastPageUrl: string = window.location.href;
  private isLoading = false;
  private isAppending = false;
  private seenCardIds = new Set<string>();
  private onNewCards: (elements: HTMLElement[]) => void;
  private onPageLoaded?: (pageNumber: number) => void;
  private scrollHandler: (() => void) | null = null;

  constructor(options: AutoPagerOptions) {
    this.onNewCards = options.onNewCards;
    this.onPageLoaded = options.onPageLoaded;
  }

  public init(): void {
    unclipBodyOverflow();
    if (!isListingPage()) return;
    this.container = findVideosContainer();
    if (!this.container) return;

    this.currentPage = this.detectCurrentPageNumber();
    this.initialPage = this.currentPage;
    this.lastPageUrl = window.location.href;

    // Index currently existing cards
    const initialCards = this.container.querySelectorAll<HTMLElement>('.item.thumb');
    for (const card of initialCards) {
      if (isAdCard(card)) {
        card.remove();
        continue;
      }
      const id = card.dataset.videoCardId || card.querySelector('a[href*="/video/"]')?.getAttribute('href');
      if (id) this.seenCardIds.add(id);
    }

    // Determine next page URL
    this.detectNextPageUrl(document);

    // Mount sentinel and status
    this.mountStatusElements();

    // Dual triggers: IntersectionObserver + direct scroll listener
    this.setupObserver();
    this.setupScrollListener();
  }

  public getIsAppending(): boolean {
    return this.isAppending;
  }

  public getNextUrl(): string | null {
    return this.nextUrl;
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public getTotalLoadedCount(): number {
    return this.seenCardIds.size;
  }

  /** Catalog pages loaded in this session (1 = native first page). */
  public getPagesLoaded(): number {
    return Math.max(1, this.currentPage - this.initialPage + 1);
  }

  /** URL of the most recently loaded catalog page (native URL for page 1). */
  public getCurrentPageUrl(): string {
    return this.lastPageUrl;
  }

  private detectCurrentPageNumber(): number {
    try {
      const url = new URL(window.location.href);
      const fromParam = url.searchParams.get('from_videos') || url.searchParams.get('from');
      if (fromParam) {
        const p = parseInt(fromParam, 10);
        if (!isNaN(p) && p > 0) return p;
      }
      const pathMatch = /\/(\d+)\/?$/.exec(url.pathname);
      if (pathMatch) {
        const p = parseInt(pathMatch[1], 10);
        if (!isNaN(p) && p > 0) return p;
      }
    } catch {
      // Fallback to 1
    }
    return 1;
  }

  private detectNextPageUrl(root: Document): void {
    const { url, fromParam } = parseNextLink(root, window.location.href);
    this.nextUrl = null;
    if (url) {
      this.nextUrl = url;
    } else if (fromParam !== null && !isNaN(fromParam)) {
      this.nextUrl = this.computeNextPageUrlFromCurrent(window.location.href, fromParam);
    }

    if (!this.nextUrl) {
      // Fallback: predictable path paging only. Search routes use opaque
      // server offsets — fabricating from_videos=N risks wrong/duplicate
      // pages, so a missing server link means "stop" there.
      try {
        const pathname = new URL(window.location.href).pathname;
        if (!pathname.includes('/search/')) {
          this.nextUrl = this.computeNextPageUrlFromCurrent(window.location.href, this.currentPage + 1);
        }
      } catch {
        this.nextUrl = null;
      }
    }

    // Hide native pagination
    const nativePagination = document.querySelector<HTMLElement>('.pagination');
    if (nativePagination) {
      nativePagination.style.display = 'none';
    }
  }

  private computeNextPageUrlFromCurrent(currentUrlStr: string, nextPageNum: number): string | null {
    try {
      const url = new URL(currentUrlStr);
      const pathname = url.pathname;

      // If at root '/', normalize to '/latest-updates/'
      if (pathname === '' || pathname === '/') {
        url.pathname = `/latest-updates/${nextPageNum}/`;
        return url.toString();
      }

      // If on search route, KVS uses query parameter ?from_videos=N
      if (pathname.includes('/search/')) {
        url.searchParams.set('from_videos', String(nextPageNum));
        return url.toString();
      }

      // Check if path already ends in a page number like /2/ or /3/
      if (/\/\d+\/?$/.test(pathname)) {
        url.pathname = pathname.replace(/\/\d+\/?$/, `/${nextPageNum}/`);
        return url.toString();
      }

      // If at clean category/tag path, append /N/
      if (pathname.endsWith('/')) {
        url.pathname = `${pathname}${nextPageNum}/`;
        return url.toString();
      } else {
        url.pathname = `${pathname}/${nextPageNum}/`;
        return url.toString();
      }
    } catch {
      return null;
    }
  }

  private mountStatusElements(): void {
    if (!this.container) return;

    if (!this.statusContainer) {
      this.statusContainer = document.createElement('div');
      this.statusContainer.className = 'br34-autopager-container';
      this.container.after(this.statusContainer);
    }

    if (!this.sentinel) {
      this.sentinel = document.createElement('div');
      this.sentinel.className = 'br34-sentinel';
      this.sentinel.style.height = '1px';
      this.statusContainer.before(this.sentinel);
    }

    this.updateStatusDisplay();
  }

  private setupObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer?.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.isLoading || !this.nextUrl) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void this.loadNextPage();
            break;
          }
        }
      },
      {
        rootMargin: '1000px 0px',
        threshold: 0,
      },
    );

    if (this.sentinel) {
      this.observer.observe(this.sentinel);
    }
  }

  private setupScrollListener(): void {
    if (this.scrollHandler) return;

    let ticking = false;
    this.scrollHandler = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;
        if (this.isLoading || !this.nextUrl) return;

        const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const winHeight = window.innerHeight || document.documentElement.clientHeight;
        const docHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
        );

        // When user scrolls within 1200px of bottom
        if (scrollY + winHeight >= docHeight - 1200) {
          void this.loadNextPage();
        }
      });
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('touchmove', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });
  }

  private updateStatusDisplay(): void {
    if (!this.statusContainer) return;

    if (this.isLoading) {
      this.statusContainer.innerHTML = `
        <div class="br34-autopager-loading">
          <div class="br34-spinner"></div>
          <span>ACQUIRING SECTOR // PAGE ${this.currentPage + 1}...</span>
        </div>
      `;
    } else if (!this.nextUrl) {
      this.statusContainer.innerHTML = `
        <div class="br34-autopager-end">
          [ ARCHIVE EXHAUSTED // ${this.seenCardIds.size} UNITS INDEXED ]
        </div>
      `;
    } else {
      this.statusContainer.innerHTML = '';
    }
  }

  public async loadNextPage(): Promise<void> {
    if (this.isLoading || !this.nextUrl) return;
    this.container = findVideosContainer();
    if (!this.container) return;

    this.isLoading = true;
    this.updateStatusDisplay();

    const fetchUrl = this.nextUrl;

    try {
      const response = await fetch(fetchUrl, {
        credentials: 'include',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${fetchUrl}`);
      }

      const htmlText = await response.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');

      // Purge ads from fetched doc
      cleanAds(doc);

      // Extract new video cards
      const newCardElements = Array.from(doc.querySelectorAll<HTMLElement>('.thumbs .item.thumb, .item.thumb'));
      const cardsToAppend: HTMLElement[] = [];

      for (const card of newCardElements) {
        if (isAdCard(card)) continue;
        const anchor = card.querySelector<HTMLAnchorElement>('a[href*="/video/"]');
        const href = anchor?.getAttribute('href') || '';
        const id = card.dataset.videoCardId || href;
        if (id && this.seenCardIds.has(id)) continue;
        if (id) this.seenCardIds.add(id);

        // Open-in-new-tab + lazy-load fix on appended cards
        if (anchor) hardenAnchor(anchor);
        const img = card.querySelector<HTMLImageElement>('img');
        if (img) {
          const webp = img.getAttribute('data-webp') || img.dataset.webp;
          const original = img.getAttribute('data-original') || img.dataset.original;
          const resolvedSrc = webp || original;
          if (resolvedSrc) {
            img.src = resolvedSrc;
          }
          img.removeAttribute('data-original');
          img.removeAttribute('data-webp');
          img.classList.remove('lazy-load');
          img.loading = 'lazy';
        }

        cardsToAppend.push(card);
      }

      if (cardsToAppend.length > 0) {
        this.isAppending = true;
        try {
          // Visible page boundary so users can tell which batch is which page.
          // Plain div: ignored by card scans, ad-clean, and the observer.
          const sep = document.createElement('div');
          sep.className = 'br34-page-sep';
          sep.dataset.page = String(this.currentPage + 1);
          sep.textContent = `[ PAGE ${this.currentPage + 1} ]`;
          this.container.append(sep, ...cardsToAppend);
        } finally {
          setTimeout(() => {
            this.isAppending = false;
          }, 50);
        }
        this.onNewCards(cardsToAppend);
      }

      this.currentPage++;
      this.lastPageUrl = fetchUrl;
      this.onPageLoaded?.(this.currentPage);

      // Update next page URL from fetched page pagination (shared helper)
      const parsed = parseNextLink(doc, fetchUrl);
      this.nextUrl = null;
      if (parsed.url) {
        this.nextUrl = parsed.url;
      } else if (parsed.fromParam !== null && !isNaN(parsed.fromParam)) {
        this.nextUrl = this.computeNextPageUrlFromCurrent(fetchUrl, parsed.fromParam);
      }

      if (!this.nextUrl && cardsToAppend.length > 0) {
        // Fallback only for predictable path paging. On /search/ the server
        // offset is opaque — a missing link means stop, not fabricate.
        try {
          if (!new URL(fetchUrl).pathname.includes('/search/')) {
            this.nextUrl = this.computeNextPageUrlFromCurrent(fetchUrl, this.currentPage + 1);
          }
        } catch {
          this.nextUrl = null;
        }
      }
    } catch (err) {
      console.error('[Better Rule34] AutoPager error:', err);
      if (this.statusContainer) {
        this.statusContainer.innerHTML = `
          <div class="br34-autopager-end" style="border-color: #ff0055; color: #ff0055;">
            [ ERROR FETCHING SECTOR // <button type="button" class="br34-load-more-btn" style="padding: 4px 10px; font-size: 10px; margin-left: 6px;">RETRY</button> ]
          </div>
        `;
        this.statusContainer.querySelector('button')?.addEventListener('click', () => {
          void this.loadNextPage();
        });
      }
    } finally {
      this.isLoading = false;
      this.updateStatusDisplay();
      unclipBodyOverflow();
    }
  }

  public destroy(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('touchmove', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
      this.scrollHandler = null;
    }
    this.observer?.disconnect();
    this.observer = null;
    this.statusContainer?.remove();
    this.sentinel?.remove();
    this.statusContainer = null;
    this.sentinel = null;
  }
}
