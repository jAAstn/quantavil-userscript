import { isAdCard } from './parse';

/**
 * Selectors for known advertising containers on Rule34Video.
 */
const AD_SELECTORS = [
  '.spot-thumb',
  '.spots',
  '.sidebar_ad_buttons',
  '.footer_spots',
  'ins.adsbyjuicy',
  'iframe[src*="sadbaguette"]',
  'iframe[src*="traffic"]',
  'iframe[src*="ads"]',
  'iframe[src*="adserver"]',
  'iframe[src*="/ads/"]',
  'iframe[src*="juicy"]',
  '.item.thumb:has(header)',
  '.item.thumb:has(iframe)',
  '.item.thumb a[href*="/v1/d.php"]',
];

/**
 * Purges ads from the specified root or entire document.
 */
export function cleanAds(root: Element | Document = document): void {
  // 1. Known selector removal
  for (const selector of AD_SELECTORS) {
    try {
      const elements = root.querySelectorAll(selector);
      for (const el of elements) {
        // If it's inside a video card, remove the whole card container
        const cardParent = el.closest('.item.thumb') ?? el;
        cardParent.remove();
      }
    } catch {
      // Fallback for browsers that don't support :has()
    }
  }

  // 2. Scan all thumbs to catch ad thumbs without video IDs
  const thumbs = root.querySelectorAll<HTMLElement>('.item.thumb');
  for (const thumb of thumbs) {
    if (isAdCard(thumb)) {
      thumb.remove();
    }
  }
}
