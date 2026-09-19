# Modular Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the monolithic `src/main.tsx` and `src/style.css` into single-responsibility modules, move all test files outside `src/` to `tests/unit/`, and verify test and build integrity.

**Architecture:** Domain-sliced modular structure: `src/core/` (lifecycle, unconstrainer, input), `src/cards/` (discussion & link cards), `src/ui/` (top bar, action rail overlay, pulses), `src/styles/` (modular CSS), and `tests/unit/` for all test suites.

**Tech Stack:** TypeScript, Preact Signals, Bun Test, Playwright, Vite, Vite Plugin Monkey.

**Spec:** `docs/superpowers/specs/2026-09-19-modular-architecture-design.md`

## Global Constraints
- Zero test files inside `src/`.
- No file exceeding ~150 lines.
- No regression in existing functionality (27 passing unit tests, Playwright visual tests).
- Flat minimalist design retained.

---

### Task 1: Relocate tests outside `src/`
**Files:**
- Move: `src/media/media.test.ts` -> `tests/unit/media.test.ts`
- Modify: `package.json` (`test:unit` script)

- [x] **Step 1: Move media.test.ts to tests/unit/**
- [x] **Step 2: Update package.json test scripts**
- [x] **Step 3: Run `bun test tests/unit` and verify all 27 tests pass**
- [x] **Step 4: Commit changes**

---

### Task 2: Split monolithic `src/style.css` into modular sheets
**Files:**
- Create: `src/styles/base.css`
- Create: `src/styles/feed.css`
- Create: `src/styles/overlay.css`
- Create: `src/styles/top-bar.css`
- Create: `src/styles/cards.css`
- Create: `src/styles/gallery.css`
- Create: `src/styles/index.css`
- Modify: `src/style.css` (import `styles/index.css` or redirect)

- [x] **Step 1: Extract domain CSS into modular files**
- [x] **Step 2: Aggregate in `src/styles/index.css`**
- [x] **Step 3: Verify visual tests still load styles cleanly**
- [x] **Step 4: Commit changes**

---

### Task 3: Extract Card Components (`text-card.ts`, `link-card.ts`)
**Files:**
- Create: `src/cards/text-card.ts`
- Create: `src/cards/link-card.ts`
- Create: `src/cards/index.ts`

- [x] **Step 1: Implement `renderTextCard` in `src/cards/text-card.ts`**
- [x] **Step 2: Implement `renderLinkCard` in `src/cards/link-card.ts`**
- [x] **Step 3: Export from `src/cards/index.ts`**
- [x] **Step 4: Commit changes**

---

### Task 4: Extract UI Components (`pulse.ts`, `top-bar.ts`, `overlay.ts`)
**Files:**
- Create: `src/ui/pulse.ts`
- Create: `src/ui/top-bar.ts`
- Create: `src/ui/overlay.ts`
- Modify: `src/ui/index.ts`

- [x] **Step 1: Implement `showPlayPulse` and `showScalePulse` in `src/ui/pulse.ts`**
- [x] **Step 2: Implement `createTopBar` and `syncTopBarState` in `src/ui/top-bar.ts`**
- [x] **Step 3: Implement `renderReelOverlay` in `src/ui/overlay.ts`**
- [x] **Step 4: Commit changes**

---

### Task 5: Extract Core Subsystems (`unconstrainer.ts`, `input-controller.ts`, `feed-manager.ts`)
**Files:**
- Create: `src/core/unconstrainer.ts`
- Create: `src/core/input-controller.ts`
- Create: `src/core/feed-manager.ts`
- Create: `src/core/index.ts`

- [x] **Step 1: Implement `unconstrainPostMedia` and `unconstrainPlayerShadow` in `src/core/unconstrainer.ts`**
- [x] **Step 2: Implement `initInputController` (keyboard hotkeys, tap gestures) in `src/core/input-controller.ts`**
- [x] **Step 3: Implement `FeedManager` (IntersectionObserver, scroll snapping, mutation observer) in `src/core/feed-manager.ts`**
- [x] **Step 4: Commit changes**

---

### Task 6: Connect Bootstrap Entrypoint and Clean Up Monolith
**Files:**
- Modify: `src/index.ts`
- Modify: `src/main.tsx`

- [x] **Step 1: Wire modules together in `src/main.tsx` as lightweight coordinator**
- [x] **Step 2: Verify `src/index.ts` runtime exports**
- [x] **Step 3: Run `bun test tests/unit`**
- [x] **Step 4: Commit changes**

---

### Task 7: End-to-End Verification & Production Build
**Files:**
- Verify: `tests/visual-test.ts`
- Build: `dist/reddit-reels.user.js`

- [x] **Step 1: Run full Playwright visual suite `bun run tests/visual-test.ts`**
- [x] **Step 2: Build production bundle `bun run build`**
- [x] **Step 3: Final commit**
