# Modular Architecture Design: Reddit Reels Userscript

**Date:** 2026-09-19  
**Status:** Approved  
**Target Codebase:** `/home/quantavil/Documents/userscript/reddit-reels`

## 1. Goal
Decompose the monolithic `src/main.tsx` (~1,050 lines) and monolithic `src/style.css` (~1,100 lines) into a domain-sliced, single-responsibility modular architecture. Move all test files outside `src/` into `tests/unit/`.

## 2. Directory Structure

```
reddit-reels/
├── src/
│   ├── core/
│   │   ├── feed-manager.ts      # Feed orchestration (active post tracking, scroll snap, IntersectionObserver)
│   │   ├── unconstrainer.ts     # Aspect-ratio & player clamp removal, crosspost clutter suppression
│   │   └── input-controller.ts  # Keyboard navigation (j/k/m/Esc) & tap gestures (Fit/Fill, Play/Pause)
│   ├── state/
│   │   └── index.ts             # Reactive signals & GM/localStorage persistence
│   ├── cards/
│   │   ├── text-card.ts         # Discussion text post card (scrollable body, Read Full button)
│   │   └── link-card.ts         # External link preview card (headline, domain badge, CTA)
│   ├── ui/
│   │   ├── overlay.ts           # Metadata (sub/author link) & vertical action rail (vote group, comments)
│   │   ├── top-bar.ts           # Minimalist top bar (exit button, videos-only filter, sound toggle)
│   │   ├── pulse.ts             # Visual feedback pulses (Play/Pause, Fit/Fill scale indicator)
│   │   └── fab.ts               # Floating action button launcher (Preact)
│   ├── extractor/               # DOM extraction & Reddit vote proxy
│   │   ├── dom-extractor.ts
│   │   ├── vote-proxy.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── media/                   # Media & audio playback engine
│   │   ├── audio-manager.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── styles/                  # Modular CSS
│   │   ├── base.css             # Design tokens, variables, typography, reset
│   │   ├── feed.css             # Reel viewport, snap scrolling, full-bleed post layouts
│   │   ├── overlay.css          # Metadata badges, action rail, vote group cluster
│   │   ├── top-bar.css          # Top bar and filter pill buttons
│   │   ├── cards.css            # Discussion reader cards & external link cards
│   │   ├── gallery.css          # Multiple-image carousels
│   │   └── index.css            # Main CSS aggregator
│   └── index.ts                 # Bootstrap userscript entrypoint
├── tests/
│   ├── fixtures/                # HTML fixtures and bundled test assets
│   ├── unit/                    # 100% of unit tests
│   │   ├── extractor.test.ts
│   │   └── media.test.ts        # Moved from src/media/media.test.ts
│   └── visual-test.ts           # Playwright E2E visual runner
```

## 3. Module Responsibilities & Contracts

### `src/core/feed-manager.ts`
- **Exports:** `FeedManager`, `feedManager`
- **Responsibilities:**
  - Manages active post tracking via `IntersectionObserver`.
  - Controls programmatic scroll snapping (`scrollToPost`, `scrollToNext`, `scrollToPrevious`).
  - Observes new posts in DOM using `observeNewPosts` and triggers post enhancement.
  - Toggles reels mode (`enter()`, `exit()`).

### `src/core/unconstrainer.ts`
- **Exports:** `unconstrainPostMedia(postEl: HTMLElement): void`, `unconstrainPlayerShadow(player: HTMLElement): void`
- **Responsibilities:**
  - Unconstrains dimensions of `shreddit-aspect-ratio`, `[slot="post-media-container"]`, `[data-aspect-ratio-container]`, `.media-lightbox-img`.
  - Hides crosspost leakages (`.crosspost-credit-bar`, `.crosspost-title`, `.post-background-image-filter`, `.text-secondary-plain-weak`).
  - Injects shadowRoot styles for `shreddit-player-2` and `gallery-carousel`.

### `src/core/input-controller.ts`
- **Exports:** `initInputController(): () => void`
- **Responsibilities:**
  - Attaches keyboard event listener (`j`/`Down`, `k`/`Up`, `m`, `Escape`).
  - Handles single-tap (play/pause) and double-tap (Fit/Fill toggle) gestures on post media.
  - Unlocks audio context on initial interaction.

### `src/cards/text-card.ts` & `src/cards/link-card.ts`
- **Exports:** `renderTextCard(postEl: HTMLElement, post: ReelPost): void`, `renderLinkCard(postEl: HTMLElement, post: ReelPost): void`
- **Responsibilities:**
  - `renderTextCard`: Renders flat discussion card with "Discussion" pill, "Read Full" link, smooth isolated scrolling.
  - `renderLinkCard`: Renders external link preview with thumbnail and CTA button.

### `src/ui/overlay.ts`
- **Exports:** `renderReelOverlay(postEl: HTMLElement, post: ReelPost): void`
- **Responsibilities:**
  - Injects bottom-left metadata (`r/subreddit • u/author`).
  - Injects bottom-right vertical rail (`rr-vote-group` with Upvote, Net Score, Downvote; sound button; comments button).
  - Binds vote proxy handlers with immediate net score updates.

### `src/ui/top-bar.ts`
- **Exports:** `createTopBar(): HTMLElement`, `updateTopBarState(): void`
- **Responsibilities:**
  - Creates floating top bar with exit button, videos-only filter toggle, sound button.
  - Synchronizes UI state with reactive signals.

### `src/ui/pulse.ts`
- **Exports:** `showPlayPulse(isPlay: boolean): void`, `showScalePulse(mode: string): void`
- **Responsibilities:**
  - Displays transient center-screen feedback badge.

### `src/styles/`
- Split monolithic `style.css` into 6 domain files aggregated by `styles/index.css`.

## 4. Test Relocation & Validation Plan
- Move `src/media/media.test.ts` to `tests/unit/media.test.ts`.
- Update `package.json` test scripts to target `tests/unit`.
- Verify all 27 unit tests pass with `bun test tests/unit`.
- Verify Playwright visual tests pass with `bun run tests/visual-test.ts`.
- Verify production build succeeds with `bun run build`.
