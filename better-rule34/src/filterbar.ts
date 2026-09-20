import {
  BASE_YEAR,
  DEFAULT_FILTER,
  parseCurrentUrlFilters,
  viewsToNearestStep,
} from './parse';
import type { FilterState } from './types';

export interface FilterBarCallbacks {
  onFilterChange: (state: FilterState) => void;
}

const STORAGE_KEY = 'better_rule34_settings';

// Steps for the views slider
const VIEWS_STEPS = [0, 1000, 5000, 10000, 25000, 50000, 100000];

export class FilterBar {
  private state: FilterState;
  private callbacks: FilterBarCallbacks;
  public fabElement: HTMLElement;
  public panelElement: HTMLElement;
  private isOpen = false;
  private outsideClickHandler: ((e: MouseEvent) => void) | null = null;
  private sliderDebounce = 0;

  constructor(callbacks: FilterBarCallbacks) {
    this.callbacks = callbacks;
    this.state = this.loadInitialState();
    this.fabElement = this.buildFab();
    this.panelElement = this.buildPanel();
    // Assign user-controlled text via property (never innerHTML) to avoid injection.
    const searchInput = this.panelElement.querySelector<HTMLInputElement>('.br34-search-input');
    if (searchInput) searchInput.value = this.state.query;
    this.mount();
  }

  private loadInitialState(): FilterState {
    const urlFilters = parseCurrentUrlFilters(window.location.href);

    let savedSettings: Partial<FilterState> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedSettings = JSON.parse(raw);
    } catch {
      // Ignore
    }

    return {
      ...DEFAULT_FILTER,
      ...savedSettings,
      ...urlFilters,
    };
  }

  private saveSettings(): void {
    try {
      // Note: query stays ephemeral on purpose — persisting a keyword across
      // visits would mysteriously hide cards on return. Sliders/toggles persist.
      const toSave = {
        soundOnly: this.state.soundOnly,
        hdOnly: this.state.hdOnly,
        futaFilter: this.state.futaFilter,
        hideWatched: this.state.hideWatched,
        minRating: this.state.minRating,
        minViews: this.state.minViews,
        minYear: this.state.minYear,
        durationMinSeconds: this.state.durationMinSeconds,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore
    }
  }

  public getState(): FilterState {
    return this.state;
  }

  private mount(): void {
    document.body.append(this.fabElement, this.panelElement);
    this.bindEvents();
    this.updateBadge();
  }

  private countActiveFilters(): number {
    let count = 0;
    if (this.state.query.trim()) count++;
    if (this.state.soundOnly) count++;
    if (this.state.hdOnly) count++;
    if (this.state.futaFilter !== 'all') count++;
    if (this.state.hideWatched) count++;
    if (this.state.minRating > 0) count++;
    if (this.state.minViews > 0) count++;
    if (this.state.minYear > BASE_YEAR) count++;
    if (this.state.durationMinSeconds !== null && this.state.durationMinSeconds > 0) count++;
    return count;
  }

  public updateBadge(): void {
    const count = this.countActiveFilters();
    let badge = this.fabElement.querySelector<HTMLElement>('.br34-fab-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'br34-fab-badge';
        this.fabElement.append(badge);
      }
      badge.textContent = `[${count}]`;
    } else {
      badge?.remove();
    }
  }

  public setCount(visible: number, total: number): void {
    const counter = this.panelElement.querySelector<HTMLElement>('.br34-title-sub');
    if (counter) {
      counter.textContent = `UNITS: ${visible} / ${total}`;
    }
  }

  private buildFab(): HTMLElement {
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'br34-fab';
    fab.title = 'Open EROS Telemetry Filter';
    fab.setAttribute('aria-label', 'Open EROS Telemetry Filter');
    fab.innerHTML = `
      <span class="br34-fab-dot"></span>
      <span>CTRL</span>
    `;
    return fab;
  }

  private buildPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'br34-panel';

    const currentYear = new Date().getFullYear();
    const durMins = this.state.durationMinSeconds ? Math.round(this.state.durationMinSeconds / 60) : 0;

    panel.innerHTML = `
      <!-- Header: Title, Units & Close -->
      <div class="br34-panel-header">
        <div class="br34-title-row">
          <span class="br34-title">[ EROS // TELEMETRY ]</span>
          <span class="br34-title-sub">UNITS: LOADING...</span>
        </div>
        <button type="button" class="br34-panel-close" title="Close" aria-label="Close">[ X ]</button>
      </div>

      <!-- Body -->
      <div class="br34-panel-body">
        <!-- Live Keyword Search -->
        <div class="br34-search-box">
          <input type="text" class="br34-search-input" placeholder="SEARCH // TITLE KEYWORD" value="" />
        </div>

        <!-- Tactile Sliders (Vertical Stack) -->
        <div class="br34-sliders-vertical">
          <!-- 1. Rating Slider -->
          <div class="br34-slider-card">
            <div class="br34-sect-title">
              <span>MIN RATING</span>
              <span class="br34-sect-val" id="br34-val-rating">${this.state.minRating > 0 ? `≥ ${this.state.minRating}%` : 'ANY'}</span>
            </div>
            <input type="range" class="br34-range-slider" id="br34-slider-rating" min="0" max="100" step="5" value="${this.state.minRating}" />
          </div>

          <!-- 2. Views Slider -->
          <div class="br34-slider-card">
            <div class="br34-sect-title">
              <span>MIN VIEWS</span>
              <span class="br34-sect-val" id="br34-val-views">${this.formatViewsLabel(this.state.minViews)}</span>
            </div>
            <input type="range" class="br34-range-slider" id="br34-slider-views" min="0" max="6" step="1" value="${this.viewsToSliderStep(this.state.minViews)}" />
          </div>

          <!-- 3. Duration Slider -->
          <div class="br34-slider-card">
            <div class="br34-sect-title">
              <span>MIN DURATION</span>
              <span class="br34-sect-val" id="br34-val-dur">${durMins > 0 ? `≥ ${durMins}M` : 'ANY'}</span>
            </div>
            <input type="range" class="br34-range-slider" id="br34-slider-dur" min="0" max="45" step="1" value="${durMins}" />
          </div>

          <!-- 4. Vintage Slider -->
          <div class="br34-slider-card">
            <div class="br34-sect-title">
              <span>MIN VINTAGE</span>
              <span class="br34-sect-val" id="br34-val-year">${this.state.minYear > BASE_YEAR ? `≥ ${this.state.minYear}` : 'ALL'}</span>
            </div>
            <input type="range" class="br34-range-slider" id="br34-slider-year" min="${BASE_YEAR}" max="${currentYear}" step="1" value="${this.state.minYear}" />
          </div>
        </div>

        <!-- Tactile Toggles (Compact 2x2 grid) -->
        <div class="br34-grid-2x2">
          <button type="button" class="br34-chip ${this.state.soundOnly ? 'active' : ''}" data-toggle="sound">
            SOUND
          </button>
          <button type="button" class="br34-chip ${this.state.hdOnly ? 'active' : ''}" data-toggle="hd">
            HD ONLY
          </button>
          <button type="button" class="br34-chip ${this.state.futaFilter !== 'all' ? 'active-purple' : ''}" data-toggle="futa">
            ${this.getFutaLabel()}
          </button>
          <button type="button" class="br34-chip ${this.state.hideWatched ? 'active' : ''}" data-toggle="watched">
            UNWATCHED
          </button>
        </div>
      </div>

      <!-- Footer: Reset -->
      <div class="br34-panel-footer">
        <button type="button" class="br34-btn-reset" id="br34-btn-reset">
          RESET ALL FILTERS
        </button>
      </div>
    `;

    return panel;
  }

  private viewsToSliderStep(views: number): number {
    return viewsToNearestStep(views, VIEWS_STEPS);
  }

  private formatViewsLabel(views: number): string {
    if (views <= 0) return 'ANY';
    if (views >= 1000000) return `≥ ${views / 1000000}M`;
    if (views >= 1000) return `≥ ${views / 1000}K`;
    return `≥ ${views}`;
  }

  private getFutaLabel(): string {
    switch (this.state.futaFilter) {
      case 'hide':
        return 'NO FUTA';
      case 'only':
        return 'FUTA ONLY';
      case 'all':
      default:
        return 'FUTA: ALL';
    }
  }

  private cycleFuta(): void {
    if (this.state.futaFilter === 'all') this.state.futaFilter = 'hide';
    else if (this.state.futaFilter === 'hide') this.state.futaFilter = 'only';
    else this.state.futaFilter = 'all';

    const btn = this.panelElement.querySelector<HTMLElement>('[data-toggle="futa"]');
    if (btn) {
      btn.textContent = this.getFutaLabel();
      btn.classList.toggle('active-purple', this.state.futaFilter !== 'all');
    }
    this.saveSettings();
    this.updateBadge();
    this.callbacks.onFilterChange(this.state);
  }

  private togglePanel(open?: boolean): void {
    this.isOpen = open !== undefined ? open : !this.isOpen;
    this.panelElement.classList.toggle('open', this.isOpen);
    this.fabElement.classList.toggle('active', this.isOpen);
  }

  private commitSliderChange(): void {
    window.clearTimeout(this.sliderDebounce);
    this.sliderDebounce = window.setTimeout(() => {
      this.saveSettings();
      this.updateBadge();
      this.callbacks.onFilterChange(this.state);
    }, 80);
  }

  private bindEvents(): void {
    // 1. FAB click
    this.fabElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });

    // 2. Close button
    this.panelElement.querySelector('.br34-panel-close')?.addEventListener('click', () => {
      this.togglePanel(false);
    });

    // 3. Click outside closes panel (removed in destroy to avoid ghost closes)
    this.outsideClickHandler = (e: MouseEvent) => {
      if (
        this.isOpen &&
        !this.panelElement.contains(e.target as Node) &&
        !this.fabElement.contains(e.target as Node)
      ) {
        this.togglePanel(false);
      }
    };
    document.addEventListener('click', this.outsideClickHandler);

    // 4. Live Search
    let searchDebounce = 0;
    const searchInput = this.panelElement.querySelector<HTMLInputElement>('.br34-search-input');
    searchInput?.addEventListener('input', () => {
      window.clearTimeout(searchDebounce);
      searchDebounce = window.setTimeout(() => {
        this.state.query = searchInput.value;
        this.updateBadge();
        this.callbacks.onFilterChange(this.state);
      }, 80);
    });

    // 5. Rating Slider (label updates instantly, filter commits debounced)
    const ratingSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-rating');
    const ratingVal = this.panelElement.querySelector<HTMLElement>('#br34-val-rating');
    ratingSlider?.addEventListener('input', () => {
      const val = parseInt(ratingSlider.value, 10);
      this.state.minRating = val;
      if (ratingVal) {
        ratingVal.textContent = val > 0 ? `≥ ${val}%` : 'ANY';
      }
      this.commitSliderChange();
    });

    // 6. Views Slider
    const viewsSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-views');
    const viewsVal = this.panelElement.querySelector<HTMLElement>('#br34-val-views');
    viewsSlider?.addEventListener('input', () => {
      const step = parseInt(viewsSlider.value, 10);
      const val = VIEWS_STEPS[step] || 0;
      this.state.minViews = val;
      if (viewsVal) {
        viewsVal.textContent = this.formatViewsLabel(val);
      }
      this.commitSliderChange();
    });

    // 7. Duration Slider
    const durSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-dur');
    const durVal = this.panelElement.querySelector<HTMLElement>('#br34-val-dur');
    durSlider?.addEventListener('input', () => {
      const mins = parseInt(durSlider.value, 10);
      this.state.durationMinSeconds = mins > 0 ? mins * 60 : null;
      if (durVal) {
        durVal.textContent = mins > 0 ? `≥ ${mins}M` : 'ANY';
      }
      this.commitSliderChange();
    });

    // 8. Year Slider
    const yearSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-year');
    const yearVal = this.panelElement.querySelector<HTMLElement>('#br34-val-year');
    yearSlider?.addEventListener('input', () => {
      const yr = parseInt(yearSlider.value, 10);
      this.state.minYear = yr;
      if (yearVal) {
        yearVal.textContent = yr > BASE_YEAR ? `≥ ${yr}` : 'ALL';
      }
      this.commitSliderChange();
    });

    // 9. Quick Toggles
    const soundBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="sound"]');
    soundBtn?.addEventListener('click', () => {
      this.state.soundOnly = !this.state.soundOnly;
      soundBtn.classList.toggle('active', this.state.soundOnly);
      this.saveSettings();
      this.updateBadge();
      this.callbacks.onFilterChange(this.state);
    });

    const hdBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="hd"]');
    hdBtn?.addEventListener('click', () => {
      this.state.hdOnly = !this.state.hdOnly;
      hdBtn.classList.toggle('active', this.state.hdOnly);
      this.saveSettings();
      this.updateBadge();
      this.callbacks.onFilterChange(this.state);
    });

    const futaBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="futa"]');
    futaBtn?.addEventListener('click', () => {
      this.cycleFuta();
    });

    const watchedBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="watched"]');
    watchedBtn?.addEventListener('click', () => {
      this.state.hideWatched = !this.state.hideWatched;
      watchedBtn.classList.toggle('active', this.state.hideWatched);
      this.saveSettings();
      this.updateBadge();
      this.callbacks.onFilterChange(this.state);
    });

    // Reset button: restores defaults and persists them (survives reload).
    this.panelElement.querySelector('#br34-btn-reset')?.addEventListener('click', () => {
      this.state = {
        ...DEFAULT_FILTER,
      };
      this.saveSettings();
      this.syncInputsWithState();
      this.updateBadge();
      this.callbacks.onFilterChange(this.state);
    });
  }

  private syncInputsWithState(): void {
    const searchInput = this.panelElement.querySelector<HTMLInputElement>('.br34-search-input');
    if (searchInput) searchInput.value = this.state.query;

    const ratingSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-rating');
    const ratingVal = this.panelElement.querySelector<HTMLElement>('#br34-val-rating');
    if (ratingSlider) ratingSlider.value = String(this.state.minRating);
    if (ratingVal) ratingVal.textContent = this.state.minRating > 0 ? `≥ ${this.state.minRating}%` : 'ANY';

    const viewsSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-views');
    const viewsVal = this.panelElement.querySelector<HTMLElement>('#br34-val-views');
    if (viewsSlider) viewsSlider.value = String(this.viewsToSliderStep(this.state.minViews));
    if (viewsVal) viewsVal.textContent = this.formatViewsLabel(this.state.minViews);

    const durSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-dur');
    const durVal = this.panelElement.querySelector<HTMLElement>('#br34-val-dur');
    const durMins = this.state.durationMinSeconds ? Math.round(this.state.durationMinSeconds / 60) : 0;
    if (durSlider) durSlider.value = String(durMins);
    if (durVal) durVal.textContent = durMins > 0 ? `≥ ${durMins}M` : 'ANY';

    const yearSlider = this.panelElement.querySelector<HTMLInputElement>('#br34-slider-year');
    const yearVal = this.panelElement.querySelector<HTMLElement>('#br34-val-year');
    if (yearSlider) yearSlider.value = String(this.state.minYear);
    if (yearVal) yearVal.textContent = this.state.minYear > BASE_YEAR ? `≥ ${this.state.minYear}` : 'ALL';

    const soundBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="sound"]');
    soundBtn?.classList.toggle('active', this.state.soundOnly);

    const hdBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="hd"]');
    hdBtn?.classList.toggle('active', this.state.hdOnly);

    const futaBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="futa"]');
    if (futaBtn) {
      futaBtn.textContent = this.getFutaLabel();
      futaBtn.classList.toggle('active-purple', this.state.futaFilter !== 'all');
    }

    const watchedBtn = this.panelElement.querySelector<HTMLElement>('[data-toggle="watched"]');
    watchedBtn?.classList.toggle('active', this.state.hideWatched);
  }

  public destroy(): void {
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
    window.clearTimeout(this.sliderDebounce);
    this.fabElement.remove();
    this.panelElement.remove();
  }
}
