# Reddit Reel Mode Userscript Specification

**Date:** 2026-09-19  
**Status:** Approved  
**Target:** Mobile & Desktop Web Reddit (`sh.reddit.com` / `reddit.com`), Violentmonkey / Tampermonkey  
**Location:** `/home/quantavil/Projects/reddit-reels`

---

## 1. Problem Statement & Motivation
On Reddit mobile web view, posts embedding videos—especially RedGifs and native Reddit media—cause significant friction:
1. Videos are muted by default.
2. If the user unmutes a video and scrolls down or navigates, the background audio frequently does not stop, causing overlapping audio streams.
3. Mobile view lacks a modern vertical immersive full-screen reel experience (like TikTok or Instagram Reels).
4. Unauthenticated external API requests are blocked or rate-limited by Reddit in 2025/2026.

**Goal:** Provide a seamless "Reel Mode" userscript that transforms the browsing experience into an immersive full-screen vertical swipe reel feed with:
- Audio enabled by default (with user mute/unmute control and persistence).
- Strict single-audio playback: moving to the next reel immediately halts and mutes previous audio.
- Native action synchronization (Upvote, Downvote, Comments sheet) via DOM proxying.
- Direct RedGifs & Reddit video resolution without third-party API rate limits.
- Floating Action Button (FAB) + tap-to-reel entry on posts.

---

## 2. Architectural Design

```
+--------------------------------------------------------------------------+
|                            Reddit Mobile Page                            |
|  [<shreddit-post>] [<shreddit-post>] [<shreddit-post>] ...               |
+------------------------------------+-------------------------------------+
                                     |
                         MutationObserver / Ingestion
                                     |
                                     v
+--------------------------------------------------------------------------+
|                             Reddit Reels App                             |
|                                                                          |
|  +---------------------------+   +------------------------------------+  |
|  |   DOM Ingestion Service   |   |        Audio Focus Manager         |  |
|  | - Extracts metadata       |   | - Enforces single active media     |  |
|  | - Proxies upvote/downvote |   | - Mutes & stops previous reel      |  |
|  | - Tracks feed additions   |   | - Auto-unmutes on user preference  |  |
|  +-------------+-------------+   +-----------------+------------------+  |
|                |                                   |                     |
|                +-----------------+-----------------+                     |
|                                  v                                       |
|  +--------------------------------------------------------------------+  |
|  |                    Full-Screen Reel Container                      |  |
|  | - CSS scroll snapping (100dvh mandatory)                           |  |
|  | - Virtualized window (active +/- 1 slides)                         |  |
|  | - Media Resolvers: RedGifs direct/embed + Reddit v.redd.it         |  |
|  | - Right Action Rail: Upvote, Downvote, Comments, Mute, Share, Exit |  |
|  | - Bottom Sheet: Slide-up comments drawer                           |  |
|  | - Floating Action Button (FAB) toggles overlay                     |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
```

---

## 3. Core Subsystems & Interfaces

### 3.1 DOM Ingestion & Native Proxying (`src/extractor/`)
* **Interface**:
  ```ts
  export interface ReelPost {
    id: string;
    title: string;
    author: string;
    subreddit: string;
    score: number;
    commentCount: number;
    permalink: string;
    contentHref: string;
    postType: 'video' | 'image' | 'gallery' | 'link';
    element: HTMLElement;
  }
  ```
* **Extraction**: Targets `<shreddit-post>` and standard post selectors.
* **Native Action Proxying**:
  * `upvote(post: ReelPost)`: Finds the native upvote button inside `post.element` (e.g., `button[aria-label*="upvote"]`, `shreddit-post button[name="upvote"]`), dispatches click.
  * `downvote(post: ReelPost)`: Dispatches click to the native downvote button.
  * Ensures user session, CSRF tokens, and karma are synchronized 100% natively without external API requests.

### 3.2 Media Resolution Engine (`src/media/`)
* **RedGifs Resolver**:
  * Detects `redgifs.com/watch/{id}` or `redgifs.com/ifr/{id}`.
  * Resolves direct high-quality MP4 with audio using temporary auth token workflow or iframe stream fallback.
  * Falls back cleanly to sanitized direct embed if stream is unavailable.
* **Reddit Native (`v.redd.it`)**:
  * Extracts stream source from `<shreddit-player-2>` or child `<source>` tags.
* **Images / Galleries**:
  * Renders full-screen high-res imagery with carousel support.

### 3.3 Audio Focus Manager (`src/media/audio-manager.ts`)
* **Single Active Playback**:
  * Stores `activeVideo: HTMLVideoElement | null`.
  * On slide transition, `activeVideo.pause()`, `activeVideo.muted = true`, and sets `currentTime = 0`.
  * Primes audio context on initial FAB click (satisfying browser gesture requirement).
  * Manages global `isMuted` preference, persisted to `localStorage`.

### 3.4 Reel UI & Gesture Engine (`src/ui/`)
* **Full-Screen Container**:
  * Fixed overlay: `position: fixed; inset: 0; z-index: 999999; background: #000;`.
  * Snapping vertical scroll: `overflow-y: scroll; scroll-snap-type: y mandatory;`.
* **Actions Rail (Right Side)**:
  * Upvote icon with counter.
  * Downvote icon.
  * Comments icon with count -> slides up `CommentsDrawer`.
  * Sound toggle (Unmuted by default, icon reflects audio state).
  * Share button (copies URL or triggers Web Share API).
  * Close button (exits Reel Mode).
* **FAB Button**:
  * Bottom-right floating button with Reels icon to launch or exit Reel Mode.

---

## 4. Playwright Test Suite (`tests/`)
* Runs in mobile viewport (`Pixel 7`, 412x915).
* Tests:
  1. `fab.spec.ts`: FAB renders on page; clicking opens reel overlay.
  2. `audio-mutex.spec.ts`: Moving from Reel 0 to Reel 1 halts Reel 0 audio immediately and begins Reel 1 audio unmuted.
  3. `voting-proxy.spec.ts`: Upvoting inside Reel triggers the underlying Reddit `<shreddit-post>` vote event.
  4. `virtualization.spec.ts`: Ensures non-visible video elements are paused and detached to protect mobile RAM.
