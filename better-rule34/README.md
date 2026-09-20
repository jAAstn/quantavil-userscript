# Better Rule34Video

> **NOTE (user):** `@match` is currently pointed at the placeholder host
> `rule35video.com`. To switch back to Rule34, change the two match lines in
> `vite.config.ts` back to `rule34video.com`, run `bun run build`, and
> reinstall the userscript.

Industrial brutalist userscript for [Rule34Video.com](https://rule34video.com/). Replaces native navigation and clutter with a floating vertical telemetry console, instant client-side filtering, card framing, ad removal, and infinite scroll.

Zero emojis. Carbon substrate, monospace readouts, and neon hazard magenta (`#ff0055`) accents.

## Features

- **Vertical Console (`[ CTRL ]`)**: Bottom-right floating console (`290px`) with live search, 4 tactile sliders (Rating, Views, Duration, Vintage), 4 quick toggles (Sound, HD, Futa, Unwatched), and reset-to-defaults. Slider/toggle settings persist across visits; keyword search stays ephemeral by design.
- **Open in New Tab**: Plain left-click on any card opens the video in a new tab (`noopener`); middle-click and Ctrl/Cmd-click keep native behavior. Clicked videos are remembered locally to power the Unwatched toggle.
- **Page Bookmark (icon only)**: Small bookmark SVG button docked left of `[ CTRL ]`. Click saves the current page; click again jumps straight back to its URL (same tab, safe at any depth); right-click removes it. One bookmark per listing.
- **Page Separators**: Infinite-scroll batches are divided by a `[ PAGE N ]` divider so you can tell which cards came from which page.
- **Card Framing**: Substrate border framing with hover glow, clamped 2-line titles (`2.7em`), non-overlapping rating/views meta row, hidden relative time (`x min ago`), and hidden card comments (watch-page comments untouched).
- **Native Player Integrity**: Leaves thumbnail time, sound, HD badges, video timeline scrubbers, and loading progress indicators unhindered by custom CSS so native site video preview works seamlessly.
- **Auto Next Page**: Seamless infinite scroll that neutralizes container overflow clipping, carries active search queries, and fixes lazy-loaded thumbnails.
- **Ad Removal**: Strips sponsored thumbs, redirect links, network banners, and iframe trackers.

## Development

```bash
bun install        # Install dependencies
bun test           # Run unit tests
bun run typecheck  # Typecheck TypeScript
bun run build      # Build dist/better-rule34.user.js
```

## Installation

1. Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/).
2. Load [`dist/better-rule34.user.js`](dist/better-rule34.user.js).
3. Open [rule34video.com](https://rule34video.com/).

