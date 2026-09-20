/**
 * Collapsible native site filter panel.
 *
 * The KVS `.filters-panel` is bulky and expanded by default. This module
 * collapses it on arrival (persisted user choice, default collapsed), wiring
 * the native `.filters-panel__toggle` when the site provides one or injecting
 * a matching toggle when it does not. Idempotent across repeat boots and
 * auto-page loads.
 */

export interface CollapseStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const COLLAPSE_KEY = 'better_rule34_native_filters_collapsed_v1';

const TOGGLE_LABEL = '<span>[ SITE FILTERS ]</span>';
const TOGGLE_ICON =
  '<svg class="filters-panel__toggle-icon" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>';

function resolveStore(store?: CollapseStore): CollapseStore | null {
  if (store) return store;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Ignore (no storage available)
  }
  return null;
}

/** Persisted collapsed state. Defaults to collapsed on first visit. */
export function shouldCollapseNativeFilters(store?: CollapseStore): boolean {
  const s = resolveStore(store);
  if (!s) return true;
  try {
    const raw = s.getItem(COLLAPSE_KEY);
    if (raw === null) return true;
    return raw !== '0';
  } catch {
    return true;
  }
}

export function setNativeFiltersCollapsed(collapsed: boolean, store?: CollapseStore): void {
  const s = resolveStore(store);
  if (!s) return;
  try {
    s.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  } catch {
    // Ignore (private mode quota etc.)
  }
}

function setCollapsed(panel: HTMLElement, toggle: HTMLElement, collapsed: boolean): void {
  toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  panel.classList.toggle('br34-collapsed', collapsed);
  setNativeFiltersCollapsed(collapsed);
}

function wirePanel(panel: HTMLElement, collapsed: boolean): void {
  let toggle = panel.querySelector<HTMLElement>('.filters-panel__toggle');
  let body = panel.querySelector<HTMLElement>('.filters-panel__body');

  // Wrap loose children so collapsing hides the whole form, not just parts.
  if (!body) {
    body = document.createElement('div');
    body.className = 'filters-panel__body';
    for (const child of Array.from(panel.childNodes)) {
      if (child !== toggle) body.append(child);
    }
    panel.append(body);
  }

  if (!toggle) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filters-panel__toggle';
    btn.innerHTML = `${TOGGLE_LABEL}${TOGGLE_ICON}`;
    panel.prepend(btn);
    toggle = btn;
  } else if (!toggle.querySelector('.filters-panel__toggle-icon')) {
    const icon = document.createElement('span');
    icon.className = 'filters-panel__toggle-icon';
    icon.setAttribute('aria-hidden', 'true');
    toggle.append(icon);
  }

  if (!toggle.hasAttribute('aria-expanded')) {
    toggle.setAttribute('aria-expanded', 'true');
  }
  if (toggle instanceof HTMLButtonElement && !toggle.hasAttribute('type')) {
    toggle.setAttribute('type', 'button');
  }

  if (toggle.dataset.br34FilterToggleWired !== 'true') {
    toggle.dataset.br34FilterToggleWired = 'true';
    const btn = toggle;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = btn.getAttribute('aria-expanded') !== 'false';
      setCollapsed(panel, btn, isExpanded);
    });
  }

  setCollapsed(panel, toggle, collapsed);
}

/**
 * Collapses every native `.filters-panel` on the page (default collapsed).
 * Safe to call on every boot/scan — wiring is guarded, state re-applied.
 */
export function initNativeFilterPanel(): void {
  const collapsed = shouldCollapseNativeFilters();
  const panels = document.querySelectorAll<HTMLElement>('.filters-panel');
  for (const panel of panels) {
    try {
      wirePanel(panel, collapsed);
    } catch {
      // Never let filter chrome break the catalog boot.
    }
  }
}
