import { VNode } from 'preact';

export interface FabButtonProps {
  onClick: () => void;
}

/**
 * Revamped Reddit Reel Floating Action Button (FAB)
 * Pure SVG icon (Instagram/Shorts-style Clapperboard + Play Glyph), no text.
 */
export function FabButton({ onClick }: FabButtonProps): VNode {
  return (
    <button
      type="button"
      id="rr-fab"
      class="rr-fab"
      onClick={onClick}
      aria-label="Open Reddit Reel Mode"
      title="Open Reddit Reel Mode"
    >
      <svg
        class="rr-fab-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" />
        <path d="M2.5 8.5h19" />
        <path d="m6.5 2.5 3 6" />
        <path d="m11.5 2.5 3 6" />
        <path d="m16.5 2.5 3 6" />
        <polygon points="10 11.5 15.5 14.75 10 18 10 11.5" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}
