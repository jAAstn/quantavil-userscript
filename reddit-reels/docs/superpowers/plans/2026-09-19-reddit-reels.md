# Reddit Reel Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a high-performance Reddit Userscript (Tampermonkey/Violentmonkey) that adds a full-screen vertical swipe "Reel Mode" with audio unmuted by default, strict zero-overlap audio switching, native upvote/downvote delegation, and RedGifs/Reddit video support.

**Architecture:** A lightweight client-side application built with TypeScript and Preact, bundled via `vite-plugin-monkey`. It reads posts directly from Reddit's mobile DOM (`<shreddit-post>`), uses an Audio Focus Manager to enforce strict single-audio playback with pre-primed mobile permissions, resolves RedGifs and native Reddit video streams, proxies voting actions to Reddit's native DOM elements, and validates all interactions with a mobile Playwright test rig.

**Tech Stack:** TypeScript, Bun, Vite, `vite-plugin-monkey`, Preact, Playwright

**Spec:** [docs/superpowers/specs/2026-09-19-reddit-reels-design.md](file:///home/quantavil/Projects/reddit-reels/docs/superpowers/specs/2026-09-19-reddit-reels-design.md)

## Global Constraints
- Target mobile and desktop browsers on `https://*.reddit.com/*`.
- Audio must play unmuted by default without overlapping when swiping between reels.
- Zero external rate limits: read directly from Reddit's active page DOM and observe additions with `MutationObserver`.
- Safe voting: proxy user clicks directly to Reddit's native `<shreddit-post>` vote buttons.
- Fully automated Playwright mobile test suite to verify UI, audio mutex, and voting sync.

---

### Task 1: Project Scaffolding & Build Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/style.css`

**Interfaces:**
- Produces: Working build system producing `dist/reddit-reels.user.js` via `bun run build`.

- [ ] **Step 1: Create package.json and tsconfig.json**
- [ ] **Step 2: Install dependencies (vite, vite-plugin-monkey, preact, typescript)**
- [ ] **Step 3: Configure vite.config.ts with Userscript metadata**
- [ ] **Step 4: Create entry point src/main.tsx and verify build succeeds**

---

### Task 2: DOM Ingestion & Native Action Proxying

**Files:**
- Create: `src/extractor/types.ts`
- Create: `src/extractor/dom-extractor.ts`
- Create: `src/extractor/vote-proxy.ts`

**Interfaces:**
- Produces: `extractPosts(): ReelPost[]`, `observeNewPosts(callback: (posts: ReelPost[]) => void): () => void`, `proxyUpvote(post: ReelPost): void`, `proxyDownvote(post: ReelPost): void`.

- [ ] **Step 1: Define ReelPost interface and types**
- [ ] **Step 2: Implement dom-extractor.ts targeting <shreddit-post> elements**
- [ ] **Step 3: Implement vote-proxy.ts to trigger native clicks on Reddit vote buttons**
- [ ] **Step 4: Unit test DOM extraction and vote proxying**

---

### Task 3: Media Resolvers & Audio Focus Manager

**Files:**
- Create: `src/media/types.ts`
- Create: `src/media/redgifs-resolver.ts`
- Create: `src/media/reddit-resolver.ts`
- Create: `src/media/audio-manager.ts`

**Interfaces:**
- Produces:
  - `resolveMedia(post: ReelPost): Promise<ResolvedMedia>`
  - `audioManager.requestPlayback(video: HTMLVideoElement): void`
  - `audioManager.stopAll(): void`
  - `audioManager.toggleMute(): boolean`
  - `audioManager.isMuted: boolean`

- [ ] **Step 1: Implement Audio Focus Manager with strict single-media mutex**
- [ ] **Step 2: Implement RedGifs resolver with token/direct fallback and HD/SD handling**
- [ ] **Step 3: Implement Reddit native video resolver**
- [ ] **Step 4: Unit test audio manager and media resolvers**

---

### Task 4: Reel Overlay UI & Floating Action Button

**Files:**
- Create: `src/ui/ReelOverlay.tsx`
- Create: `src/ui/ReelSlide.tsx`
- Create: `src/ui/ActionRail.tsx`
- Create: `src/ui/CommentsDrawer.tsx`
- Create: `src/ui/FabButton.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `dom-extractor`, `vote-proxy`, `audio-manager`, `media-resolvers`
- Produces: Fullscreen interactive Reel experience mounted to DOM on demand.

- [ ] **Step 1: Implement FabButton and mount to Reddit page**
- [ ] **Step 2: Implement ReelSlide with single-video lifecycle and sound state**
- [ ] **Step 3: Implement ActionRail with Upvote, Downvote, Sound, Comments, Share, and Close**
- [ ] **Step 4: Implement CommentsDrawer slide-up bottom sheet**
- [ ] **Step 5: Implement ReelOverlay with scroll-snap and active slide tracking**

---

### Task 5: Playwright Mobile Test Suite & Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/fixtures/mock-reddit.html`
- Create: `tests/fab.spec.ts`
- Create: `tests/audio-mutex.spec.ts`
- Create: `tests/voting-proxy.spec.ts`

**Interfaces:**
- Tests all core requirements in headless Chromium with mobile viewport.

- [ ] **Step 1: Set up Playwright configuration and local fixture server**
- [ ] **Step 2: Implement test for FAB injection and opening overlay**
- [ ] **Step 3: Implement test verifying audio plays on active reel and stops cleanly on swipe**
- [ ] **Step 4: Implement test verifying Upvote proxies to underlying Reddit post**
- [ ] **Step 5: Run Playwright test suite and confirm all tests pass**
