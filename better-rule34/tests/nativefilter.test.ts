import { describe, expect, it } from 'bun:test';
import {
  setNativeFiltersCollapsed,
  shouldCollapseNativeFilters,
  type CollapseStore,
} from '../src/nativefilter';

function memStore(): CollapseStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe('native filter collapse state', () => {
  it('defaults to collapsed and round-trips the user choice', () => {
    const store = memStore();
    expect(shouldCollapseNativeFilters(store)).toBe(true);
    setNativeFiltersCollapsed(false, store);
    expect(shouldCollapseNativeFilters(store)).toBe(false);
    setNativeFiltersCollapsed(true, store);
    expect(shouldCollapseNativeFilters(store)).toBe(true);
  });
});
