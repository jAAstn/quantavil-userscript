# AGENTS.md

Guidance for agentic development on the **Reddit Reel Mode** userscript (`reddit-reels`).

---

## 🏛️ Architecture & Modularity

- **File Size & Decomposition**: Keep source files focused and under 150 lines. Never create monolithic orchestrators.
  - `src/cards/`: Discussion text cards and external link preview cards.
  - `src/core/`: Feed transformation, scroll snap, input/touch controllers, unconstrainer logic.
  - `src/extractor/`: `<shreddit-post>` DOM extraction, metadata parsing, and native vote proxying.
  - `src/media/`: Single-media audio mutex (`AudioManager`) and video resolvers.
  - `src/styles/`: Domain-specific stylesheets (`base`, `feed`, `cards`, `gallery`, `overlay`, `top-bar`).
  - `src/ui/`: Floating controls, overlay actions, author badges, and pulse animations.
- **No Inline Styles**: Avoid sprawling inline `element.style` modifications; prefer dedicated scoped CSS classes prefixed with `.rr-`.
- **Clean Teardown Contract**: Exiting Reel Mode must cleanly reverse all injected DOM (`.rr-post-overlay`, card containers, embedded iframes) and restore original dimensions/attributes without leaving native feeds collapsed or overlapped.

---

## 🔊 Audio & Playback Contract

- **Single-Media Focus Mutex**: `AudioManager` is the sole authority for media playback.
- **Zero Audio Bleed**: Navigating between posts must immediately pause, mute, and reset all previous video elements and embedded iframes. Overlapping audio is strictly prohibited.
- **Default State**: Audio begins unmuted by default unless explicitly toggled off by the user. Mute state persists across page reloads.
- **RedGifs & External Iframe Protocol**: RedGifs embed iframes (`https://*.redgifs.com/ifr/*`) run the userscript directly in their context. The `redgifs-bridge` synchronizes mute, volume, and playback in real-time via `postMessage` (`SET_AUDIO`, `PAUSE`, `PLAY`) and shared `GM_getValue` storage without mutating `iframe.src` (which avoids destructive reloading).

---

## 📐 Aspect Ratio & Media Sizing

- **Aspect Ratio Rule**: Use `(height / width) >= 1.5` as the threshold for vertical videos (`object-fit: cover`).
- **Meme Letterboxing**: Square (`1:1`) and `4:5` videos MUST use `object-fit: contain` to ensure text, titles, and bottom punchlines are never cropped.
- **Fit/Fill Toggle**: Allow users to toggle between contain and cover via double-tap or manual action.
- **Multi-Image Galleries**: Preserve horizontal swipe snapping (`scroll-snap-type: x mandatory`) and contain lightbox images. Do not inject destructive scroll containers into Reddit's native carousel `shadowRoot`; promote lazy images eagerly instead.
- **External Hosts**: RedGifs, Streamable, and Gfycat must be classified as video embeds and rendered via responsive autoplaying iframes.

---

## 💬 Captions & Subtitles

- Subtitles and closed captions must be toggleable via the overlay `CC` button and keyboard shortcut `C`.
- State must persist in `localStorage` (`@reddit-reels/subtitles`) and be applied consistently across all video slides.

---

## 🛡️ Anti-Rate-Limit & DOM Synchronization

- **Zero External API Calls**: Do not make unauthenticated `.json` requests to Reddit endpoints (avoids 429 rate limits and Cloudflare challenges).
- **DOM Streaming**: Use `MutationObserver` on the native feed to passively stream newly appended `<shreddit-post>` elements.
- **Vote Delegation**: Proxy upvotes and downvotes directly to Reddit's native DOM buttons to preserve CSRF tokens, sessions, and karma safely.

---

## 🎨 UI & Design Principles

- **Flat Minimalist AMOLED**: Maintain true black (`#000000`) and dark neutral surfaces (`#141518`, `#1c1d22`).
- **Centered Card Layout**: Always use symmetric container padding (`padding: 16px` mobile, `32px` desktop) and `margin: 0 auto` on cards so discussion/link cards are centered horizontally and vertically.
- **CSS Selector Scoping**: Never write `:not(html.rr-active) .selector` (ancestors like `body` override active styles due to specificity). Prefer default-hidden `.selector { display: none !important; }` and active `.rr-active .selector { display: flex !important; }`.
- **Touch & Mobile Ergonomics**: Respect mobile safe areas (`env(safe-area-inset-*)`). Ensure all tap targets are at least `44x44px`.

---

## 🧪 Testing & Verification

- **Test Directory**: All unit tests MUST live outside `src/`, in `tests/unit/`.
- **Run Unit Tests**:
  ```bash
  bun test tests/unit
  ```
- **Build Verification**:
  ```bash
  bun run build
  ```
- **Build Output**: Ensure `dist/reddit-reels.user.js` builds cleanly with `// @license MIT` in the userscript header.
- **GreasyFork Compliance & Formatting**: The userscript bundle must be completely unminified (`minify: false`, `cssMinify: false` in `vite.config.ts`) and unobfuscated to comply with GreasyFork transparency rules. Userscript metadata must specify a comprehensive `@description`, `@homepage`, `@supportURL`, and `@license MIT`.
