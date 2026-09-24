# AGENT — better-wallhaven

## Overview
A userscript (Better Wallhaven v1.0.0) for wallhaven.cc listing grids: adjustable thumbnail size, persistent detail strip below every thumbnail (free chips + always-visible SVG actions + expander for HD size/props/tags), image click opens externally, zero-fetch browsing, opt-in 4KB API details, lightbox, keyboard nav, cached metadata, mobile-safe (no hover dependency, 34px targets). No sidebar — the grid is full-width. Built using Bun, Vite, TypeScript, and `vite-plugin-monkey`.

## Structure
- `tsconfig.json`: TypeScript configuration specifying ESNext, strict types, and vite-plugin-monkey typings.
- `vite.config.ts`: Vite build configuration mapping client script compiling output metadata.
- `src/styles.ts`: CSS tokens + grid var + thumb overlay + grid bar + sidebar + lightbox via GM_addStyle.
- `src/cache.ts`: LocalStorage and session-map metadata caching.
- `src/api.ts`: 4KB `api/v1/w/<id>` JSON first (`parseApiMeta`), legacy 32KB HTML scrape fallback only.
- `src/extract.ts`: Zero-network listing DOM parse (id, res, favs, category, purity, type, thumbUrl) + `largerThumb`.
- `src/icons.ts`: Inline SVG set (download, expand, open, star, zap, close, prev/next, sliders).
- `src/controls.ts`: Grid size bar (160-480px, `whGridSize` persist, CSS `--wh-cell`).
- `src/thumbs.ts`: Below-strip host per thumbnail + MutationObserver for infinite scroll + dl state.
- `src/detail.ts`: Pure HD block builder (free stats + HD props/tags).
- `src/download.ts`: `dlFile` + `fileNameOf` shared by grid strip and lightbox.
- `src/controls.ts`: Native searchbar grid control (floating fallback).
- `src/grid.ts`: Center-based grid navigation using bounding rect.
- `src/lightbox.ts`: High-resolution lightbox with SVG bar + instant thumb preview.
- `src/main.ts`: Loader, grid control, strip delegation, details expander, key router (Enter opens externally).

## Conventions
- Modular TypeScript structure compiled into a single Userscript (`dist/better-wallhaven.user.js`) via Vite.
- TypeScript follows 2026 strict practice: `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedIndexedAccess`; `unknown` over `any` at API boundaries; tests included in `typecheck` (`bun run typecheck`, `bun test`, `bun run build` all green before commit).
- Selection browsing costs 0 bytes; per-thumb overlay renders free DOM data only. Full fetch (4KB API) happens only on explicit download / HD / fullscreen.
- SVG icons only in new UI (`src/icons.ts`); no emoji glyphs.
- Intercepts clicks via event delegation (works with infinite scroll). Double-click opens details natively.

## Dependencies & Setup
- Built via Bun and Vite.
- Run `bun run build` to generate the userscript.
- Requires Tampermonkey/Violentmonkey context supporting `GM_addStyle`, `GM_xmlhttpRequest`, `GM_download`.

## Critical Information
- Grid size persists to `localStorage` (`whGridSize`) and applies to every thumbnail via CSS `--wh-cell` / `--wh-cell-h` (`!important` beats the native inline `300x200`).
- No sidebar: `#main` keeps its native full width; all details render in the per-thumbnail `.wh-sheet`.

## Insights
- Per-thumb overlays use free DOM data only; old parallel HEAD lookups caused rate-limits. All full info is opt-in per click (4KB API, cached).
- Grid size via CSS `--wh-cell` override beats inline `300x200` without layout thrash; persist `whGridSize`.
- Audit fixes: sidebar restores full session props/tags on revisit (was free-fields only); failed API/HD attempts are evicted from session cache so retry refetches; lightbox previews the larger `lg` thumb; `fmtSize` deduped into `fmtSz`; fav sync also matches `.wall-favs`.
- Native stacking: wallhaven's `a.preview` sits at z-index 110 over the whole thumb; overlay-era layers had to clear it (verified with Playwright hit-testing). Current below-strip buttons sit outside the figure, unaffected.
- Native `.thumb-info` hover bar clips mid-transition (sliced star); hidden since the strip duplicates res/favs/type — favorite kept via proxied native clicks + state mirror.
- HD block uses CSS grid (never float `dt`/`dd`), tabular numerals, tag-margin reset against native `.tag` styles.
- No repeated data: chips row owns res/favs/type; the HD block headlines file size only and omits Resolution/Favorites/Type rows.
- Stale persistent entries (size without props) render size instantly on expand, then upgrade via background API refetch.
- Not fixed (false positives): `as any` in test DOM stubs, `makeAbsolute` (fallback + tested), `GRID_KEY` export (public API), legacy `size` branch in cache (real old installs).

## Blunders
- [2026-07-03] Failed to write MEMORY.md using ArtifactMetadata in write_to_file -> ArtifactMetadata is only valid for files written inside the chat-specific brain artifacts folder -> Omitted ArtifactMetadata for writing files in the workspace.
