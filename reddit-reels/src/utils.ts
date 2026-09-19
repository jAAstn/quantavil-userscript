/**
 * Shared helper utilities for reddit-reels
 */

/**
 * Format score/comment numbers (e.g. 1542 -> "1.5k", 8930 -> "8.9k")
 */
export function formatCount(num: number): string {
  if (!num || isNaN(num)) return '0';
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

/**
 * Escape HTML to prevent injection in title strings
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Cleanly extract domain name from a URL (e.g. "https://thehindu.com/news/..." -> "thehindu.com")
 */
export function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

/**
 * Safely opens a URL in a new window/tab, falling back to current location
 */
export function openUrl(url?: string): void {
  if (!url) return;
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.href = url;
  }
}
