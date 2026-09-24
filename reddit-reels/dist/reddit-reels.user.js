// ==UserScript==
// @name         Reddit Reels
// @namespace    https://github.com/quantavil/userscript/tree/main/reddit-reels
// @version      1.3.0
// @author       quantavil
// @description  Swipe Reddit feeds like reels: unmuted playback, galleries, and native voting.
// @license      MIT
// @homepage     https://github.com/quantavil/userscript/tree/main/reddit-reels
// @supportURL   https://github.com/quantavil/userscript/issues
// @match        https://*.reddit.com/*
// @match        https://reddit.com/*
// @match        https://*.redgifs.com/ifr/*
// @match        https://www.redgifs.com/ifr/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// ==/UserScript==

(t=>{if(typeof GM_addStyle=="function"){GM_addStyle(t);return}const n=document.createElement("style");n.textContent=t,document.head.append(n)})(` :root {
  --rr-z-fab: 99999;
  --rr-z-reels: 2147483640;
  --rr-z-overlay: 2147483645;
  --rr-font-stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --rr-primary: #ff4500;
  --rr-surface-glass: rgba(18, 22, 30, 0.72);
  --rr-border-glass: rgba(255, 255, 255, 0.12);
  --rr-highlight-glass: rgba(255, 255, 255, 0.22);
}

/* =========================================================
   Floating Action Button (Launcher)
   ========================================================= */

#rr-fab,
.rr-fab,
#reddit-reels-fab {
  position: fixed !important;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
  right: calc(20px + env(safe-area-inset-right, 0px)) !important;
  z-index: var(--rr-z-fab) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 54px !important;
  height: 54px !important;
  border-radius: 9999px !important;
  background: #ff4500 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35) !important;
  cursor: pointer !important;
  border: none !important;
  outline: none !important;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease !important;
  user-select: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

#rr-fab:hover,
.rr-fab:hover,
#reddit-reels-fab:hover {
  transform: scale(1.06) !important;
  background: #e03d00 !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45) !important;
}

#rr-fab:active,
.rr-fab:active,
#reddit-reels-fab:active {
  transform: scale(0.95) !important;
}

#rr-fab svg,
.rr-fab svg,
.rr-fab-icon,
#reddit-reels-fab svg {
  width: 26px !important;
  height: 26px !important;
  fill: none !important;
  stroke: currentColor !important;
  stroke-width: 2.2 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}

/* Hide FAB when Reels mode is active */
html.rr-active #rr-fab-container,
html.rr-active #rr-fab,
html.rr-active .rr-fab,
html.rr-active #reddit-reels-fab {
  display: none !important;
}

/* =========================================================
   Feedback Pulses (Play/Pause, Fit/Fill)
   ========================================================= */

.rr-play-pulse {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 76px !important;
  height: 76px !important;
  border-radius: 9999px !important;
  background: rgba(18, 22, 30, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #ffffff !important;
  pointer-events: none !important;
  z-index: 2147483646 !important;
  animation: rr-pulse-fade 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
}

.rr-play-pulse svg {
  width: 36px !important;
  height: 36px !important;
  fill: currentColor !important;
}

.rr-scale-pulse {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  padding: 10px 20px !important;
  border-radius: 9999px !important;
  background: #181a1f !important;
  border: 1px solid #30323a !important;
  color: #ffffff !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  letter-spacing: 0.3px !important;
  pointer-events: none !important;
  z-index: 2147483646 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
  animation: rr-pulse-fade 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
}

@keyframes rr-pulse-fade {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.65);
  }
  35% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.08);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.15);
  }
}
/* =========================================================
   Fullscreen Reels Feed & Snap-Scroll Rules
   ========================================================= */

/* Root Lock */
html.rr-active,
html.rr-active body {
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  background: #000000 !important;
  color: #ffffff !important;
  touch-action: pan-y !important;
  -webkit-user-select: none;
  user-select: none;
}

/* Suppress all Reddit outer framing in Reel Mode */
html.rr-active header,
html.rr-active nav,
html.rr-active aside,
html.rr-active footer,
html.rr-active .bottom-nav,
html.rr-active [slot="header"],
html.rr-active reddit-header-large,
html.rr-active reddit-header-small,
html.rr-active shreddit-async-loader[bundlename="bottom_bar"],
html.rr-active shreddit-async-loader[bundlename="header"],
html.rr-active shreddit-async-loader[bundlename="subgrid"],
html.rr-active shreddit-comment-jump-button,
html.rr-active reddit-comment-jump-button,
html.rr-active .comment-jump-button,
html.rr-active shreddit-async-loader[bundlename*="comment_jump"],
html.rr-active shreddit-async-loader[bundlename*="floating"],
html.rr-active shreddit-floating-action-bar,
html.rr-active floating-action-bar,
html.rr-active [data-testid*="floating" i],
html.rr-active [data-testid*="comment-jump" i],
html.rr-active shreddit-back-to-top-button,
html.rr-active back-to-top-button,
html.rr-active faceplate-tracker[source="floating_action_bar"],
html.rr-active [slot="floating-action-bar"] {
  display: none !important;
  visibility: hidden !important;
}

/* Post Container / Scroll Track */
html.rr-active #subgrid-container,
html.rr-active main,
html.rr-active .main-container,
html.rr-active #posts-container,
html.rr-active [data-testid="posts-list"],
html.rr-active .rr-feed-container {
  height: 100dvh !important;
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow-y: scroll !important;
  overflow-x: hidden !important;
  scroll-snap-type: y mandatory !important;
  overscroll-behavior-y: contain !important;
  scrollbar-width: none !important; /* Firefox */
  background: #000000 !important;
  display: block !important;
}

html.rr-active #subgrid-container::-webkit-scrollbar,
html.rr-active main::-webkit-scrollbar,
html.rr-active #posts-container::-webkit-scrollbar,
html.rr-active .rr-feed-container::-webkit-scrollbar {
  display: none !important;
}

/* Single Reel Slide (shreddit-post or article) */
html.rr-active shreddit-post,
html.rr-active .rr-feed-container > article,
html.rr-active .rr-feed-container > div[data-testid="post-container"] {
  height: 100dvh !important;
  width: 100vw !important;
  min-height: 100dvh !important;
  max-height: 100dvh !important;
  min-width: 100vw !important;
  max-width: 100vw !important;
  scroll-snap-align: start !important;
  scroll-snap-stop: always !important;
  position: relative !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  background: #000000 !important;
  box-sizing: border-box !important;
}

/* Ensure post media wrapper fills viewport */
html.rr-active shreddit-post [slot="post-media-container"],
html.rr-active shreddit-post .media-container,
html.rr-active .rr-feed-container .media-container,
html.rr-active shreddit-post shreddit-aspect-ratio,
html.rr-active shreddit-post shreddit-player-2 {
  position: absolute !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  max-width: 100vw !important;
  max-height: 100dvh !important;
  min-height: 100dvh !important;
  --max-height: 100dvh !important;
  --max-width: 100vw !important;
  aspect-ratio: unset !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 5 !important;
}

/* Standalone Video, Iframe, and Single Image Sizing (Excluding Carousels) */
html.rr-active shreddit-post video,
html.rr-active shreddit-post iframe,
html.rr-active shreddit-post .rr-embedded-iframe,
html.rr-active shreddit-post:not(.rr-is-link):not(:has(gallery-carousel, faceplate-carousel)) img:not(.rr-link-card-thumb):not(.shreddit-subreddit-icon__icon):not(.post-background-image-filter),
html.rr-active .rr-feed-container video,
html.rr-active .rr-feed-container iframe,
html.rr-active .rr-feed-container > article:not(.rr-is-link):not(:has(gallery-carousel, faceplate-carousel)) img:not(.rr-link-card-thumb) {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100vw !important;
  max-height: 100dvh !important;
  object-fit: contain !important;
  background: transparent !important;
  border: none !important;
  z-index: 10 !important;
}

/* Unconstrain nested media containers and aspect-ratio wrappers inside shreddit-post (Excluding Carousels) */
html.rr-active shreddit-post:not(:has(gallery-carousel, faceplate-carousel)) [data-aspect-ratio-container],
html.rr-active shreddit-post:not(:has(gallery-carousel, faceplate-carousel)) [data-aspect-ratio-container] > div,
html.rr-active shreddit-post:not(:has(gallery-carousel, faceplate-carousel)) shreddit-media-lightbox-listener,
html.rr-active shreddit-post:not(:has(gallery-carousel, faceplate-carousel)) .media-lightbox-img {
  width: 100% !important;
  height: 100% !important;
  max-width: 100vw !important;
  max-height: 100dvh !important;
  aspect-ratio: unset !important;
  position: absolute !important;
  inset: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* Suppress crosspost leakages inside post-media-container */
html.rr-active shreddit-post [slot="post-media-container"] .crosspost-credit-bar,
html.rr-active shreddit-post [slot="post-media-container"] .crosspost-title,
html.rr-active shreddit-post [slot="post-media-container"] .post-background-image-filter,
html.rr-active shreddit-post [slot="post-media-container"] .text-secondary-plain-weak,
html.rr-active shreddit-post [slot="post-media-container"] div:has(> .text-secondary-plain-weak),
html.rr-active shreddit-post [slot="post-media-container"] > div > .crosspost-credit-bar,
html.rr-active shreddit-post [slot="post-media-container"] > div:not(:has(img, video, gallery-carousel, faceplate-carousel, shreddit-aspect-ratio, [data-aspect-ratio-container])),
html.rr-active shreddit-post [slot="post-media-container"] > .pointer-events-none.border-sm {
  display: none !important;
  visibility: hidden !important;
}

/* Vertical video full-bleed scaling: fills 100% width and height without letterbox bars */
html.rr-active shreddit-post.rr-has-vertical-video video,
html.rr-active shreddit-post video.rr-vertical-video,
html.rr-active .rr-feed-container video.rr-vertical-video,
html.rr-active shreddit-post[data-vertical-video="true"] video {
  object-fit: cover !important;
}

/* User toggle overrides (Video and Single Image) */
html.rr-active shreddit-post.rr-fit-contain video,
html.rr-active shreddit-post.rr-fit-contain iframe,
html.rr-active shreddit-post.rr-fit-contain img {
  object-fit: contain !important;
}

html.rr-active shreddit-post.rr-fit-cover video,
html.rr-active shreddit-post.rr-fit-cover iframe,
html.rr-active shreddit-post.rr-fit-cover img {
  object-fit: cover !important;
}

/* Subtitles / Closed Captions Suppression when disabled */
html.rr-active.rr-hide-captions ::cue,
html.rr-active shreddit-post.rr-hide-captions ::cue,
html.rr-active.rr-hide-captions .captions-display,
html.rr-active.rr-hide-captions [data-testid="captions"],
html.rr-active.rr-hide-captions shreddit-player-captions,
html.rr-active.rr-hide-captions .caption-wrapper,
html.rr-active.rr-hide-captions .caption-container,
html.rr-active.rr-hide-captions [part="captions"],
html.rr-active shreddit-post.rr-hide-captions .captions-display,
html.rr-active shreddit-post.rr-hide-captions [data-testid="captions"],
html.rr-active shreddit-post.rr-hide-captions shreddit-player-captions,
html.rr-active shreddit-post.rr-hide-captions .caption-wrapper,
html.rr-active shreddit-post.rr-hide-captions .caption-container,
html.rr-active shreddit-post.rr-hide-captions [part="captions"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Suppress native Reddit UI in slides (vote slots use off-screen hiding so proxy clicks work) */
html.rr-active shreddit-post [slot="credit-bar"],
html.rr-active shreddit-post [slot="post-credit-bar"],
html.rr-active shreddit-post [slot="title-and-metadata"],
html.rr-active shreddit-post [slot="title"],
html.rr-active shreddit-post [slot="action-row"],
html.rr-active shreddit-post [slot="text-body"],
html.rr-active shreddit-post shreddit-post-action-row,
html.rr-active shreddit-post feed-post-action-row,
html.rr-active shreddit-post shreddit-post-credit-bar,
html.rr-active shreddit-post shreddit-action-bar,
html.rr-active shreddit-post rpl-action-bar,
html.rr-active shreddit-post shreddit-interaction-container,
html.rr-active shreddit-post faceplate-tracker,
html.rr-active .rr-native-suppressed {
  display: none !important;
  visibility: hidden !important;
}

/* Vote targets stay in DOM and clickable via proxy (off-screen, not display:none) */
html.rr-active shreddit-post [slot="vote"],
html.rr-active shreddit-post [slot="vote-button"],
html.rr-active shreddit-post shreddit-post-vote-control,
html.rr-active shreddit-post [data-testid="post-vote-control"],
html.rr-active .rr-native-offscreen {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
  overflow: hidden !important;
}

/* Bare media taps must not navigate: only explicit overlay/card buttons open URLs */
html.rr-active shreddit-post a[data-click-id="body"],
html.rr-active shreddit-post a[slot="full-post-link"],
html.rr-active shreddit-post [slot="post-media-container"] a:not(.rr-sub-badge):not(.rr-author),
html.rr-active shreddit-post shreddit-media-lightbox-listener a {
  pointer-events: none !important;
}

html.rr-active .rr-post-overlay a,
html.rr-active .rr-link-card-container a,
html.rr-active .rr-text-card-container a {
  pointer-events: auto !important;
}

/* Videos-only filter: scoped under html.rr-active so exit automatically restores visibility */
html.rr-active shreddit-post.rr-filtered-out,
html.rr-active .rr-feed-container > article.rr-filtered-out,
html.rr-active .rr-feed-container > div.rr-filtered-out {
  display: none !important;
}

/* Hide any injected iframes when Reel Mode is inactive */
.rr-embedded-iframe {
  display: none !important;
}

html.rr-active .rr-embedded-iframe {
  display: block !important;
}
/* =========================================================
   Multiple-Image Gallery & Carousel Fullscreen Layout
   ========================================================= */

html.rr-active shreddit-post gallery-carousel,
html.rr-active shreddit-post faceplate-carousel,
html.rr-active shreddit-post shreddit-async-loader:has(gallery-carousel, faceplate-carousel),
html.rr-active shreddit-post [data-testid="media-gallery"] {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  --gallery-initial-height: 100% !important;
  display: block !important;
  overflow: hidden !important;
  z-index: 6 !important;
  background: #000000 !important;
  touch-action: pan-x pan-y !important;
}

html.rr-active shreddit-post gallery-carousel ul[slot="items"],
html.rr-active shreddit-post faceplate-carousel ul[slot="items"],
html.rr-active shreddit-post gallery-carousel .carousel-items,
html.rr-active shreddit-post faceplate-carousel .carousel-items {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  height: 100% !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  align-items: center !important;
  list-style: none !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scroll-snap-type: x mandatory !important;
  scroll-behavior: smooth !important;
  scrollbar-width: none !important;
  touch-action: pan-x pan-y !important;
}

html.rr-active shreddit-post gallery-carousel ul::-webkit-scrollbar,
html.rr-active shreddit-post faceplate-carousel ul::-webkit-scrollbar {
  display: none !important;
}

html.rr-active shreddit-post gallery-carousel ul[slot="items"] > li,
html.rr-active shreddit-post faceplate-carousel ul[slot="items"] > li,
html.rr-active shreddit-post gallery-carousel .carousel-item,
html.rr-active shreddit-post faceplate-carousel .carousel-item {
  flex: 0 0 100% !important;
  flex-shrink: 0 !important;
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  max-height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  scroll-snap-align: center !important;
  scroll-snap-stop: always !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  touch-action: pan-x pan-y !important;
}

html.rr-active shreddit-post gallery-carousel figure,
html.rr-active shreddit-post faceplate-carousel figure,
html.rr-active shreddit-post gallery-carousel [data-aspect-ratio-container],
html.rr-active shreddit-post faceplate-carousel [data-aspect-ratio-container] {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
}

html.rr-active shreddit-post gallery-carousel img:not(.post-background-image-filter):not(.shreddit-subreddit-icon__icon),
html.rr-active shreddit-post faceplate-carousel img:not(.post-background-image-filter):not(.shreddit-subreddit-icon__icon),
html.rr-active shreddit-post gallery-carousel .media-lightbox-img,
html.rr-active shreddit-post faceplate-carousel .media-lightbox-img {
  position: relative !important;
  inset: auto !important;
  max-width: 100% !important;
  max-height: 100% !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  display: block !important;
  margin: auto !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* Blurred backdrop copies must never cover the real slide (black-screen cause) */
html.rr-active shreddit-post gallery-carousel img.post-background-image-filter,
html.rr-active shreddit-post faceplate-carousel img.post-background-image-filter,
html.rr-active shreddit-post gallery-carousel [class*="background-image-filter"],
html.rr-active shreddit-post faceplate-carousel [class*="background-image-filter"] {
  display: none !important;
  visibility: hidden !important;
}

/* Gallery image alt-text / caption badges ("[Image 1]") are always suppressed
   in Reel Mode. They are image metadata, NOT video subtitles, so the CC toggle
   must never unhide them. Scoped to carousels (and away from video slides) so
   real video caption layers elsewhere are unaffected. */
html.rr-active shreddit-post gallery-carousel figcaption,
html.rr-active shreddit-post faceplate-carousel figcaption,
html.rr-active shreddit-post gallery-carousel [slot="caption"],
html.rr-active shreddit-post faceplate-carousel [slot="caption"],
html.rr-active shreddit-post gallery-carousel .gallery-caption,
html.rr-active shreddit-post faceplate-carousel .gallery-caption,
html.rr-active shreddit-post gallery-carousel .image-caption,
html.rr-active shreddit-post faceplate-carousel .image-caption,
html.rr-active shreddit-post gallery-carousel [data-testid*="alt-text" i],
html.rr-active shreddit-post faceplate-carousel [data-testid*="alt-text" i],
html.rr-active shreddit-post gallery-carousel li:not(:has(video)) [data-testid*="caption" i],
html.rr-active shreddit-post faceplate-carousel li:not(:has(video)) [data-testid*="caption" i] {
  display: none !important;
  visibility: hidden !important;
}

/* Horizontal slide buttons for gallery */
html.rr-active shreddit-post gallery-carousel button[slot="previous-button"],
html.rr-active shreddit-post gallery-carousel button[slot="next-button"],
html.rr-active shreddit-post faceplate-carousel button[slot="previous-button"],
html.rr-active shreddit-post faceplate-carousel button[slot="next-button"],
html.rr-active shreddit-post button.prev-btn,
html.rr-active shreddit-post button.next-btn {
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 25 !important;
  background: rgba(18, 22, 30, 0.65) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 9999px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  opacity: 0.8 !important;
  transition: opacity 0.15s ease, background 0.15s ease !important;
}

html.rr-active shreddit-post gallery-carousel button[slot="previous-button"]:hover,
html.rr-active shreddit-post gallery-carousel button[slot="next-button"]:hover,
html.rr-active shreddit-post faceplate-carousel button[slot="previous-button"]:hover,
html.rr-active shreddit-post faceplate-carousel button[slot="next-button"]:hover,
html.rr-active shreddit-post button.prev-btn:hover,
html.rr-active shreddit-post button.next-btn:hover {
  opacity: 1 !important;
  background: rgba(18, 22, 30, 0.9) !important;
}

/* Hide disabled navigation buttons at carousel boundaries */
html.rr-active shreddit-post gallery-carousel button[disabled],
html.rr-active shreddit-post faceplate-carousel button[disabled],
html.rr-active shreddit-post gallery-carousel button[aria-disabled="true"],
html.rr-active shreddit-post faceplate-carousel button[aria-disabled="true"],
html.rr-active shreddit-post button.prev-btn[disabled],
html.rr-active shreddit-post button.next-btn[disabled] {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

html.rr-active shreddit-post button[slot="previous-button"],
html.rr-active shreddit-post button.prev-btn {
  left: 16px !important;
}

html.rr-active shreddit-post button[slot="next-button"],
html.rr-active shreddit-post button.next-btn {
  right: 16px !important;
}

/* Pagination dots indicators */
html.rr-active shreddit-post gallery-carousel [slot="indicators"],
html.rr-active shreddit-post faceplate-carousel [slot="indicators"],
html.rr-active shreddit-post gallery-carousel [slot="dots"],
html.rr-active shreddit-post faceplate-carousel [slot="dots"],
html.rr-active shreddit-post gallery-carousel [part="indicators"],
html.rr-active shreddit-post faceplate-carousel [part="indicators"],
html.rr-active shreddit-post gallery-carousel .carousel-indicators,
html.rr-active shreddit-post faceplate-carousel .carousel-indicators {
  position: absolute !important;
  bottom: calc(85px + env(safe-area-inset-bottom, 0px)) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 22 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  pointer-events: auto !important;
}
/* =========================================================
   Post Overlay (Metadata & Action Rail)
   ========================================================= */

/* Ensure overlay is completely hidden by default when Reel Mode is inactive */
.rr-post-overlay {
  display: none !important;
  visibility: hidden !important;
}

html.rr-active .rr-post-overlay {
  position: absolute !important;
  inset: 0 !important;
  z-index: 20 !important;
  pointer-events: none !important;
  display: flex !important;
  visibility: visible !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  padding: 16px !important;
  box-sizing: border-box !important;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.45) 0%,
    transparent 18%,
    transparent 65%,
    rgba(0, 0, 0, 0.75) 100%
  ) !important;
}

/* Bottom Left: Post Metadata */
.rr-post-info {
  position: absolute !important;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px)) !important;
  left: 16px !important;
  right: 76px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  pointer-events: auto !important;
  z-index: 25 !important;
}

.rr-post-meta {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 6px !important;
  min-width: 0 !important;
  max-width: 100% !important;
  flex-wrap: nowrap !important;
}

.rr-sub-badge {
  display: inline-flex !important;
  align-items: center !important;
  flex-shrink: 0 !important;
  background: #202126 !important;
  border: 1px solid #30323a !important;
  border-radius: 9999px !important;
  padding: 3px 9px !important;
  color: #ff6b35 !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.2px !important;
  cursor: pointer !important;
  user-select: none !important;
  transition: background 0.15s ease, border-color 0.15s ease !important;
}

.rr-sub-badge:hover {
  background: #2c2e35 !important;
  border-color: #444752 !important;
}

.rr-dot {
  flex-shrink: 0 !important;
  color: rgba(255, 255, 255, 0.5) !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  user-select: none !important;
}

/* Author Username: clickable link, single-line with ellipsis */
.rr-author {
  display: inline-block !important;
  flex-shrink: 1 !important;
  min-width: 0 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  color: rgba(255, 255, 255, 0.78) !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  pointer-events: auto !important;
  cursor: pointer !important;
  user-select: text !important;
  text-decoration: none !important;
  transition: color 0.15s ease, text-decoration 0.15s ease !important;
}

.rr-author:hover {
  color: #ffffff !important;
  text-decoration: underline !important;
}

/* Post Title */
.rr-post-title {
  color: #ffffff !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  letter-spacing: -0.015em !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7) !important;
}

/* Bottom Right: Vertical Action Rail */
.rr-action-rail {
  position: absolute !important;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px)) !important;
  right: 14px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 14px !important;
  pointer-events: auto !important;
  z-index: 25 !important;
}

.rr-action-item {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 3px !important;
}

.rr-action-btn {
  width: 44px !important;
  height: 44px !important;
  border-radius: 9999px !important;
  background: #1c1d22 !important;
  border: 1px solid #30323a !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  padding: 0 !important;
  outline: none !important;
  transition: background 0.15s ease, transform 0.12s ease !important;
  -webkit-tap-highlight-color: transparent !important;
}

.rr-action-btn:hover {
  background: #282a32 !important;
}

.rr-action-btn:active {
  transform: scale(0.92) !important;
}

.rr-action-label {
  font-family: var(--rr-font-stack) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  user-select: none !important;
}

/* Integrated Vote Group Cluster */
.rr-vote-group {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  background: #181a1f !important;
  border: 1px solid #282a32 !important;
  border-radius: 9999px !important;
  padding: 4px !important;
  gap: 2px !important;
}

.rr-vote-group .rr-action-btn {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  width: 40px !important;
  height: 38px !important;
  color: #9a9ca6 !important;
}

.rr-vote-group .rr-action-btn:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.rr-vote-group .rr-score-label {
  font-family: var(--rr-font-stack) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  padding: 1px 0 !important;
  line-height: 1 !important;
}

.rr-upvote-btn.is-active-up {
  color: #ff4500 !important;
}

.rr-downvote-btn.is-active-down {
  color: #7193ff !important;
}

/* CC on (enabled): plain white icon on the standard dark pill.
   CC off (disabled): dimmed grey icon. No accent color. */
.rr-action-btn.rr-cc-btn.is-active-cc {
  background: #1c1d22 !important;
  border-color: #565a66 !important;
  color: #ffffff !important;
}

.rr-action-btn.rr-cc-btn:not(.is-active-cc) {
  color: #888d99 !important;
}
/* =========================================================
   Top Bar Navigation & Filter Buttons
   ========================================================= */

.rr-top-bar {
  position: fixed !important;
  top: env(safe-area-inset-top, 16px) !important;
  left: 16px !important;
  right: 16px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  z-index: var(--rr-z-overlay) !important;
  pointer-events: none !important;
}

.rr-exit-btn,
.rr-sound-btn-top {
  width: 44px !important;
  height: 44px !important;
  border-radius: 9999px !important;
  background: #1c1d22 !important;
  border: 1px solid #30323a !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  outline: none !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
  transition: background 0.15s ease, transform 0.12s ease !important;
  -webkit-tap-highlight-color: transparent !important;
}

.rr-exit-btn:hover,
.rr-sound-btn-top:hover {
  background: #282a32 !important;
}

.rr-exit-btn:active,
.rr-sound-btn-top:active {
  transform: scale(0.92) !important;
}

/* Muted (disabled): dimmed grey icon. Unmuted (enabled): plain white icon. */
.rr-sound-btn-top.is-muted {
  color: #888d99 !important;
}

.rr-top-controls {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  pointer-events: auto !important;
}

.rr-filter-btn-top {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 8px 14px !important;
  border-radius: 9999px !important;
  background: #1c1d22 !important;
  border: 1px solid #30323a !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
  color: #ffffff !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.2px !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  user-select: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

.rr-filter-btn-top:hover {
  background: #282a32 !important;
}

.rr-filter-btn-top.is-active {
  background: #2c1a16 !important;
  border-color: #ff4500 !important;
  color: #ff6b35 !important;
}

.rr-filter-btn-top .rr-filter-icon {
  display: inline-flex !important;
  align-items: center !important;
}
/* By default, card containers are hidden when Reel Mode is inactive */
.rr-text-card-container,
.rr-link-card-container {
  display: none !important;
}

/* When Reel Mode is active, display as full-bleed centered overlay */
html.rr-active .rr-text-card-container {
  display: flex !important;
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 15 !important;
  overflow: hidden !important;
  pointer-events: auto !important;
  box-sizing: border-box !important;
  padding: 16px !important;
}

@media (min-width: 769px) {
  html.rr-active .rr-text-card-container {
    padding: 32px !important;
  }
}

html.rr-active .rr-text-card {
  position: relative !important;
  z-index: 2 !important;
  width: 100% !important;
  max-width: 480px !important;
  max-height: calc(100dvh - 120px) !important;
  background: #141518 !important;
  border: 1px solid #28292e !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  cursor: default !important;
  transition: border-color 0.15s ease !important;
  padding: 20px !important;
  gap: 12px !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  user-select: text !important;
  -webkit-tap-highlight-color: transparent !important;
}

.rr-text-card:hover {
  border-color: #383a42 !important;
}

.rr-text-card-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
}

.rr-text-pill {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: #202126 !important;
  border: 1px solid #30323a !important;
  border-radius: 9999px !important;
  padding: 3px 9px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #9a9ca6 !important;
  letter-spacing: 0.3px !important;
  text-transform: uppercase !important;
}

.rr-text-open-btn {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: #202126 !important;
  border: 1px solid #30323a !important;
  border-radius: 9999px !important;
  padding: 3px 10px !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #c5c7d0 !important;
  text-decoration: none !important;
  cursor: pointer !important;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
}

.rr-text-open-btn:hover {
  background: #2c2e35 !important;
  color: #ffffff !important;
  border-color: #444752 !important;
}

.rr-text-card-title {
  margin: 0 !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 17px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  line-height: 1.35 !important;
  letter-spacing: -0.015em !important;
}

.rr-text-card-body {
  font-family: var(--rr-font-stack) !important;
  font-size: 14px !important;
  line-height: 1.65 !important;
  color: #c5c7d0 !important;
  overflow-y: auto !important;
  max-height: calc(100dvh - 220px) !important;
  padding-right: 6px !important;
  scrollbar-width: thin !important;
  scrollbar-color: #383a42 transparent !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
  overscroll-behavior: contain !important;
  -webkit-overflow-scrolling: touch !important;
  touch-action: pan-y !important;
}

.rr-text-card-body p {
  margin: 0 !important;
}

/* =========================================================
   External Web Link Card
   ========================================================= */

html.rr-active .rr-link-card-container {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 15 !important;
  overflow: hidden !important;
  pointer-events: auto !important;
  box-sizing: border-box !important;
  padding: 16px !important;
}

@media (min-width: 769px) {
  html.rr-active .rr-link-card-container {
    padding: 32px !important;
  }
}

html.rr-active .rr-link-card {
  position: relative !important;
  z-index: 2 !important;
  width: 100% !important;
  max-width: 440px !important;
  background: #141518 !important;
  border: 1px solid #28292e !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  cursor: pointer !important;
  transition: transform 0.15s ease, border-color 0.15s ease !important;
  padding: 16px !important;
  gap: 12px !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  user-select: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

.rr-link-card:hover {
  transform: translateY(-2px) !important;
  border-color: #383a42 !important;
}

.rr-link-card:active {
  transform: scale(0.98) !important;
}

.rr-link-card-thumb-wrap {
  width: 100% !important;
  height: 190px !important;
  border-radius: 10px !important;
  overflow: hidden !important;
  position: relative !important;
  background: #1c1d22 !important;
}

.rr-link-card-thumb {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

.rr-link-card-body {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

.rr-link-card-domain {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  background: #202126 !important;
  border: 1px solid #30323a !important;
  border-radius: 9999px !important;
  padding: 3px 9px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  color: #ff6b35 !important;
  letter-spacing: 0.3px !important;
  text-transform: lowercase !important;
}

.rr-link-card-title {
  margin: 0 !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  line-height: 1.35 !important;
  letter-spacing: -0.015em !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 3 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

.rr-link-card-cta {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  width: 100% !important;
  padding: 10px 16px !important;
  margin-top: 4px !important;
  border-radius: 10px !important;
  background: #ff4500 !important;
  color: #ffffff !important;
  font-family: var(--rr-font-stack) !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  cursor: pointer !important;
  transition: opacity 0.15s ease !important;
}

.rr-link-card-cta:hover {
  opacity: 0.9 !important;
}

.rr-link-card-cta:active {
  transform: scale(0.97) !important;
} `);

(function () {
  'use strict';

  function parseScore(val) {
    if (!val) return 0;
    const trimmed = val.trim();
    if (!trimmed || trimmed === "•" || trimmed.toLowerCase() === "vote") return 0;
    const kMatch = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*k$/i);
    if (kMatch) {
      return Math.round(parseFloat(kMatch[1]) * 1e3);
    }
    const mMatch = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*m$/i);
    if (mMatch) {
      return Math.round(parseFloat(mMatch[1]) * 1e6);
    }
    const parsed = parseInt(trimmed.replace(/,/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  function parseCommentCount(val) {
    if (!val) return 0;
    const trimmed = val.trim();
    const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*([km])?/i);
    if (match) {
      let num = parseFloat(match[1]);
      const multiplier = match[2]?.toLowerCase();
      if (multiplier === "k") num *= 1e3;
      else if (multiplier === "m") num *= 1e6;
      return Math.round(num);
    }
    const parsed = parseInt(trimmed.replace(/,/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  function extractPostId(element, permalink) {
    const attrId = element.getAttribute("id");
    if (attrId && attrId.trim()) {
      return attrId.trim();
    }
    const dataId = element.getAttribute("data-post-id") || element.getAttribute("data-fullname");
    if (dataId && dataId.trim()) {
      return dataId.trim();
    }
    const permalinkMatch = permalink.match(/(?:comments|post)\/([a-z0-9]+)/i);
    if (permalinkMatch) {
      return `t3_${permalinkMatch[1]}`;
    }
    if (element.dataset.reelPostId) {
      return element.dataset.reelPostId;
    }
    const generatedId = `t3_gen_${Math.random().toString(36).slice(2, 10)}`;
    element.dataset.reelPostId = generatedId;
    return generatedId;
  }
  function extractTitle(element) {
    const postTitle = element.getAttribute("post-title");
    if (postTitle && postTitle.trim()) {
      return postTitle.trim();
    }
    const titleSlot = element.querySelector('[slot="title"]');
    if (titleSlot && titleSlot.textContent?.trim()) {
      return titleSlot.textContent.trim();
    }
    const heading = element.querySelector(
      'h1, h2, [data-test-id="post-content"] h1, [data-test-id="post-content"] h2'
    );
    if (heading && heading.textContent?.trim()) {
      return heading.textContent.trim();
    }
    const bodyAnchor = element.querySelector('a[data-click-id="body"]');
    if (bodyAnchor && bodyAnchor.textContent?.trim()) {
      return bodyAnchor.textContent.trim();
    }
    return "";
  }
  function extractAuthor(element) {
    const authorAttr = element.getAttribute("author");
    if (authorAttr && authorAttr.trim()) {
      return authorAttr.trim().replace(/^u\//, "");
    }
    const dataAuthor = element.getAttribute("data-author");
    if (dataAuthor && dataAuthor.trim()) {
      return dataAuthor.trim().replace(/^u\//, "");
    }
    const authorLink = element.querySelector(
      'a[href*="/user/"], [data-testid="post_author_link"], [data-click-id="user"], [slot="authorName"]'
    );
    if (authorLink && authorLink.textContent?.trim()) {
      return authorLink.textContent.trim().replace(/^u\//, "");
    }
    return "";
  }
  function extractSubreddit(element, permalink) {
    const prefixed = element.getAttribute("subreddit-prefixed-name");
    if (prefixed && prefixed.trim()) {
      return prefixed.startsWith("r/") ? prefixed.trim() : `r/${prefixed.trim()}`;
    }
    const subName = element.getAttribute("subreddit-name") || element.getAttribute("subreddit");
    if (subName && subName.trim()) {
      return `r/${subName.trim()}`;
    }
    const permalinkMatch = permalink.match(/(?:\/|^)r\/([a-zA-Z0-9_]+)/i);
    if (permalinkMatch) {
      return `r/${permalinkMatch[1]}`;
    }
    const subLink = element.querySelector(
      'a[data-click-id="subreddit"], a[href^="/r/"]:not([href*="/comments/"]), a[href*="reddit.com/r/"]:not([href*="/comments/"])'
    );
    if (subLink && subLink.textContent?.trim()) {
      const text = subLink.textContent.trim();
      return text.startsWith("r/") ? text : `r/${text}`;
    }
    return "";
  }
  function extractPermalink(element) {
    const permalinkAttr = element.getAttribute("permalink");
    if (permalinkAttr && permalinkAttr.trim()) {
      return permalinkAttr.trim();
    }
    const commentsLink = element.querySelector(
      'a[data-click-id="comments"], a[slot="full-post-link"], a[href*="/comments/"]'
    );
    if (commentsLink) {
      const href = commentsLink.getAttribute("href");
      if (href) return href;
    }
    return "";
  }
  function extractContentHref(element, permalink) {
    const contentHref = element.getAttribute("content-href");
    if (contentHref && contentHref.trim()) {
      return contentHref.trim();
    }
    const player = element.querySelector('shreddit-player-2, [data-testid="shreddit-player"]');
    if (player) {
      const src = player.getAttribute("src") || player.getAttribute("stream-url");
      if (src) return src;
    }
    const video = element.querySelector("video");
    if (video) {
      if (video.src) return video.src;
      const source = video.querySelector("source");
      if (source?.src) return source.src;
    }
    const img = element.querySelector(
      'img#post-image, [data-post-media-primary], [slot="post-media-container"] img:not(.shreddit-subreddit-icon__icon):not(.post-background-image-filter), shreddit-aspect-ratio:not(:has(video)) img:not(.shreddit-subreddit-icon__icon), [data-testid="post-image"] img, img.preview-img, img.media-lightbox-img:not(.post-background-image-filter), img.preview'
    );
    if (img?.src) {
      return img.src;
    }
    const linkAnchor = element.querySelector(
      'a[data-click-id="body"], a.title, [slot="post-media-container"] a'
    );
    if (linkAnchor?.href) {
      return linkAnchor.href;
    }
    return permalink;
  }
  function determinePostType(element, contentHref) {
    const rawType = element.getAttribute("post-type")?.toLowerCase();
    const domain = element.getAttribute("domain")?.toLowerCase() || "";
    if (rawType === "crosspost") {
      if (element.querySelector('shreddit-gallery, gallery-carousel, faceplate-carousel, [data-testid="media-gallery"], shreddit-async-loader[bundlename*="gallery"]') !== null) {
        return "gallery";
      }
      if (element.querySelector('shreddit-player-2, video, [data-testid="shreddit-player"]') !== null || /(\.mp4|\.webm|\.m3u8|v\.redd\.it|redgifs\.com|streamable\.com|youtube\.com|youtu\.be|tiktok\.com|vimeo\.com)/i.test(contentHref)) {
        return "video";
      }
      const crosspostImg = element.querySelector(
        'img#post-image, [data-post-media-primary], shreddit-aspect-ratio:not(:has(video)) img:not(.shreddit-subreddit-icon__icon), [data-testid="post-image"] img, img.preview-img, img.media-lightbox-img:not(.post-background-image-filter), [slot="post-media-container"] img:not(.shreddit-subreddit-icon__icon):not(.post-background-image-filter)'
      );
      if (crosspostImg !== null || /(\.jpg|\.jpeg|\.png|\.webp|\.gif|i\.redd\.it|i\.imgur\.com)/i.test(contentHref) || domain === "i.redd.it" || domain === "i.imgur.com") {
        return "image";
      }
      if (element.querySelector('[slot="text-body"], shreddit-post-text-body, .usertext-body, [data-testid="post-content"] .md, [data-click-id="text"]') !== null) {
        return "text";
      }
      return "link";
    }
    const isVideoHost = /(redgifs\.com|streamable\.com|gfycat\.com)/i.test(domain) || /(redgifs\.com|streamable\.com|gfycat\.com)/i.test(contentHref);
    const isVideo = rawType === "video" || isVideoHost || element.querySelector('shreddit-player-2, video, [data-testid="shreddit-player"]') !== null || /(\.mp4|\.webm|\.m3u8|v\.redd\.it|redgifs\.com|streamable\.com|youtube\.com|youtu\.be|tiktok\.com|vimeo\.com)/i.test(contentHref);
    if (isVideo) {
      return "video";
    }
    if (rawType === "gallery" || element.querySelector('shreddit-gallery, gallery-carousel, faceplate-carousel, [data-testid="media-gallery"], shreddit-async-loader[bundlename*="gallery"]') !== null) {
      return "gallery";
    }
    if (rawType === "link") {
      return "link";
    }
    if (rawType === "image") {
      return "image";
    }
    const hasTextBody = element.querySelector('[slot="text-body"], shreddit-post-text-body, .usertext-body, [data-testid="post-content"] .md, [data-click-id="text"]') !== null;
    if (rawType === "text" || domain.startsWith("self.")) {
      return "text";
    }
    const primaryImgEl = element.querySelector(
      'img#post-image, [data-post-media-primary], shreddit-aspect-ratio:not(:has(video)) img:not(.shreddit-subreddit-icon__icon), [data-testid="post-image"] img, img.preview-img, img.media-lightbox-img:not(.post-background-image-filter), [slot="post-media-container"] img:not(.shreddit-subreddit-icon__icon):not(.post-background-image-filter)'
    );
    const isImageHref = /(\.jpg|\.jpeg|\.png|\.webp|\.gif|i\.redd\.it|i\.imgur\.com)/i.test(contentHref) || domain === "i.redd.it" || domain === "i.imgur.com";
    if (primaryImgEl !== null || isImageHref) {
      return "image";
    }
    if (hasTextBody) {
      return "text";
    }
    const isExternalLink = contentHref && /^https?:\/\//i.test(contentHref) && !/(v\.redd\.it|i\.redd\.it|preview\.redd\.it|i\.imgur\.com|\.mp4|\.webm|\.m3u8|\.jpg|\.jpeg|\.png|\.webp|\.gif)/i.test(contentHref) && !/\/comments\//i.test(contentHref);
    if (isExternalLink) {
      return "link";
    }
    if (!contentHref || /\/comments\//i.test(contentHref) || /reddit\.com/i.test(contentHref)) {
      return "text";
    }
    return "link";
  }
  const UPVOTE_SELECTORS = [
    '[data-action-bar-action="upvote"]',
    "button[upvote]",
    'button[aria-label*="upvote" i]',
    'button[name="upvote"]',
    '[slot="upvote-button"] button',
    '[slot="upvote-button"]',
    'button[data-click-id="upvote"]',
    'button[id*="upvote" i]',
    'faceplate-tracker[action="upvote"] button',
    'shreddit-post-action-row button[aria-label*="upvote" i]',
    '[data-testid="upvote-button"]',
    ".arrow.up",
    ".arrow.upmod"
  ];
  const DOWNVOTE_SELECTORS = [
    '[data-action-bar-action="downvote"]',
    "button[downvote]",
    'button[aria-label*="downvote" i]',
    'button[name="downvote"]',
    '[slot="downvote-button"] button',
    '[slot="downvote-button"]',
    'button[data-click-id="downvote"]',
    'button[id*="downvote" i]',
    'faceplate-tracker[action="downvote"] button',
    'shreddit-post-action-row button[aria-label*="downvote" i]',
    '[data-testid="downvote-button"]',
    ".arrow.down",
    ".arrow.downmod"
  ];
  function queryDeep(root, selectors) {
    const isHidden = (el) => {
      try {
        if (el.hidden) return true;
        const style = el.getAttribute("style") || "";
        if (/display\s*:\s*none/i.test(style)) return true;
        if (el.classList?.contains("rr-native-suppressed")) return true;
      } catch {
      }
      return false;
    };
    const collect = (node, out) => {
      if (!node) return;
      const HTMLElementCtor = globalThis.HTMLElement;
      const isElement = HTMLElementCtor ? node instanceof HTMLElementCtor : node?.nodeType === 1;
      if (isElement) {
        const el = node;
        for (const selector of selectors) {
          try {
            if (el.matches?.(selector)) out.push(el);
          } catch {
          }
        }
        const sr = el.shadowRoot;
        if (sr) {
          for (let i2 = 0; i2 < sr.childNodes.length; i2++) collect(sr.childNodes[i2], out);
        }
      } else if (node?.nodeType === 11) {
        const frag = node;
        for (let i2 = 0; i2 < frag.childNodes.length; i2++) collect(frag.childNodes[i2], out);
        return;
      }
      const children = node.childNodes;
      if (children) {
        for (let i2 = 0; i2 < children.length; i2++) {
          collect(children[i2], out);
        }
      }
    };
    for (const selector of selectors) {
      try {
        const found = root.querySelector(selector);
        if (found && !isHidden(found)) {
          if (found.tagName.toLowerCase() === "button") return found;
        }
      } catch {
      }
    }
    if (root.shadowRoot) {
      for (const selector of selectors) {
        try {
          const found = root.shadowRoot.querySelector(selector);
          if (found && !isHidden(found)) {
            if (found.tagName.toLowerCase() === "button") return found;
          }
        } catch {
        }
      }
    }
    const all = [];
    collect(root, all);
    const visible = all.filter((el) => !isHidden(el));
    const btn = visible.find((el) => el.tagName.toLowerCase() === "button");
    if (btn) return btn;
    return visible[0] || null;
  }
  function checkIsUpvoted(element) {
    const voteState = element.getAttribute("vote-state") || element.getAttribute("score-state");
    if (voteState === "upvoted" || voteState === "upvote") return true;
    if (element.getAttribute("liked") === "true") return true;
    if (element.classList.contains("likes")) return true;
    const btn = queryDeep(element, UPVOTE_SELECTORS);
    if (btn) {
      if (btn.getAttribute("aria-pressed") === "true") return true;
      if (btn.getAttribute("aria-checked") === "true") return true;
      if (btn.getAttribute("data-selected") === "true") return true;
      if (btn.classList.contains("active") || btn.classList.contains("upvoted") || btn.classList.contains("upmod") || btn.classList.contains("text-interactive-pressed")) {
        return true;
      }
    }
    return false;
  }
  function checkIsDownvoted(element) {
    const voteState = element.getAttribute("vote-state") || element.getAttribute("score-state");
    if (voteState === "downvoted" || voteState === "downvote") return true;
    if (element.getAttribute("liked") === "false") return true;
    if (element.classList.contains("dislikes")) return true;
    const btn = queryDeep(element, DOWNVOTE_SELECTORS);
    if (btn) {
      if (btn.getAttribute("aria-pressed") === "true") return true;
      if (btn.getAttribute("aria-checked") === "true") return true;
      if (btn.getAttribute("data-selected") === "true") return true;
      if (btn.classList.contains("active") || btn.classList.contains("downvoted") || btn.classList.contains("downmod") || btn.classList.contains("text-interactive-pressed")) {
        return true;
      }
    }
    return false;
  }
  function parsePostElement(element) {
    const permalink = extractPermalink(element);
    const id = extractPostId(element, permalink);
    const title = extractTitle(element);
    const author = extractAuthor(element);
    const subreddit = extractSubreddit(element, permalink);
    const contentHref = extractContentHref(element, permalink);
    const postType = determinePostType(element, contentHref);
    let score = 0;
    let isScoreHidden = false;
    const scoreAttr = element.getAttribute("score");
    if (scoreAttr !== null) {
      const trimmed = scoreAttr.trim();
      if (trimmed === "•" || trimmed.toLowerCase() === "vote") {
        isScoreHidden = true;
      }
      score = parseScore(scoreAttr);
    } else {
      const scoreElem = element.querySelector('shreddit-post-vote-control [slot="score"], faceplate-number, [data-test-id="post-score"], .score, [slot="credit-bar"]') || element.shadowRoot?.querySelector('faceplate-number, [data-testid="action-row"] faceplate-number');
      if (scoreElem) {
        const trimmed = scoreElem.textContent?.trim() || "";
        if (trimmed === "•" || trimmed.toLowerCase() === "vote") {
          isScoreHidden = true;
        }
        score = parseScore(trimmed);
      }
    }
    if (element.dataset) {
      element.dataset.rrPostType = postType;
    }
    let commentCount = 0;
    const commentAttr = element.getAttribute("comment-count");
    if (commentAttr !== null) {
      commentCount = parseCommentCount(commentAttr);
    } else {
      const commentElem = element.querySelector('a[data-click-id="comments"], [slot="comment-count"], a[href*="/comments/"]') || element.shadowRoot?.querySelector('[data-action-bar-action="comments"] faceplate-number, a[name="comments-action-button"] faceplate-number');
      if (commentElem) {
        commentCount = parseCommentCount(commentElem.textContent);
      }
    }
    const isUpvoted = checkIsUpvoted(element);
    const isDownvoted = checkIsDownvoted(element);
    let mediaUrl = void 0;
    if (postType === "video") {
      const player = element.querySelector("shreddit-player-2");
      const videoEl = element.querySelector("video");
      mediaUrl = player?.getAttribute("stream-url") || player?.getAttribute("src") || videoEl?.getAttribute("src") || contentHref || void 0;
    } else if (postType === "image") {
      const img = element.querySelector(
        'img#post-image, [data-post-media-primary], [slot="post-media-container"] img:not(.shreddit-subreddit-icon__icon):not(.post-background-image-filter), shreddit-aspect-ratio:not(:has(video)) img:not(.shreddit-subreddit-icon__icon), [data-testid="post-image"] img, img.preview-img, img.media-lightbox-img:not(.post-background-image-filter), img.preview'
      );
      mediaUrl = img?.src || img?.getAttribute("src") || contentHref || void 0;
    } else if (postType === "link") {
      const img = element.querySelector(
        'shreddit-aspect-ratio img, [slot="post-media-container"] img:not(.shreddit-subreddit-icon__icon):not(.post-background-image-filter), img.preview-img, img.preview'
      );
      mediaUrl = img?.src || img?.getAttribute("src") || void 0;
    }
    let textBody = void 0;
    if (postType === "text") {
      const textBodyEl = element.querySelector(
        '[slot="text-body"], shreddit-post-text-body, .usertext-body, [data-testid="post-content"] .md, [data-click-id="text"]'
      );
      if (textBodyEl) {
        const contentEl = textBodyEl.querySelector('[property="schema:articleBody"], .md, .text-neutral-content') || textBodyEl;
        textBody = contentEl.textContent?.trim() || "";
      }
    }
    return {
      id,
      title,
      author,
      subreddit,
      score,
      commentCount,
      permalink,
      contentHref,
      postType,
      element,
      mediaUrl,
      textBody,
      isUpvoted,
      isDownvoted,
      isScoreHidden
    };
  }
  function findPostElements(root) {
    if ("matches" in root && (root.matches("shreddit-post") || root.matches('[data-testid="post-container"]') || root.matches(".Post"))) {
      return [root];
    }
    const shredditPosts = Array.from(root.querySelectorAll("shreddit-post"));
    if (shredditPosts.length > 0) {
      return shredditPosts;
    }
    const elements = [];
    const seen = /* @__PURE__ */ new Set();
    const fallbackPosts = Array.from(root.querySelectorAll('[data-testid="post-container"], .Post, article'));
    for (const el of fallbackPosts) {
      if (!seen.has(el) && !fallbackPosts.some((p2) => p2 !== el && p2.contains(el))) {
        elements.push(el);
        seen.add(el);
      }
    }
    return elements;
  }
  function extractPosts(root) {
    const targetRoot = root ?? (typeof document !== "undefined" ? document : null);
    if (!targetRoot) return [];
    const postElements = findPostElements(targetRoot);
    const posts = [];
    const seenIds = /* @__PURE__ */ new Set();
    for (const el of postElements) {
      const post = parsePostElement(el);
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        posts.push(post);
      }
    }
    return posts;
  }
  function observeNewPosts(onNewPosts) {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
      return () => {
      };
    }
    const seenIds = /* @__PURE__ */ new Set();
    const initialPosts = extractPosts(document);
    for (const post of initialPosts) {
      seenIds.add(post.id);
    }
    let debounceTimer = null;
    const processMutations = () => {
      const currentPosts = extractPosts(document);
      const newPosts = [];
      for (const post of currentPosts) {
        if (!seenIds.has(post.id)) {
          seenIds.add(post.id);
          newPosts.push(post);
        }
      }
      if (newPosts.length > 0) {
        onNewPosts(newPosts);
      }
    };
    const observer = new MutationObserver((mutations) => {
      let hasRelevantChanges = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (let i2 = 0; i2 < mutation.addedNodes.length; i2++) {
            const node = mutation.addedNodes[i2];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node;
              if (el.matches?.('shreddit-post, [data-testid="post-container"], .Post') || el.querySelector?.('shreddit-post, [data-testid="post-container"], .Post')) {
                hasRelevantChanges = true;
                break;
              }
            }
          }
        }
        if (hasRelevantChanges) break;
      }
      if (hasRelevantChanges) {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          processMutations();
        }, 150);
      }
    });
    const target = document.querySelector("shreddit-feed") || document.querySelector("main") || document.body || document.documentElement;
    if (target) {
      observer.observe(target, {
        childList: true,
        subtree: true
      });
    }
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      observer.disconnect();
    };
  }
  function deepInnerButton(element) {
    if (element.tagName.toLowerCase() === "button") return element;
    try {
      const direct = element.querySelector("button");
      if (direct) return direct;
    } catch {
    }
    try {
      const sr = element.shadowRoot;
      const inner = sr?.querySelector("button");
      if (inner) return inner;
    } catch {
    }
    try {
      const nested = element.querySelectorAll("*");
      for (let i2 = 0; i2 < nested.length; i2++) {
        const el = nested[i2];
        try {
          const btn = el.shadowRoot?.querySelector("button");
          if (btn) return btn;
        } catch {
        }
      }
    } catch {
    }
    return element;
  }
  function clickButton(element) {
    const target = deepInnerButton(element);
    try {
      target.click();
      return true;
    } catch {
      try {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        });
        return target.dispatchEvent(clickEvent);
      } catch {
        return false;
      }
    }
  }
  function proxyUpvote(post, onSync) {
    if (!post || !post.element) return false;
    const button = queryDeep(post.element, UPVOTE_SELECTORS);
    if (!button) return false;
    const wasUpvoted = !!post.isUpvoted;
    const wasDownvoted = !!post.isDownvoted;
    const success = clickButton(button);
    if (success && post.element) {
      if (wasUpvoted) {
        post.isUpvoted = false;
      } else {
        post.isUpvoted = true;
        post.isDownvoted = false;
      }
      const liveUp = checkIsUpvoted(post.element);
      const liveDown = checkIsDownvoted(post.element);
      if (liveUp !== wasUpvoted || liveDown !== wasDownvoted) {
        post.isUpvoted = liveUp;
        post.isDownvoted = liveDown;
      }
      setTimeout(() => {
        if (post.element) {
          post.isUpvoted = checkIsUpvoted(post.element);
          post.isDownvoted = checkIsDownvoted(post.element);
        }
        onSync?.();
      }, 50);
    }
    return success;
  }
  function proxyDownvote(post, onSync) {
    if (!post || !post.element) return false;
    const button = queryDeep(post.element, DOWNVOTE_SELECTORS);
    if (!button) return false;
    const wasUpvoted = !!post.isUpvoted;
    const wasDownvoted = !!post.isDownvoted;
    const success = clickButton(button);
    if (success && post.element) {
      if (wasDownvoted) {
        post.isDownvoted = false;
      } else {
        post.isDownvoted = true;
        post.isUpvoted = false;
      }
      const liveUp = checkIsUpvoted(post.element);
      const liveDown = checkIsDownvoted(post.element);
      if (liveUp !== wasUpvoted || liveDown !== wasDownvoted) {
        post.isUpvoted = liveUp;
        post.isDownvoted = liveDown;
      }
      setTimeout(() => {
        if (post.element) {
          post.isUpvoted = checkIsUpvoted(post.element);
          post.isDownvoted = checkIsDownvoted(post.element);
        }
        onSync?.();
      }, 50);
    }
    return success;
  }
  function readPlayerSrc(player) {
    try {
      const direct = player.getAttribute("stream-url") || player.getAttribute("src");
      if (direct) return direct;
      const packed = player.getAttribute("packaged-media-json");
      if (packed) {
        try {
          const json = JSON.parse(packed);
          const url = json?.playbackMp4Url || json?.playback_url || json?.hlsUrl;
          if (typeof url === "string" && url) return url;
        } catch {
        }
      }
    } catch {
    }
    return "";
  }
  function hydrateVideoFromPlayer(container, video) {
    try {
      if (video.currentSrc) return true;
      if (video.readyState > 0 && video.src) return true;
      const player = video.closest?.("shreddit-player-2") || container.querySelector?.("shreddit-player-2");
      if (!player) return !!video.src;
      const src = readPlayerSrc(player);
      if (!src) return !!video.src;
      video.src = src;
      video.preload = "auto";
      video.setAttribute("muted", "");
      video.muted = true;
      try {
        video.load();
      } catch {
      }
      return true;
    } catch {
      return false;
    }
  }
  function ensureAutoplayAttrs(video) {
    try {
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "auto";
    } catch {
    }
  }
  const STORAGE_KEY = "reddit_reels_muted";
  function getInitialMuteState() {
    try {
      if (typeof GM_getValue === "function") {
        const gmVal = GM_getValue(STORAGE_KEY, null);
        if (gmVal !== null && typeof gmVal === "boolean") {
          return gmVal;
        }
      }
    } catch {
    }
    try {
      if (typeof localStorage !== "undefined") {
        const localVal = localStorage.getItem(STORAGE_KEY);
        if (localVal !== null) {
          return localVal === "true";
        }
      }
    } catch {
    }
    return false;
  }
  function persistMuteState(muted) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(STORAGE_KEY, muted);
      }
    } catch {
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(muted));
      }
    } catch {
    }
  }
  const VOLUME_KEY = "reddit_reels_volume";
  function getInitialVolume() {
    try {
      if (typeof GM_getValue === "function") {
        const gmVal = GM_getValue(VOLUME_KEY, null);
        if (typeof gmVal === "number" && gmVal >= 0 && gmVal <= 1) return gmVal;
      }
    } catch {
    }
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(VOLUME_KEY);
        if (raw !== null) {
          const n2 = parseFloat(raw);
          if (!Number.isNaN(n2) && n2 >= 0 && n2 <= 1) return n2;
        }
      }
    } catch {
    }
    return 1;
  }
  function persistVolume(volume) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(VOLUME_KEY, volume);
      }
    } catch {
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(VOLUME_KEY, String(volume));
      }
    } catch {
    }
  }
  function normalizeIframeSrc(src, isMuted) {
    if (!src || src === "about:blank") return src;
    const target = isMuted ? "muted=1" : "muted=0";
    if (/[?&]muted=[01]/.test(src)) {
      return src.replace(/([?&]muted=)[01]/g, `$1${isMuted ? "1" : "0"}`);
    }
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}${target}`;
  }
  function sendIframePlay(ifr) {
    try {
      if (!ifr.src || ifr.src === "about:blank") return;
      ifr.contentWindow?.postMessage({ source: "reddit-reels", type: "PLAY" }, "*");
      ifr.contentWindow?.postMessage({ action: "play", type: "play" }, "*");
    } catch {
    }
  }
  function listenForRedGifsReady(getState) {
    const handler = (event) => {
      try {
        const data = event.data;
        if (!data || data.source !== "redgifs-bridge" || data.type !== "READY") return;
        const src = event.source;
        if (!src || typeof src.postMessage !== "function") return;
        const { muted, volume } = getState();
        src.postMessage({ source: "reddit-reels", type: "SET_AUDIO", muted, volume }, "*");
        src.postMessage({ source: "reddit-reels", type: "PLAY" }, "*");
      } catch {
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }
  function blurIframes(container) {
    try {
      container.querySelectorAll("iframe").forEach((ifr) => {
        try {
          ifr.tabIndex = -1;
          ifr.blur();
        } catch {
        }
      });
    } catch {
    }
  }
  let sharedAudioCtx = null;
  function unlockAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
        sharedAudioCtx = new AudioCtx();
      }
      const ctx = sharedAudioCtx;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {
        });
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
    }
  }
  function deepFindMediaElements(root) {
    const videos = [];
    const audios = [];
    const players = [];
    function traverse(node) {
      if (!node) return;
      if (typeof HTMLVideoElement !== "undefined" && node instanceof HTMLVideoElement || node.tagName?.toLowerCase() === "video") {
        videos.push(node);
      } else if (typeof HTMLAudioElement !== "undefined" && node instanceof HTMLAudioElement || node.tagName?.toLowerCase() === "audio") {
        audios.push(node);
      } else if (node instanceof HTMLElement) {
        const tag = node.tagName.toLowerCase();
        if (tag.includes("player") || tag.includes("vds-media") || tag.includes("vds-video") || tag.includes("vds-audio")) {
          players.push(node);
        }
        if (node.shadowRoot) {
          traverse(node.shadowRoot);
        }
      }
      if (node.childNodes && node.childNodes.length > 0) {
        for (let i2 = 0; i2 < node.childNodes.length; i2++) {
          traverse(node.childNodes[i2]);
        }
      }
    }
    traverse(root);
    return { videos, audios, players };
  }
  function applyAudioState(container, isMuted, volume = 1) {
    if (!container) return;
    const level = isMuted ? 0 : volume;
    const { videos, audios, players } = deepFindMediaElements(container);
    for (const video of videos) {
      try {
        video.muted = isMuted;
        video.volume = level;
        if (!isMuted && video.paused) {
          video.play().catch(() => {
          });
        }
      } catch {
      }
    }
    for (const audio of audios) {
      try {
        audio.muted = isMuted;
        audio.volume = level;
        if (!isMuted && audio.paused) {
          audio.play().catch(() => {
          });
        }
      } catch {
      }
    }
    for (const player of players) {
      try {
        if (isMuted) {
          player.setAttribute("muted", "");
          player.muted = true;
        } else {
          player.removeAttribute("muted");
          player.muted = false;
          player.volume = level;
        }
      } catch {
      }
    }
    const iframes = container.querySelectorAll("iframe");
    for (const ifr of iframes) {
      try {
        if (!ifr.src || ifr.src === "about:blank") continue;
        ifr.contentWindow?.postMessage(
          {
            source: "reddit-reels",
            type: "SET_AUDIO",
            muted: isMuted,
            volume: level
          },
          "*"
        );
        ifr.contentWindow?.postMessage(
          {
            action: isMuted ? "mute" : "unmute",
            type: isMuted ? "mute" : "unmute",
            muted: isMuted,
            volume: level
          },
          "*"
        );
      } catch {
      }
    }
  }
  class AudioManager {
    _isMuted;
    _volume;
    activeContainer = null;
    activeVideo = null;
    videoCache = /* @__PURE__ */ new WeakMap();
    constructor(initialMuted, initialVolume) {
      this._isMuted = initialMuted !== void 0 ? initialMuted : getInitialMuteState();
      this._volume = initialVolume !== void 0 ? initialVolume : getInitialVolume();
    }
    get isMuted() {
      return this._isMuted;
    }
    set isMuted(value) {
      this._isMuted = value;
      persistMuteState(this._isMuted);
      this.syncActiveMute();
    }
    get volume() {
      return this._volume;
    }
    setVolume(level, container) {
      const clamped = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 1;
      this._volume = clamped;
      persistVolume(clamped);
      if (clamped === 0 && !this._isMuted) {
        this._isMuted = true;
        persistMuteState(true);
      } else if (clamped > 0 && this._isMuted) {
        this._isMuted = false;
        persistMuteState(false);
      }
      const target = container || this.activeContainer;
      if (target) applyAudioState(target, this._isMuted, this._volume);
      this.syncActiveMute();
      return this._volume;
    }
    adjustVolume(delta, container) {
      return this.setVolume(this._volume + delta, container);
    }
    getActiveVideo() {
      return this.activeVideo;
    }
    getActiveContainer() {
      return this.activeContainer;
    }
    /**
     * Request playback for a specific video or slide container.
     * Immediately halts and mutes all other media on the page to prevent audio overlap.
     */
    requestPlayback(target) {
      if (!target) return;
      let targetVideo = null;
      let targetContainer = null;
      const isVideo = typeof HTMLVideoElement !== "undefined" && target instanceof HTMLVideoElement || target.tagName?.toLowerCase() === "video" || typeof target.play === "function";
      if (isVideo) {
        targetVideo = target;
        targetContainer = typeof target.closest === "function" ? target.closest("shreddit-post, [data-post-id], article") : null;
      } else {
        targetContainer = target;
        targetVideo = this.findVideo(target);
      }
      if (this.activeVideo && this.activeVideo !== targetVideo) {
        try {
          this.activeVideo.pause();
          this.activeVideo.muted = true;
          this.activeVideo.currentTime = 0;
        } catch {
        }
      }
      if (this.activeContainer && this.activeContainer !== targetContainer) {
        applyAudioState(this.activeContainer, true);
      }
      this.activeContainer = targetContainer;
      this.activeVideo = targetVideo;
      if (typeof document !== "undefined") {
        const allVideos = document.querySelectorAll("video");
        allVideos.forEach((v2) => {
          if (v2 !== targetVideo) {
            try {
              if (!v2.paused) v2.pause();
              v2.muted = true;
              v2.currentTime = 0;
            } catch {
            }
          }
        });
        const allAudios = document.querySelectorAll("audio");
        allAudios.forEach((a2) => {
          try {
            if (!a2.paused) a2.pause();
            a2.muted = true;
            a2.currentTime = 0;
          } catch {
          }
        });
        const allIframes = document.querySelectorAll("iframe");
        allIframes.forEach((ifr) => {
          if (!targetContainer || !targetContainer.contains(ifr)) {
            if (ifr.src && ifr.src !== "about:blank") {
              ifr.dataset.rrSrc = ifr.src;
              ifr.src = "about:blank";
            }
          }
        });
      }
      if (targetContainer) {
        const iframes = targetContainer.querySelectorAll("iframe");
        iframes.forEach((ifr) => {
          try {
            const stored = ifr.dataset.rrSrc;
            if (ifr.src === "about:blank" && stored) {
              ifr.src = normalizeIframeSrc(stored, this._isMuted);
            }
            ifr.tabIndex = -1;
          } catch {
          }
        });
        applyAudioState(targetContainer, this._isMuted, this._volume);
        iframes.forEach((ifr) => sendIframePlay(ifr));
        blurIframes(targetContainer);
      }
      if (targetVideo) {
        if (targetContainer && targetContainer === this.activeContainer && !targetVideo.paused && targetVideo.currentSrc) {
          applyAudioState(targetContainer, this._isMuted, this._volume);
          return;
        }
        ensureAutoplayAttrs(targetVideo);
        if (targetContainer && (!targetVideo.currentSrc || targetVideo.readyState === 0)) {
          hydrateVideoFromPlayer(targetContainer, targetVideo);
        }
        targetVideo.muted = this._isMuted;
        targetVideo.volume = this._isMuted ? 0 : this._volume;
        targetVideo.play().catch((err) => {
          if (!targetVideo) return;
          const name = err && err.name || "";
          if (name === "NotSupportedError") {
            if (targetContainer) hydrateVideoFromPlayer(targetContainer, targetVideo);
            targetVideo.muted = true;
            targetVideo.play().catch(() => {
            });
            return;
          }
          if (!targetVideo.muted && (name === "NotAllowedError" || name === "AbortError")) {
            targetVideo.muted = true;
            targetVideo.play().catch(() => {
            });
          }
        });
      }
    }
    /**
     * Helper to locate video in container, traversing all nested shadowRoots.
     * Fast-paths the active container and memoizes recent lookups (~1s TTL) so
     * IntersectionObserver threshold storms do not re-walk shadow DOM every time.
     */
    findVideo(container) {
      if (!container) return null;
      if (container === this.activeContainer && this.activeVideo && container.contains(this.activeVideo)) {
        return this.activeVideo;
      }
      const cached = this.videoCache.get(container);
      if (cached && Date.now() - cached.time < 1e3 && (cached.video === null || container.contains(cached.video))) {
        return cached.video;
      }
      const { videos } = deepFindMediaElements(container);
      const found = videos.length > 0 ? videos[0] : null;
      try {
        this.videoCache.set(container, { video: found, time: Date.now() });
      } catch {
      }
      return found;
    }
    invalidateVideoCache(container) {
      try {
        if (container) {
          this.videoCache.delete(container);
        }
      } catch {
      }
    }
    /**
     * Toggle mute on/off, apply to active media or specified container, and persist state
     */
    toggleMute(container) {
      this._isMuted = !this._isMuted;
      persistMuteState(this._isMuted);
      const target = container || this.activeContainer;
      if (target) {
        applyAudioState(target, this._isMuted, this._volume);
      }
      this.syncActiveMute();
      return this._isMuted;
    }
    /**
     * After a trusted user gesture, re-assert unmuted iframe src so a
     * first-load RedGifs embed blocked by autoplay policy can start audible.
     */
    reassertActiveIframeUnmute() {
      if (this._isMuted || !this.activeContainer) return;
      try {
        const iframes = this.activeContainer.querySelectorAll("iframe");
        iframes.forEach((ifr) => {
          try {
            const stored = ifr.dataset.rrSrc;
            if (ifr.src === "about:blank" && stored) {
              ifr.src = normalizeIframeSrc(stored, false);
            }
          } catch {
          }
        });
        applyAudioState(this.activeContainer, false, this._volume);
        iframes.forEach((ifr) => sendIframePlay(ifr));
      } catch {
      }
    }
    syncActiveMute() {
      if (this.activeContainer) {
        applyAudioState(this.activeContainer, this._isMuted, this._volume);
      } else if (this.activeVideo) {
        try {
          this.activeVideo.muted = this._isMuted;
          this.activeVideo.volume = this._isMuted ? 0 : this._volume;
          if (!this._isMuted && this.activeVideo.paused) {
            this.activeVideo.play().catch(() => {
            });
          }
        } catch {
        }
      }
    }
    /**
     * Immediately halt and mute all playback across the document
     */
    stopAll() {
      if (this.activeContainer) {
        applyAudioState(this.activeContainer, true);
      }
      if (this.activeVideo) {
        try {
          this.activeVideo.pause();
          this.activeVideo.muted = true;
          this.activeVideo.currentTime = 0;
        } catch {
        }
      }
      this.activeVideo = null;
      this.activeContainer = null;
      if (typeof document !== "undefined") {
        const allVideos = document.querySelectorAll("video");
        allVideos.forEach((v2) => {
          try {
            if (!v2.paused) v2.pause();
            v2.muted = true;
            v2.currentTime = 0;
          } catch {
          }
        });
        const allAudios = document.querySelectorAll("audio");
        allAudios.forEach((a2) => {
          try {
            if (!a2.paused) a2.pause();
            a2.muted = true;
            a2.currentTime = 0;
          } catch {
          }
        });
        const allIframes = document.querySelectorAll("iframe");
        allIframes.forEach((ifr) => {
          try {
            ifr.contentWindow?.postMessage({ source: "reddit-reels", type: "PAUSE", muted: true }, "*");
            ifr.contentWindow?.postMessage({ action: "pause", muted: true }, "*");
          } catch {
          }
        });
      }
    }
  }
  const audioManager = new AudioManager();
  const REDGIFS_MESSAGE_SOURCE = "reddit-reels";
  function isRedGifsFrame() {
    if (typeof window === "undefined") return false;
    return /redgifs\.com/i.test(window.location.hostname);
  }
  function getStoredMute() {
    try {
      if (typeof GM_getValue === "function") {
        const gm = GM_getValue("reddit_reels_muted", null);
        if (typeof gm === "boolean") return gm;
      }
    } catch {
    }
    return false;
  }
  function getStoredVolume() {
    try {
      if (typeof GM_getValue === "function") {
        const gm = GM_getValue("reddit_reels_volume", null);
        if (typeof gm === "number" && gm >= 0 && gm <= 1) return gm;
      }
    } catch {
    }
    return 1;
  }
  function initRedGifsBridge() {
    if (!isRedGifsFrame()) return () => {
    };
    let currentMuted = getStoredMute();
    let currentVolume = getStoredVolume();
    const applyToVideo = (video) => {
      try {
        video.muted = currentMuted;
        video.volume = currentVolume;
        if (!currentMuted && video.paused) {
          video.play().catch(() => {
            try {
              video.muted = true;
              video.play().catch(() => {
              });
            } catch {
            }
          });
        } else if (currentMuted && video.paused) {
          video.play().catch(() => {
          });
        }
      } catch {
      }
    };
    const syncActiveVideo = () => {
      const video = document.querySelector("video");
      if (video) applyToVideo(video);
    };
    const handleMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== REDGIFS_MESSAGE_SOURCE) return;
      const video = document.querySelector("video");
      if (data.type === "SET_AUDIO" || data.type === "SET_MUTE") {
        if (typeof data.muted === "boolean") {
          currentMuted = data.muted;
        }
        if (typeof data.volume === "number") {
          currentVolume = Math.min(1, Math.max(0, data.volume));
        }
        if (video) applyToVideo(video);
      } else if (data.type === "PAUSE") {
        if (video && !video.paused) {
          video.pause();
          video.muted = true;
        }
      } else if (data.type === "PLAY") {
        if (video) {
          applyToVideo(video);
          video.play().catch(() => {
          });
        }
      }
    };
    window.addEventListener("message", handleMessage);
    const observer = new MutationObserver(() => {
      const video = document.querySelector("video");
      if (video) {
        applyToVideo(video);
        if (!video.dataset.rrBridgeWired) {
          video.dataset.rrBridgeWired = "1";
          video.addEventListener("play", () => applyToVideo(video), { once: true });
        }
      }
    });
    if (document.body || document.documentElement) {
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    syncActiveVideo();
    const handleUserGesture = () => {
      syncActiveVideo();
    };
    window.addEventListener("click", handleUserGesture, true);
    window.addEventListener("pointerdown", handleUserGesture, true);
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ source: "redgifs-bridge", type: "READY" }, "*");
      }
    } catch {
    }
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("click", handleUserGesture, true);
      window.removeEventListener("pointerdown", handleUserGesture, true);
      observer.disconnect();
    };
  }
  function resolveMedia(post) {
    const el = post.element;
    if (!el) {
      return {
        type: "image",
        src: post.mediaUrl || post.contentHref || "",
        hasAudio: false
      };
    }
    const video = el.querySelector("video");
    const player = el.querySelector("shreddit-player-2");
    if (video || player) {
      const src = video?.currentSrc || video?.src || player?.getAttribute("stream-url") || player?.getAttribute("src") || post.mediaUrl || post.contentHref || "";
      const poster = video?.poster || player?.getAttribute("poster") || player?.getAttribute("preview") || void 0;
      return {
        type: "video",
        src,
        poster,
        hasAudio: player?.getAttribute("has-audio") !== "false",
        element: video || player || void 0
      };
    }
    const iframe = el.querySelector("iframe");
    if (iframe && iframe.src) {
      let src = normalizeIframeSrc(iframe.src, audioManager.isMuted);
      if (/redgifs\.com|streamable\.com|gfycat\.com/i.test(src) && !/[?&]autoplay=/.test(src)) {
        src += (src.includes("?") ? "&" : "?") + "autoplay=1";
      }
      return {
        type: "iframe",
        src,
        hasAudio: true,
        element: iframe
      };
    }
    if (post.contentHref && /redgifs\.com/i.test(post.contentHref)) {
      const match = post.contentHref.match(/redgifs\.com\/(?:watch|ifr|v)\/([a-zA-Z0-9_-]+)/i);
      if (!match) {
        const imgFallback = el.querySelector("img");
        const fallbackSrc = imgFallback?.src || post.mediaUrl || post.contentHref || "";
        return {
          type: "image",
          src: fallbackSrc,
          poster: fallbackSrc,
          hasAudio: false
        };
      }
      return {
        type: "iframe",
        src: normalizeIframeSrc(`https://www.redgifs.com/ifr/${match[1]}?autoplay=1&muted=1`, audioManager.isMuted),
        hasAudio: true
      };
    }
    const img = el.querySelector(
      'img[src*="i.redd.it"], img[src*="preview.redd.it"], [slot="post-media-container"] img, img'
    );
    const imgSrc = img?.src || post.mediaUrl || post.contentHref || "";
    return {
      type: "image",
      src: imgSrc,
      poster: imgSrc,
      hasAudio: false
    };
  }
  var n, l, u$1, i, r, o, e, f$1, c, a, s, h, p, v, d = {}, w = [], _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, g = Array.isArray;
  function m(n2, l2) {
    for (var u2 in l2) n2[u2] = l2[u2];
    return n2;
  }
  function b(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function k(l2, u2, t) {
    var i2, r2, o2, e2 = {};
    for (o2 in u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : e2[o2] = u2[o2];
    if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) void 0 === e2[o2] && (e2[o2] = l2.defaultProps[o2]);
    return x(l2, e2, i2, r2, null);
  }
  function x(n2, t, i2, r2, o2) {
    var e2 = { type: n2, props: t, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u$1 : o2, __i: -1, __u: 0 };
    return null == o2 && null != l.vnode && l.vnode(e2), e2;
  }
  function S(n2) {
    return n2.children;
  }
  function C(n2, l2) {
    this.props = n2, this.context = l2;
  }
  function $(n2, l2) {
    if (null == l2) return n2.__ ? $(n2.__, n2.__i + 1) : null;
    for (var u2; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) return u2.__e;
    return "function" == typeof n2.type ? $(n2) : null;
  }
  function I(n2) {
    if (n2.__P && n2.__d) {
      var u2 = n2.__v, t = u2.__e, i2 = [], r2 = [], o2 = m({}, u2);
      o2.__v = u2.__v + 1, l.vnode && l.vnode(o2), q(n2.__P, o2, u2, n2.__n, n2.__P.namespaceURI, 32 & u2.__u ? [t] : null, i2, null == t ? $(u2) : t, !!(32 & u2.__u), r2), o2.__v = u2.__v, o2.__.__k[o2.__i] = o2, D(i2, o2, r2), u2.__e = u2.__ = null, o2.__e != t && P(o2);
    }
  }
  function P(n2) {
    if (null != (n2 = n2.__) && null != n2.__c) return n2.__e = n2.__c.base = null, n2.__k.some(function(l2) {
      if (null != l2 && null != l2.__e) return n2.__e = n2.__c.base = l2.__e;
    }), P(n2);
  }
  function A(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
  }
  function H() {
    try {
      for (var n2, l2 = 1; i.length; ) i.length > l2 && i.sort(e), n2 = i.shift(), l2 = i.length, I(n2);
    } finally {
      i.length = H.__r = 0;
    }
  }
  function L(n2, l2, u2, t, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h2, p2, v2, y, _2, g2 = t && t.__k || w, m2 = l2.length;
    for (f2 = T(u2, l2, g2, f2, m2), s2 = 0; s2 < m2; s2++) null != (p2 = u2.__k[s2]) && (h2 = -1 != p2.__i && g2[p2.__i] || d, p2.__i = s2, _2 = q(n2, p2, h2, i2, r2, o2, e2, f2, c2, a2), v2 = p2.__e, p2.ref && h2.ref != p2.ref && (h2.ref && J(h2.ref, null, p2), a2.push(p2.ref, p2.__c || v2, p2)), null == y && null != v2 && (y = v2), 4 & p2.__u ? (f2 = j(p2, f2, n2), h2.__e && (h2.__e = null)) : "function" == typeof p2.type && void 0 !== _2 ? f2 = _2 : v2 && (f2 = v2.nextSibling), p2.__u &= -7);
    return u2.__e = y, f2;
  }
  function T(n2, l2, u2, t, i2) {
    var r2, o2, e2, f2, c2, a2 = u2.length, s2 = a2, h2 = 0;
    for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? ("string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? o2 = n2.__k[r2] = x(null, o2, null, null, null) : g(o2) ? o2 = n2.__k[r2] = x(S, { children: o2 }, null, null, null) : void 0 === o2.constructor && o2.__b > 0 ? o2 = n2.__k[r2] = x(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f2 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 != (c2 = o2.__i = O(o2, u2, f2, s2)) && (s2--, (e2 = u2[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > a2 ? h2-- : i2 < a2 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
    if (s2) for (r2 = 0; r2 < a2; r2++) null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t && (t = $(e2)), K(e2, e2));
    return t;
  }
  function j(n2, l2, u2) {
    var t, i2;
    if ("function" == typeof n2.type) {
      for (t = n2.__k, i2 = 0; t && i2 < t.length; i2++) t[i2] && (t[i2].__ = n2, l2 = j(t[i2], l2, u2));
      return l2;
    }
    n2.__e != l2 && (l2 && n2.type && !l2.parentNode && (l2 = $(n2)), l2 = u2.insertBefore(n2.__e, l2 || null));
    do {
      l2 = l2 && l2.nextSibling;
    } while (null != l2 && 8 == l2.nodeType);
    return l2;
  }
  function O(n2, l2, u2, t) {
    var i2, r2, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], a2 = null != c2 && 0 == (2 & c2.__u);
    if (null === c2 && null == e2 || a2 && e2 == c2.key && f2 == c2.type) return u2;
    if (t > (a2 ? 1 : 0)) {
      for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; ) if (null != (c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c2.__u) && e2 == c2.key && f2 == c2.type) return o2;
    }
    return -1;
  }
  function z(n2, l2, u2) {
    "-" == l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || _.test(l2) ? u2 : u2 + "px";
  }
  function N(n2, l2, u2, t, i2) {
    var r2, o2;
    n: if ("style" == l2) if ("string" == typeof u2) n2.style.cssText = u2;
    else {
      if ("string" == typeof t && (n2.style.cssText = t = ""), t) for (l2 in t) u2 && l2 in u2 || z(n2.style, l2, "");
      if (u2) for (l2 in u2) t && u2[l2] == t[l2] || z(n2.style, l2, u2[l2]);
    }
    else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(s, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t ? u2[a] = t[a] : (u2[a] = h, n2.addEventListener(l2, r2 ? v : p, r2)) : n2.removeEventListener(l2, r2 ? v : p, r2);
    else {
      if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
        n2[l2] = null == u2 ? "" : u2;
        break n;
      } catch (n3) {
      }
      "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
    }
  }
  function V(n2) {
    return function(u2) {
      if (this.l) {
        var t = this.l[u2.type + n2];
        if (null == u2[c]) u2[c] = h++;
        else if (u2[c] < t[a]) return;
        return t(l.event ? l.event(u2) : u2);
      }
    };
  }
  function q(n2, u2, t, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h2, p2, v2, y, d2, _2, k2, x2, M, I2, P2, A2, H2, T2, j2, F = u2.type;
    if (void 0 !== u2.constructor) return null;
    128 & t.__u && (c2 = !!(32 & t.__u), o2 = [f2 = u2.__e = t.__e]), (s2 = l.__b) && s2(u2);
    n: if ("function" == typeof F) {
      h2 = e2.length;
      try {
        if (x2 = u2.props, M = F.prototype && F.prototype.render, I2 = (s2 = F.contextType) && i2[s2.__c], P2 = s2 ? I2 ? I2.props.value : s2.__ : i2, t.__c ? k2 = (p2 = u2.__c = t.__c).__ = p2.__E : (M ? u2.__c = p2 = new F(x2, P2) : (u2.__c = p2 = new C(x2, P2), p2.constructor = F, p2.render = Q), I2 && I2.sub(p2), p2.state || (p2.state = {}), p2.__n = i2, v2 = p2.__d = true, p2.__h = [], p2._sb = []), M && null == p2.__s && (p2.__s = p2.state), M && null != F.getDerivedStateFromProps && (p2.__s == p2.state && (p2.__s = m({}, p2.__s)), m(p2.__s, F.getDerivedStateFromProps(x2, p2.__s))), y = p2.props, d2 = p2.state, p2.__v = u2, v2) M && null == F.getDerivedStateFromProps && null != p2.componentWillMount && p2.componentWillMount(), M && null != p2.componentDidMount && p2.__h.push(p2.componentDidMount);
        else {
          if (M && null == F.getDerivedStateFromProps && x2 !== y && null != p2.componentWillReceiveProps && p2.componentWillReceiveProps(x2, P2), u2.__v == t.__v || !p2.__e && null != p2.shouldComponentUpdate && false === p2.shouldComponentUpdate(x2, p2.__s, P2)) {
            u2.__v != t.__v && (p2.props = x2, p2.state = p2.__s, p2.__d = false), u2.__e = t.__e, u2.__k = t.__k, u2.__k.some(function(n3) {
              n3 && (n3.__ = u2);
            }), w.push.apply(p2.__h, p2._sb), p2._sb = [], p2.__h.length && e2.push(p2), f2 = $(t);
            break n;
          }
          null != p2.componentWillUpdate && p2.componentWillUpdate(x2, p2.__s, P2), M && null != p2.componentDidUpdate && p2.__h.push(function() {
            p2.componentDidUpdate(y, d2, _2);
          });
        }
        if (p2.context = P2, p2.props = x2, p2.__P = n2, p2.__e = false, A2 = l.__r, H2 = 0, M) p2.state = p2.__s, p2.__d = false, A2 && A2(u2), s2 = p2.render(p2.props, p2.state, p2.context), w.push.apply(p2.__h, p2._sb), p2._sb = [];
        else do {
          p2.__d = false, A2 && A2(u2), s2 = p2.render(p2.props, p2.state, p2.context), p2.state = p2.__s;
        } while (p2.__d && ++H2 < 25);
        p2.state = p2.__s, null != p2.getChildContext && (i2 = m(m({}, i2), p2.getChildContext())), M && !v2 && null != p2.getSnapshotBeforeUpdate && (_2 = p2.getSnapshotBeforeUpdate(y, d2)), T2 = null != s2 && s2.type === S && null == s2.key ? E(s2.props.children) : s2, f2 = L(n2, g(T2) ? T2 : [T2], u2, t, i2, r2, o2, e2, f2, c2, a2), p2.base = u2.__e, u2.__u &= -161, p2.__h.length && e2.push(p2), k2 && (p2.__E = p2.__ = null);
      } catch (n3) {
        if (e2.length = h2, u2.__v = null, c2 || null != o2) {
          if (n3.then) {
            for (u2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
            null != o2 && (o2[o2.indexOf(f2)] = null), u2.__e = f2;
          } else if (null != o2) for (j2 = o2.length; j2--; ) b(o2[j2]);
        } else u2.__e = t.__e;
        null == u2.__k && (u2.__k = t.__k || []), n3.then || B(u2), l.__e(n3, u2, t);
      }
    } else null == o2 && u2.__v == t.__v ? (u2.__k = t.__k, u2.__e = t.__e) : f2 = u2.__e = G(t.__e, u2, t, i2, r2, o2, e2, c2, a2);
    return (s2 = l.diffed) && s2(u2), 128 & u2.__u ? void 0 : f2;
  }
  function B(n2) {
    n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
  }
  function D(n2, u2, t) {
    for (var i2 = 0; i2 < t.length; i2++) J(t[i2], t[++i2], t[++i2]);
    l.__c && l.__c(u2, n2), n2.some(function(u3) {
      try {
        n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
          n3.call(u3);
        });
      } catch (n3) {
        l.__e(n3, u3.__v);
      }
    });
  }
  function E(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : void 0 !== n2.constructor ? null : m({}, n2);
  }
  function G(u2, t, i2, r2, o2, e2, f2, c2, a2) {
    var s2, h2, p2, v2, y, w2, _2, m2 = i2.props || d, k2 = t.props, x2 = t.type;
    if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
      for (s2 = 0; s2 < e2.length; s2++) if ((y = e2[s2]) && "setAttribute" in y == !!x2 && (x2 ? y.localName == x2 : 3 == y.nodeType)) {
        u2 = y, e2[s2] = null;
        break;
      }
    }
    if (null == u2) {
      if (null == x2) return document.createTextNode(k2);
      u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t, e2), c2 = false), e2 = null;
    }
    if (null == x2) m2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
    else {
      if (e2 = "textarea" == x2 && null != k2.defaultValue ? null : e2 && n.call(u2.childNodes), !c2 && null != e2) for (m2 = {}, s2 = 0; s2 < u2.attributes.length; s2++) m2[(y = u2.attributes[s2]).name] = y.value;
      for (s2 in m2) y = m2[s2], "dangerouslySetInnerHTML" == s2 ? p2 = y : "children" == s2 || s2 in k2 || "value" == s2 && "defaultValue" in k2 || "checked" == s2 && "defaultChecked" in k2 || N(u2, s2, null, y, o2);
      for (s2 in k2) y = k2[s2], "children" == s2 ? v2 = y : "dangerouslySetInnerHTML" == s2 ? h2 = y : "value" == s2 ? w2 = y : "checked" == s2 ? _2 = y : c2 && "function" != typeof y || m2[s2] === y || N(u2, s2, y, m2[s2], o2);
      if (h2) c2 || p2 && (h2.__html == p2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t.__k = [];
      else if (p2 && (u2.innerHTML = ""), L("template" == t.type ? u2.content : u2, g(v2) ? v2 : [v2], t, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && $(i2, 0), c2, a2), null != e2) for (s2 = e2.length; s2--; ) b(e2[s2]);
      c2 && "textarea" != x2 || (s2 = "value", "progress" == x2 && null == w2 ? u2.removeAttribute("value") : null != w2 && (w2 !== u2[s2] || "progress" == x2 && !w2 || "option" == x2 && w2 != m2[s2]) && N(u2, s2, w2, m2[s2], o2), s2 = "checked", null != _2 && _2 != u2[s2] && N(u2, s2, _2, m2[s2], o2));
    }
    return u2;
  }
  function J(n2, u2, t) {
    try {
      if ("function" == typeof n2) {
        var i2 = "function" == typeof n2.__u;
        i2 && n2.__u(), i2 && null == u2 || (n2.__u = n2(u2));
      } else n2.current = u2;
    } catch (n3) {
      l.__e(n3, t);
    }
  }
  function K(n2, u2, t) {
    var i2, r2;
    if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || J(i2, null, u2)), null != (i2 = n2.__c)) {
      if (i2.componentWillUnmount) try {
        i2.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u2);
      }
      i2.base = i2.__P = i2.__n = null;
    }
    if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && K(i2[r2], u2, t || "function" != typeof n2.type);
    t || b(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function Q(n2, l2, u2) {
    return this.constructor(n2, u2);
  }
  function R(u2, t, i2) {
    var r2, o2, e2, f2;
    t == document && (t = document.documentElement), l.__ && l.__(u2, t), o2 = (r2 = false) ? null : t.__k, e2 = [], f2 = [], q(t, u2 = t.__k = k(S, null, [u2]), o2 || d, d, t.namespaceURI, o2 ? null : t.firstChild ? n.call(t.childNodes) : null, e2, o2 ? o2.__e : t.firstChild, r2, f2), D(e2, u2, f2), u2.props.children = null;
  }
  n = w.slice, l = { __e: function(n2, l2, u2, t) {
    for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
      if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t || {}), o2 = i2.__d), o2) return i2.__E = i2;
    } catch (l3) {
      n2 = l3;
    }
    throw n2;
  } }, u$1 = 0, C.prototype.setState = function(n2, l2) {
    var u2;
    u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = m({}, this.state), "function" == typeof n2 && (n2 = n2(m({}, u2), this.props)), n2 && m(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), A(this));
  }, C.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
  }, C.prototype.render = S, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
    return n2.__v.__b - l2.__v.__b;
  }, H.__r = 0, f$1 = Math.random().toString(8), c = "__d" + f$1, a = "__a" + f$1, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true);
  var f = 0;
  function u(e2, t, n2, o2, i2, u2) {
    t || (t = {});
    var a2, c2, p2 = t;
    if ("ref" in p2) for (c2 in p2 = {}, t) "ref" == c2 ? a2 = t[c2] : p2[c2] = t[c2];
    var l$1 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f, __i: -1, __u: 0, __source: i2, __self: u2 };
    if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
    return l.vnode && l.vnode(l$1), l$1;
  }
  function FabButton({ onClick }) {
    return /* @__PURE__ */ u(
      "button",
      {
        type: "button",
        id: "rr-fab",
        class: "rr-fab",
        onClick,
        "aria-label": "Open Reddit Reel Mode",
        title: "Open Reddit Reel Mode",
        children: /* @__PURE__ */ u(
          "svg",
          {
            class: "rr-fab-icon",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: [
              /* @__PURE__ */ u("rect", { x: "2.5", y: "2.5", width: "19", height: "19", rx: "4.5" }),
              /* @__PURE__ */ u("path", { d: "M2.5 8.5h19" }),
              /* @__PURE__ */ u("path", { d: "m6.5 2.5 3 6" }),
              /* @__PURE__ */ u("path", { d: "m11.5 2.5 3 6" }),
              /* @__PURE__ */ u("path", { d: "m16.5 2.5 3 6" }),
              /* @__PURE__ */ u("polygon", { points: "10 11.5 15.5 14.75 10 18 10 11.5", fill: "currentColor", stroke: "none" })
            ]
          }
        )
      }
    );
  }
  function showPlayPulse(isPlaying) {
    const existing = document.querySelector(".rr-play-pulse");
    if (existing) existing.remove();
    const pulse = document.createElement("div");
    pulse.className = "rr-play-pulse";
    pulse.innerHTML = isPlaying ? `<svg width="44" height="44" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>` : `<svg width="44" height="44" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 550);
  }
  function showScalePulse(mode) {
    const existing = document.querySelector(".rr-scale-pulse");
    if (existing) existing.remove();
    const pulse = document.createElement("div");
    pulse.className = "rr-scale-pulse";
    pulse.textContent = mode;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 650);
  }
  function showVotePulse(upvoted) {
    const existing = document.querySelector(".rr-play-pulse");
    if (existing) existing.remove();
    const pulse = document.createElement("div");
    pulse.className = "rr-play-pulse";
    pulse.innerHTML = upvoted ? `<svg width="44" height="44" viewBox="0 0 24 24" fill="#ff4500"><path d="M12 21s-7.5-4.9-10-9.5C.4 8.6 2.4 5 5.8 5c2 0 3.4 1.1 4.2 2.3h4C14.8 6.1 16.2 5 18.2 5c3.4 0 5.4 3.6 3.8 6.5C19.5 16.1 12 21 12 21z" transform="scale(0.9) translate(1.3,1.3)"></path></svg>` : `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7193ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 550);
  }
  function showVolumePulse(level, muted) {
    const existing = document.querySelector(".rr-scale-pulse");
    if (existing) existing.remove();
    const pct = Math.round(level * 100);
    const pulse = document.createElement("div");
    pulse.className = "rr-scale-pulse";
    pulse.textContent = muted || pct === 0 ? "Muted" : `Volume ${pct}%`;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 650);
  }
  function getSoundIconSvg(isMuted) {
    return isMuted ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>` : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
  }
  function getFilterIconSvg() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5"></rect><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"></path></svg>`;
  }
  function getFilterLabelHtml(videosOnly) {
    return `<span class="rr-filter-icon">${getFilterIconSvg()}</span><span>${videosOnly ? "Videos Only" : "All Reels"}</span>`;
  }
  function createTopBar(isMuted, videosOnly, handlers) {
    const topBar = document.createElement("div");
    topBar.className = "rr-top-bar";
    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.className = "rr-exit-btn";
    exitBtn.setAttribute("aria-label", "Exit Reel Mode");
    exitBtn.title = "Exit Reel Mode";
    exitBtn.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
    exitBtn.onclick = (e2) => {
      e2.stopPropagation();
      handlers.onExit();
    };
    const controls = document.createElement("div");
    controls.className = "rr-top-controls";
    const filterBtn = document.createElement("button");
    filterBtn.type = "button";
    filterBtn.className = `rr-filter-btn-top ${videosOnly ? "is-active" : ""}`;
    filterBtn.setAttribute("aria-label", "Toggle Videos Only Filter");
    filterBtn.title = videosOnly ? "Showing Videos Only (Click to show all)" : "Showing All Reels (Click for videos only)";
    filterBtn.innerHTML = getFilterLabelHtml(videosOnly);
    filterBtn.onclick = (e2) => {
      e2.stopPropagation();
      handlers.onToggleFilter();
    };
    const soundBtn = document.createElement("button");
    soundBtn.type = "button";
    soundBtn.className = `rr-sound-btn-top ${isMuted ? "is-muted" : ""}`;
    soundBtn.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
    soundBtn.title = isMuted ? "Unmute" : "Mute";
    soundBtn.innerHTML = getSoundIconSvg(isMuted);
    soundBtn.onclick = (e2) => {
      e2.stopPropagation();
      handlers.onToggleMute();
    };
    controls.appendChild(filterBtn);
    controls.appendChild(soundBtn);
    topBar.appendChild(exitBtn);
    topBar.appendChild(controls);
    return topBar;
  }
  function syncTopBarState(topBar, isMuted, videosOnly) {
    if (!topBar) return;
    const filterBtn = topBar.querySelector(".rr-filter-btn-top");
    if (filterBtn) {
      filterBtn.classList.toggle("is-active", videosOnly);
      filterBtn.title = videosOnly ? "Showing Videos Only (Click to show all)" : "Showing All Reels (Click for videos only)";
      filterBtn.innerHTML = getFilterLabelHtml(videosOnly);
    }
    const soundBtn = topBar.querySelector(".rr-sound-btn-top");
    if (soundBtn) {
      soundBtn.classList.toggle("is-muted", isMuted);
      soundBtn.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
      soundBtn.title = isMuted ? "Unmute" : "Mute";
      soundBtn.innerHTML = getSoundIconSvg(isMuted);
    }
  }
  function formatCount(num) {
    if (!num || isNaN(num)) return "0";
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toString();
  }
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function extractDomain(url) {
    if (!url) return "";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return url.replace(/^https?:\/\//, "").split("/")[0];
    }
  }
  function openUrl(url) {
    if (!url) return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = url;
    }
  }
  function getUpvoteIconSvg(isUpvoted) {
    return `<svg width="26" height="26" viewBox="0 0 24 24" fill="${isUpvoted ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
  }
  function getDownvoteIconSvg(isDownvoted) {
    return `<svg width="26" height="26" viewBox="0 0 24 24" fill="${isDownvoted ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  }
  function getCcIconSvg(_enabled) {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" ry="3"></rect>
    <path d="M7 15h0a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1"></path>
    <path d="M15 15h0a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1"></path>
  </svg>`;
  }
  function getCommentIconSvg() {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>`;
  }
  function renderReelOverlay(postEl, post, options) {
    if (postEl.querySelector(".rr-post-overlay")) return null;
    const overlay = document.createElement("div");
    overlay.className = "rr-post-overlay";
    const isUpvoted = !!post.isUpvoted;
    const isDownvoted = !!post.isDownvoted;
    const isSubtitles = options.isSubtitlesEnabled ? options.isSubtitlesEnabled() : false;
    const initialVoteVal = isUpvoted ? 1 : isDownvoted ? -1 : 0;
    const baseScore = post.score;
    const isHiddenScore = !!post.isScoreHidden;
    const formatScoreDisplay = (currentScore, hasVoted) => {
      if (isHiddenScore && !hasVoted) return "Vote";
      return formatCount(currentScore);
    };
    const cleanSub = post.subreddit ? post.subreddit.replace(/^\/?/, "") : "";
    overlay.innerHTML = `
    <!-- Bottom-Left Post Information -->
    <div class="rr-post-info">
      <div class="rr-post-meta">
        ${post.subreddit ? `<a class="rr-sub-badge" role="link" tabindex="0" href="https://www.reddit.com/${escapeHtml(cleanSub)}/" target="_blank" rel="noopener noreferrer">${escapeHtml(post.subreddit)}</a>` : ""}
        ${post.subreddit && post.author ? `<span class="rr-dot">•</span>` : ""}
        ${post.author ? `<a class="rr-author" role="link" tabindex="0" href="https://www.reddit.com/user/${escapeHtml(post.author.replace(/^u\//, ""))}/" target="_blank" rel="noopener noreferrer">u/${escapeHtml(post.author.replace(/^u\//, ""))}</a>` : ""}
      </div>
      <div class="rr-post-title" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</div>
    </div>

    <!-- Bottom-Right Vertical Action Rail (NO SHARE BUTTON, NO SOUND BUTTON — mute lives in top bar) -->
    <div class="rr-action-rail">
      <!-- 1. Subtitles Toggle (ONLY rendered if post has video) -->
      ${options.hasVideo && options.onToggleSubtitles ? `
          <div class="rr-action-item">
            <button
              type="button"
              class="rr-action-btn rr-cc-btn ${isSubtitles ? "is-active-cc" : ""}"
              aria-label="${isSubtitles ? "Disable Subtitles" : "Enable Subtitles"}"
              title="${isSubtitles ? "Disable Subtitles" : "Enable Subtitles"}"
            >
              ${getCcIconSvg()}
            </button>
          </div>
          ` : ""}

      <!-- 2. Vote Cluster (Upvote, Score, Downvote) -->
      <div class="rr-action-item rr-vote-group">
        <button
          type="button"
          class="rr-action-btn rr-upvote-btn ${isUpvoted ? "is-active-up" : ""}"
          aria-label="Upvote"
          title="Upvote"
        >
          ${getUpvoteIconSvg(isUpvoted)}
        </button>
        <span class="rr-action-label rr-score-label">${formatScoreDisplay(post.score, isUpvoted || isDownvoted)}</span>
        <button
          type="button"
          class="rr-action-btn rr-downvote-btn ${isDownvoted ? "is-active-down" : ""}"
          aria-label="Downvote"
          title="Downvote"
        >
          ${getDownvoteIconSvg(isDownvoted)}
        </button>
      </div>

      <!-- 3. Reddit Comments (Directly opens Reddit comments) -->
      <div class="rr-action-item">
        <button
          type="button"
          class="rr-action-btn rr-comment-btn"
          aria-label="Open Reddit comments"
          title="Open Reddit comments"
        >
          ${getCommentIconSvg()}
        </button>
        <span class="rr-action-label">${formatCount(post.commentCount)}</span>
      </div>
    </div>
  `;
    const upvoteBtn = overlay.querySelector(".rr-upvote-btn");
    const downvoteBtn = overlay.querySelector(".rr-downvote-btn");
    const commentBtn = overlay.querySelector(".rr-comment-btn");
    const ccBtn = overlay.querySelector(".rr-cc-btn");
    const scoreLabel = overlay.querySelector(".rr-score-label");
    const subBadge = overlay.querySelector(".rr-sub-badge");
    const authorBadge = overlay.querySelector(".rr-author");
    if (upvoteBtn) {
      upvoteBtn.onclick = (e2) => {
        e2.stopPropagation();
        const ok = proxyUpvote(post, () => syncVoteUI());
        syncVoteUI(!ok);
      };
    }
    if (downvoteBtn) {
      downvoteBtn.onclick = (e2) => {
        e2.stopPropagation();
        const ok = proxyDownvote(post, () => syncVoteUI());
        syncVoteUI(!ok);
      };
    }
    function syncVoteUI(revert = false) {
      const isUp = revert ? initialVoteVal === 1 : !!post.isUpvoted;
      const isDown = revert ? initialVoteVal === -1 : !!post.isDownvoted;
      if (upvoteBtn) {
        upvoteBtn.classList.toggle("is-active-up", isUp);
        upvoteBtn.innerHTML = getUpvoteIconSvg(isUp);
      }
      if (downvoteBtn) {
        downvoteBtn.classList.toggle("is-active-down", isDown);
        downvoteBtn.innerHTML = getDownvoteIconSvg(isDown);
      }
      if (scoreLabel) {
        const curVal = isUp ? 1 : isDown ? -1 : 0;
        const newScore = baseScore + (curVal - initialVoteVal);
        scoreLabel.textContent = formatScoreDisplay(newScore, isUp || isDown);
      }
    }
    if (commentBtn) {
      commentBtn.onclick = (e2) => {
        e2.stopPropagation();
        if (post.permalink) {
          const url = post.permalink.startsWith("http") ? post.permalink : `https://www.reddit.com${post.permalink}`;
          openUrl(url);
        }
      };
    }
    if (ccBtn && options.onToggleSubtitles) {
      ccBtn.onclick = (e2) => {
        e2.stopPropagation();
        options.onToggleSubtitles();
      };
    }
    if (subBadge) {
      subBadge.onclick = (e2) => {
        e2.stopPropagation();
      };
    }
    if (authorBadge) {
      authorBadge.onclick = (e2) => {
        e2.stopPropagation();
      };
    }
    postEl.appendChild(overlay);
    return overlay;
  }
  function syncOverlaySubtitlesButtons(enabled) {
    document.querySelectorAll(".rr-cc-btn").forEach((btn) => {
      btn.classList.toggle("is-active-cc", enabled);
      btn.setAttribute("aria-label", enabled ? "Disable Subtitles" : "Enable Subtitles");
      btn.setAttribute("title", enabled ? "Disable Subtitles" : "Enable Subtitles");
      btn.innerHTML = getCcIconSvg();
    });
  }
  const CAPTION_BUTTON_SELECTORS = [
    'button[aria-label*="caption" i]',
    'button[aria-label*="subtitle" i]',
    'button[aria-label*="closed caption" i]',
    'button[data-testid*="caption" i]',
    'button[data-testid*="subtitle" i]',
    '[data-testid*="caption" i] button',
    '[data-testid*="subtitle" i] button'
  ];
  function isPressed(btn) {
    if (btn.getAttribute("aria-pressed") === "true") return true;
    if (btn.getAttribute("aria-pressed") === "false") return false;
    if (btn.getAttribute("aria-checked") === "true") return true;
    if (btn.getAttribute("aria-checked") === "false") return false;
    if (btn.getAttribute("data-selected") === "true") return true;
    if (btn.getAttribute("data-selected") === "false") return false;
    if (btn.classList.contains("active") || btn.classList.contains("selected") || btn.classList.contains("enabled")) return true;
    return null;
  }
  function findCaptionButton(root) {
    for (const selector of CAPTION_BUTTON_SELECTORS) {
      try {
        const found = root.querySelector?.(selector);
        if (found) return found;
      } catch {
      }
    }
    return null;
  }
  function syncPlayerCaptionsControl(player, enabled) {
    try {
      const scopes = [player];
      if (player.shadowRoot) scopes.push(player.shadowRoot);
      for (const child of Array.from(player.children)) {
        if (child.shadowRoot) scopes.push(child.shadowRoot);
      }
      for (const scope of scopes) {
        const btn = findCaptionButton(scope);
        if (!btn) continue;
        const pressed = isPressed(btn);
        if (pressed === null || pressed === enabled) continue;
        btn.click();
        return;
      }
    } catch {
    }
  }
  function applySubtitlesState(container, enabled) {
    try {
      container.dataset.rrCaptions = enabled ? "on" : "off";
    } catch {
    }
    const { videos, players } = deepFindMediaElements(container);
    videos.forEach((v2) => {
      if (v2.textTracks && v2.textTracks.length > 0) {
        for (let i2 = 0; i2 < v2.textTracks.length; i2++) {
          try {
            v2.textTracks[i2].mode = enabled ? "showing" : "disabled";
          } catch {
          }
        }
      }
    });
    players.forEach((p2) => {
      p2.classList.toggle("rr-hide-captions", !enabled);
      syncPlayerCaptionsControl(p2, enabled);
    });
    if (enabled) {
      container.classList.remove("rr-hide-captions");
    } else {
      container.classList.add("rr-hide-captions");
    }
  }
  function promoteGalleryMedia(container) {
    container.querySelectorAll("picture source, source").forEach((source) => {
      try {
        const ds = source.dataset;
        const lazySrcset = ds?.srcset || ds?.lazySrcset || source.getAttribute("data-srcset") || source.getAttribute("data-lazy-srcset");
        if (lazySrcset && (!source.srcset || source.srcset.startsWith("data:image/gif"))) {
          source.srcset = lazySrcset;
        }
      } catch {
      }
    });
    container.querySelectorAll("img").forEach((img) => {
      try {
        if (img.classList.contains("post-background-image-filter") || img.classList.contains("shreddit-subreddit-icon__icon")) {
          return;
        }
        img.setAttribute("loading", "eager");
        img.setAttribute("fetchpriority", "high");
        img.removeAttribute("decoding");
        const ds = img.dataset;
        const lazySrc = ds?.src || ds?.lazySrc || img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        const isPlaceholder = !img.src || img.src === "about:blank" || img.src.startsWith("data:image/gif") || img.src.startsWith("data:image/svg");
        if (lazySrc && isPlaceholder) {
          img.src = lazySrc;
        }
        const lazySrcset = ds?.srcset || ds?.lazySrcset || img.getAttribute("data-srcset") || img.getAttribute("data-lazy-srcset");
        if (lazySrcset && (!img.srcset || img.srcset.startsWith("data:image/gif"))) {
          img.srcset = lazySrcset;
        }
        img.style.removeProperty("display");
      } catch {
      }
    });
  }
  function unconstrainPlayerShadow(player) {
    player.style.setProperty("--max-height", "100dvh", "important");
    player.style.setProperty("--max-width", "100vw", "important");
    player.style.setProperty("max-height", "100dvh", "important");
    player.style.setProperty("max-width", "100vw", "important");
    player.style.setProperty("height", "100dvh", "important");
    player.style.setProperty("width", "100vw", "important");
    player.style.setProperty("position", "absolute", "important");
    player.style.setProperty("inset", "0", "important");
    if (player.shadowRoot) {
      if (!player.shadowRoot.querySelector("#rr-unconstrain-style")) {
        const shadowStyle = document.createElement("style");
        shadowStyle.id = "rr-unconstrain-style";
        shadowStyle.textContent = `
        :host {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100vw !important;
          max-height: 100dvh !important;
          background: transparent !important;
        }
        video {
          width: 100% !important;
          height: 100% !important;
          max-width: 100vw !important;
          max-height: 100dvh !important;
          object-fit: contain !important;
          background: transparent !important;
        }
        :host(.rr-vertical-video) video,
        :host([data-is-vertical="true"]) video,
        video.rr-vertical-video {
          object-fit: cover !important;
        }
        :host(.rr-fit-cover) video,
        video.rr-fit-cover {
          object-fit: cover !important;
        }
        :host(.rr-fit-contain) video,
        video.rr-fit-contain {
          object-fit: contain !important;
        }
        /* Subtitles / captions toggle: works cross-browser via host class */
        :host(.rr-hide-captions) ::cue,
        :host(.rr-hide-captions) .captions-display,
        :host(.rr-hide-captions) [data-testid="captions"],
        :host(.rr-hide-captions) shreddit-player-captions,
        :host(.rr-hide-captions) .caption-wrapper,
        :host(.rr-hide-captions) .caption-container,
        :host(.rr-hide-captions) [part="captions"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `;
        player.shadowRoot.appendChild(shadowStyle);
      }
    }
  }
  function unconstrainPostMedia(postEl) {
    postEl.querySelectorAll(
      'shreddit-aspect-ratio, [slot="post-media-container"], [data-aspect-ratio-container], .media-container, gallery-carousel, faceplate-carousel, shreddit-async-loader, .media-lightbox-img, shreddit-media-lightbox-listener'
    ).forEach((el) => {
      el.style.setProperty("--max-height", "100dvh", "important");
      el.style.setProperty("--max-width", "100vw", "important");
      el.style.setProperty("max-height", "100dvh", "important");
      el.style.setProperty("max-width", "100vw", "important");
      el.style.setProperty("height", "100dvh", "important");
      el.style.setProperty("width", "100vw", "important");
      el.style.setProperty("min-height", "100dvh", "important");
      el.style.setProperty("--gallery-initial-height", "100dvh", "important");
      el.style.setProperty("aspect-ratio", "unset", "important");
      if (el.hasAttribute("aspect-ratio") && !el.dataset.rrOrigAspectRatio) {
        el.dataset.rrOrigAspectRatio = el.getAttribute("aspect-ratio") || "";
      }
      if (el.hasAttribute("max-height") && !el.dataset.rrOrigMaxHeight) {
        el.dataset.rrOrigMaxHeight = el.getAttribute("max-height") || "";
      }
      el.removeAttribute("aspect-ratio");
      el.removeAttribute("max-height");
    });
    postEl.querySelectorAll("shreddit-player-2").forEach((player) => {
      unconstrainPlayerShadow(player);
    });
    postEl.querySelectorAll('gallery-carousel, faceplate-carousel, [data-testid="media-gallery"]').forEach((carousel) => {
      promoteGalleryMedia(carousel);
      const wired = carousel;
      if (!wired.dataset.rrGalleryWired) {
        wired.dataset.rrGalleryWired = "1";
        carousel.addEventListener("scroll", () => promoteGalleryMedia(carousel), { passive: true });
        carousel.addEventListener("click", () => {
          setTimeout(() => promoteGalleryMedia(carousel), 50);
        }, { passive: true });
      }
    });
    const { videos } = deepFindMediaElements(postEl);
    videos.forEach((v2) => {
      const handleSizing = () => {
        const w2 = v2.videoWidth;
        const h2 = v2.videoHeight;
        if (w2 > 0 && h2 > 0) {
          const isVertical = h2 / w2 >= 1.5;
          if (isVertical) {
            v2.classList.add("rr-vertical-video");
            v2.style.setProperty("object-fit", "cover", "important");
            postEl.classList.add("rr-has-vertical-video");
            postEl.setAttribute("data-vertical-video", "true");
            const player = v2.closest("shreddit-player-2") || postEl.querySelector("shreddit-player-2");
            if (player) {
              player.classList.add("rr-vertical-video");
              player.setAttribute("data-is-vertical", "true");
            }
          } else {
            v2.classList.remove("rr-vertical-video");
            v2.style.setProperty("object-fit", "contain", "important");
            postEl.classList.remove("rr-has-vertical-video");
            postEl.removeAttribute("data-vertical-video");
          }
        }
      };
      handleSizing();
      const wired = v2;
      if (!wired.dataset.rrWired) {
        wired.dataset.rrWired = "1";
        v2.addEventListener("loadedmetadata", handleSizing);
        v2.addEventListener("resize", handleSizing);
        v2.addEventListener("loadedmetadata", () => {
          const pref = postEl.dataset?.rrCaptions;
          if (pref !== "on" && pref !== "off") return;
          const wantOn = pref === "on";
          try {
            const tracks = v2.textTracks;
            for (let i2 = 0; i2 < (tracks?.length || 0); i2++) {
              try {
                tracks[i2].mode = wantOn ? "showing" : "disabled";
              } catch {
              }
            }
          } catch {
          }
        });
      }
    });
  }
  function restorePostMedia(postEl) {
    postEl.querySelectorAll(
      'shreddit-aspect-ratio, [slot="post-media-container"], [data-aspect-ratio-container], .media-container, gallery-carousel, faceplate-carousel, shreddit-async-loader, .media-lightbox-img, shreddit-media-lightbox-listener'
    ).forEach((el) => {
      el.style.removeProperty("--max-height");
      el.style.removeProperty("--max-width");
      el.style.removeProperty("max-height");
      el.style.removeProperty("max-width");
      el.style.removeProperty("height");
      el.style.removeProperty("width");
      el.style.removeProperty("min-height");
      el.style.removeProperty("--gallery-initial-height");
      el.style.removeProperty("aspect-ratio");
      if (el.dataset.rrOrigAspectRatio !== void 0) {
        el.setAttribute("aspect-ratio", el.dataset.rrOrigAspectRatio);
        delete el.dataset.rrOrigAspectRatio;
      }
      if (el.dataset.rrOrigMaxHeight !== void 0) {
        el.setAttribute("max-height", el.dataset.rrOrigMaxHeight);
        delete el.dataset.rrOrigMaxHeight;
      }
    });
    postEl.querySelectorAll("shreddit-player-2").forEach((player) => {
      player.style.removeProperty("--max-height");
      player.style.removeProperty("--max-width");
      player.style.removeProperty("max-height");
      player.style.removeProperty("max-width");
      player.style.removeProperty("height");
      player.style.removeProperty("width");
      player.style.removeProperty("position");
      player.style.removeProperty("inset");
      player.classList.remove("rr-vertical-video", "rr-hide-captions");
      player.removeAttribute("data-is-vertical");
      if (player.shadowRoot) {
        const shadowStyle = player.shadowRoot.querySelector("#rr-unconstrain-style");
        shadowStyle?.remove();
      }
    });
    postEl.querySelectorAll('gallery-carousel, faceplate-carousel, [data-testid="media-gallery"]').forEach((carousel) => {
      if (carousel.shadowRoot) {
        const style = carousel.shadowRoot.querySelector("#rr-carousel-style");
        style?.remove();
      }
      delete carousel.dataset.rrGalleryWired;
    });
    const { videos } = deepFindMediaElements(postEl);
    videos.forEach((v2) => {
      v2.classList.remove("rr-vertical-video");
      v2.style.removeProperty("object-fit");
    });
    postEl.classList.remove("rr-has-vertical-video", "rr-hide-captions");
    postEl.removeAttribute("data-vertical-video");
    delete postEl.dataset.rrCaptions;
  }
  const POST_SELECTORS = 'shreddit-post, article, [data-testid="post-container"], .Post';
  const VOLUME_STEP = 0.1;
  const TAP_WINDOW_MS = 320;
  const SWIPE_CANCEL_PX = 10;
  class InputController {
    options;
    lastTapTimestamp = 0;
    lastTapPost = null;
    tapCount = 0;
    singleTapTimer = null;
    clickListener = null;
    keydownListener = null;
    pointerListener = null;
    downX = 0;
    downY = 0;
    downActive = false;
    constructor(options) {
      this.options = options;
    }
    attach() {
      if (!this.clickListener) {
        this.clickListener = (e2) => this.handleTap(e2);
        document.addEventListener("click", this.clickListener, true);
      }
      if (!this.keydownListener) {
        this.keydownListener = (e2) => this.handleKeyDown(e2);
        window.addEventListener("keydown", this.keydownListener, true);
      }
      if (!this.pointerListener) {
        this.pointerListener = (e2) => {
          if (e2.type === "pointerdown") {
            this.downX = e2.clientX;
            this.downY = e2.clientY;
            this.downActive = true;
          } else {
            this.downActive = false;
          }
        };
        document.addEventListener("pointerdown", this.pointerListener, true);
        document.addEventListener("pointerup", this.pointerListener, true);
      }
    }
    detach() {
      if (this.clickListener) {
        document.removeEventListener("click", this.clickListener, true);
        this.clickListener = null;
      }
      if (this.keydownListener) {
        window.removeEventListener("keydown", this.keydownListener, true);
        this.keydownListener = null;
      }
      if (this.pointerListener) {
        document.removeEventListener("pointerdown", this.pointerListener, true);
        document.removeEventListener("pointerup", this.pointerListener, true);
        this.pointerListener = null;
      }
      this.lastTapTimestamp = 0;
      this.lastTapPost = null;
      this.tapCount = 0;
      this.downActive = false;
      if (this.singleTapTimer) {
        clearTimeout(this.singleTapTimer);
        this.singleTapTimer = null;
      }
    }
    fireSingleTap(post) {
      if (!this.options.isReelModeActive()) return;
      const video = audioManager.findVideo(post);
      if (video) {
        const wasPaused = video.paused;
        if (wasPaused) {
          applyAudioState(post, audioManager.isMuted, audioManager.volume);
          video.play().catch(() => {
          });
        } else {
          video.pause();
        }
        showPlayPulse(wasPaused);
      } else if (post.querySelector("iframe")) ;
    }
    fireDoubleTapUpvote() {
      if (!this.options.isReelModeActive()) return;
      const getPost = this.options.getActiveReelPost;
      const reel = getPost ? getPost() : null;
      if (!reel) return;
      const ok = proxyUpvote(reel);
      showVotePulse(ok ? !!reel.isUpvoted : false);
    }
    toggleFitFill(post) {
      const isCurrentlyContain = post.classList.contains("rr-fit-contain");
      if (isCurrentlyContain) {
        post.classList.remove("rr-fit-contain");
        post.classList.add("rr-fit-cover");
        showScalePulse("Fill (Full Bleed)");
      } else {
        post.classList.remove("rr-fit-cover");
        post.classList.add("rr-fit-contain");
        showScalePulse("Fit (Original)");
      }
    }
    handleTap(e2) {
      if (!this.options.isReelModeActive()) return;
      const target = e2.target;
      if (target.closest(
        '.rr-action-rail, .rr-post-info, .rr-top-bar, .rr-link-card-container, .rr-text-card-container, button, a, shreddit-post-action-row, [slot="action-row"], [slot="vote"]'
      )) {
        return;
      }
      const post = target.closest(POST_SELECTORS);
      if (!post) return;
      e2.preventDefault();
      e2.stopPropagation();
      if (this.wasSwipe(e2)) {
        this.resetTapState();
        return;
      }
      unlockAudio();
      audioManager.reassertActiveIframeUnmute();
      const now = Date.now();
      const samePost = this.lastTapPost === post;
      const inWindow = now - this.lastTapTimestamp < TAP_WINDOW_MS;
      if (inWindow && samePost) {
        this.tapCount += 1;
      } else {
        this.tapCount = 1;
      }
      this.lastTapTimestamp = now;
      this.lastTapPost = post;
      if (this.tapCount === 2) {
        if (this.singleTapTimer) {
          clearTimeout(this.singleTapTimer);
          this.singleTapTimer = null;
        }
        this.fireDoubleTapUpvote();
        return;
      }
      if (this.tapCount === 3) {
        if (this.singleTapTimer) {
          clearTimeout(this.singleTapTimer);
          this.singleTapTimer = null;
        }
        this.resetTapState();
        this.toggleFitFill(post);
        return;
      }
      if (this.singleTapTimer) {
        clearTimeout(this.singleTapTimer);
      }
      this.singleTapTimer = setTimeout(() => {
        this.singleTapTimer = null;
        this.resetTapState();
        this.fireSingleTap(post);
      }, TAP_WINDOW_MS);
    }
    wasSwipe(e2) {
      try {
        const dx = e2.clientX - this.downX;
        const dy = e2.clientY - this.downY;
        return Math.hypot(dx, dy) > SWIPE_CANCEL_PX;
      } catch {
        return false;
      }
    }
    resetTapState() {
      this.lastTapTimestamp = 0;
      this.lastTapPost = null;
      this.tapCount = 0;
    }
    handleKeyDown(e2) {
      if (!this.options.isReelModeActive()) return;
      const target = e2.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e2.key === "Escape") {
        this.options.onExit();
      } else if (e2.key === "m" || e2.key === "M") {
        this.options.onToggleMute();
      } else if (e2.key === "f" || e2.key === "F") {
        const post = this.options.getActivePost();
        if (post) this.toggleFitFill(post);
      } else if (e2.key === "+" || e2.key === "=" || e2.shiftKey && e2.key === "ArrowUp") {
        e2.preventDefault();
        this.changeVolume(VOLUME_STEP);
      } else if (e2.key === "-" || e2.key === "_" || e2.shiftKey && e2.key === "ArrowDown") {
        e2.preventDefault();
        this.changeVolume(-VOLUME_STEP);
      } else if (e2.key === "c" || e2.key === "C") {
        this.options.onToggleSubtitles?.();
      } else if (e2.key === "j" || e2.key === "J" || !e2.shiftKey && e2.key === "ArrowDown") {
        e2.preventDefault();
        this.options.onNextPost?.();
      } else if (e2.key === "k" || e2.key === "K" || !e2.shiftKey && e2.key === "ArrowUp") {
        e2.preventDefault();
        this.options.onPrevPost?.();
      }
    }
    changeVolume(delta) {
      unlockAudio();
      const post = this.options.getActivePost();
      const level = audioManager.adjustVolume(delta, post || void 0);
      audioManager.reassertActiveIframeUnmute();
      showVolumePulse(level, audioManager.isMuted);
      this.options.onVolumeChange?.(level, audioManager.isMuted);
    }
  }
  function renderTextCard(postEl, post) {
    if (postEl.querySelector(".rr-text-card-container")) return;
    const targetUrl = post.permalink ? post.permalink.startsWith("http") ? post.permalink : `https://www.reddit.com${post.permalink}` : post.contentHref || "";
    const container = document.createElement("div");
    container.className = "rr-text-card-container";
    let rawBody = (post.textBody || "").trim();
    if (post.title) {
      const trimmedTitle = post.title.trim();
      if (rawBody.startsWith(trimmedTitle)) {
        rawBody = rawBody.slice(trimmedTitle.length).trim();
      }
    }
    const paragraphs = rawBody.split(/\n\n+/).map((p2) => p2.trim()).filter((p2) => p2.length > 0);
    const formattedBodyHtml = paragraphs.length > 0 ? paragraphs.map((p2) => `<p>${escapeHtml(p2)}</p>`).join("") : rawBody ? `<p>${escapeHtml(rawBody)}</p>` : "";
    const pillText = post.subreddit ? post.subreddit : "Discussion";
    container.innerHTML = `
    <div class="rr-text-card" role="article" aria-label="${escapeHtml(post.title)}">
      <div class="rr-text-card-header">
        <div class="rr-text-pill" title="${escapeHtml(pillText)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>${escapeHtml(pillText)}</span>
        </div>
        ${targetUrl ? `<a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="rr-text-open-btn" title="Open full post on Reddit">
                <span>Read Full</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>` : ""}
      </div>
      <h2 class="rr-text-card-title">${escapeHtml(post.title)}</h2>
      ${formattedBodyHtml ? `<div class="rr-text-card-body">${formattedBodyHtml}</div>` : ""}
    </div>
  `;
    const openBtn = container.querySelector(".rr-text-open-btn");
    if (openBtn) {
      openBtn.addEventListener("click", (e2) => {
        e2.stopPropagation();
      });
    }
    const cardBody = container.querySelector(".rr-text-card-body");
    if (cardBody) {
      cardBody.addEventListener("wheel", (e2) => {
        e2.stopPropagation();
      }, { passive: true });
      cardBody.addEventListener("touchmove", (e2) => {
        e2.stopPropagation();
      }, { passive: true });
    }
    const titleEl = container.querySelector(".rr-text-card-title");
    if (titleEl && targetUrl) {
      titleEl.style.cursor = "pointer";
      titleEl.addEventListener("click", (e2) => {
        e2.stopPropagation();
        openUrl(targetUrl);
      });
    }
    postEl.appendChild(container);
  }
  function findThumbnailUrl(postEl, post) {
    if (post.mediaUrl && !post.mediaUrl.endsWith(".mp4") && !post.mediaUrl.endsWith(".m3u8")) {
      return post.mediaUrl;
    }
    const img = postEl.querySelector(
      'img#post-image, [data-post-media-primary], shreddit-aspect-ratio img, [slot="post-media-container"] img:not(.shreddit-subreddit-icon__icon), img.preview-img, img.preview'
    );
    if (img?.src && !img.src.startsWith("data:image/svg")) {
      return img.src;
    }
    return void 0;
  }
  function renderLinkCard(postEl, post) {
    if (postEl.querySelector(".rr-link-card-container")) return;
    const domain = extractDomain(post.contentHref);
    const thumbUrl = findThumbnailUrl(postEl, post);
    const targetUrl = post.contentHref || (post.permalink.startsWith("http") ? post.permalink : `https://www.reddit.com${post.permalink}`);
    const container = document.createElement("div");
    container.className = "rr-link-card-container";
    container.innerHTML = `
    <div class="rr-link-card" tabindex="0" role="link" aria-label="Open ${escapeHtml(post.title)} on ${escapeHtml(domain)}">
      ${thumbUrl ? `<div class="rr-link-card-thumb-wrap">
               <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(post.title)}" class="rr-link-card-thumb" />
             </div>` : ""}
      <div class="rr-link-card-body">
        ${domain ? `<div class="rr-link-card-domain rr-link-domain-badge">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="2" y1="12" x2="22" y2="12"></line>
                   <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
                 </svg>
                 <span>${escapeHtml(domain)}</span>
               </div>` : ""}
        <h3 class="rr-link-card-title">${escapeHtml(post.title)}</h3>
        <button type="button" class="rr-link-card-cta">
          <span>Read Article</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `;
    const linkCard = container.querySelector(".rr-link-card");
    const ctaBtn = container.querySelector(".rr-link-card-cta");
    const openLink = (e2) => {
      e2.stopPropagation();
      e2.preventDefault();
      if (targetUrl) {
        openUrl(targetUrl);
      }
    };
    linkCard?.addEventListener("click", openLink);
    linkCard?.addEventListener("keydown", (e2) => {
      if (e2.key === "Enter" || e2.key === " ") {
        openLink(e2);
      }
    });
    ctaBtn?.addEventListener("click", openLink);
    postEl.appendChild(container);
  }
  const VIDEOS_ONLY_KEY = "@reddit-reels/videos-only";
  const SUBTITLES_KEY = "@reddit-reels/subtitles";
  function readPref(key) {
    try {
      if (typeof GM_getValue === "function") {
        const gmVal = GM_getValue(key, null);
        if (gmVal !== null) return gmVal === "1";
      }
    } catch {
    }
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  }
  function writePref(key, value) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(key, value ? "1" : "0");
      }
    } catch {
    }
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {
    }
  }
  function hasVideoContent(postEl, postType) {
    const resolvedType = postType ?? postEl.dataset?.rrPostType;
    if (resolvedType === "video") return true;
    if (resolvedType === void 0) {
      if (postEl.getAttribute("post-type") === "video") return true;
      const domain = postEl.getAttribute("domain") || "";
      const contentHref = postEl.getAttribute("content-href") || "";
      if (/(redgifs\.com|streamable\.com|gfycat\.com)/i.test(domain + " " + contentHref)) return true;
      if (postEl.querySelector("iframe")) return true;
      try {
        const parsed = parsePostElement(postEl);
        if (parsed.postType === "video") return true;
      } catch {
      }
    }
    return !!audioManager.findVideo(postEl) || !!postEl.querySelector("iframe");
  }
  function getPostElements() {
    const shredditPosts = Array.from(document.querySelectorAll("shreddit-post"));
    if (shredditPosts.length > 0) {
      return shredditPosts;
    }
    const rawPosts = Array.from(
      document.querySelectorAll('article, [data-testid="post-container"], .Post')
    );
    return rawPosts.filter((el) => {
      return !rawPosts.some((other) => other !== el && other.contains(el));
    });
  }
  function getClosestPostToViewport() {
    const posts = getPostElements().filter((p2) => !p2.classList.contains("rr-filtered-out"));
    if (posts.length === 0) return null;
    const viewportCenter = window.innerHeight / 2;
    let closest = null;
    let minDistance = Infinity;
    for (const post of posts) {
      const rect = post.getBoundingClientRect();
      const postCenter = rect.top + rect.height / 2;
      const distance = Math.abs(postCenter - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closest = post;
      }
    }
    return closest || posts[0];
  }
  class FeedManager {
    options;
    feedObserver = null;
    mutationObserver = null;
    mutationDebounce = null;
    videosOnlyMode = false;
    subtitlesEnabled = false;
    constructor(options) {
      this.options = options;
      this.videosOnlyMode = readPref(VIDEOS_ONLY_KEY);
      this.subtitlesEnabled = readPref(SUBTITLES_KEY);
    }
    get isVideosOnly() {
      return this.videosOnlyMode;
    }
    get isSubtitles() {
      return this.subtitlesEnabled;
    }
    setVideosOnly(value) {
      this.videosOnlyMode = value;
      writePref(VIDEOS_ONLY_KEY, value);
      this.applyVideosOnlyFilter();
    }
    toggleVideosOnly() {
      this.setVideosOnly(!this.videosOnlyMode);
      return this.videosOnlyMode;
    }
    toggleSubtitles() {
      this.subtitlesEnabled = !this.subtitlesEnabled;
      writePref(SUBTITLES_KEY, this.subtitlesEnabled);
      document.documentElement.classList.toggle("rr-hide-captions", !this.subtitlesEnabled);
      const posts = getPostElements();
      posts.forEach((p2) => applySubtitlesState(p2, this.subtitlesEnabled));
      syncOverlaySubtitlesButtons(this.subtitlesEnabled);
      return this.subtitlesEnabled;
    }
    enhancePost(postEl) {
      if (postEl.querySelector(".rr-post-overlay")) return;
      const post = parsePostElement(postEl);
      const hasVideo = hasVideoContent(postEl, post.postType);
      const isLinkPost = post.postType === "link";
      const isTextPost = post.postType === "text";
      if (postEl.shadowRoot) {
        if (!postEl.shadowRoot.querySelector("#rr-shadow-cleanup-style")) {
          const shadowStyle = document.createElement("style");
          shadowStyle.id = "rr-shadow-cleanup-style";
          shadowStyle.textContent = `
          rpl-action-bar,
          shreddit-action-bar,
          shreddit-post-action-row,
          feed-post-action-row,
          [data-testid="action-row"],
          [data-testid="post-vote-control"],
          shreddit-vote-animations,
          slot[name="share-button"],
          slot[name="credit-bar"],
          slot[name="action-row"] {
            display: none !important;
            visibility: hidden !important;
          }
          shreddit-post-vote-control,
          slot[name="vote"],
          slot[name="vote-button"] {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            overflow: hidden !important;
          }
        `;
          postEl.shadowRoot.appendChild(shadowStyle);
        }
      }
      if (isLinkPost) {
        postEl.classList.add("rr-is-link");
        renderLinkCard(postEl, post);
      } else if (isTextPost) {
        postEl.classList.add("rr-is-text");
        renderTextCard(postEl, post);
      } else {
        if (post.postType === "video" && !postEl.querySelector("video, iframe")) {
          const media = resolveMedia(post);
          if (media.type === "iframe" && media.src) {
            const container = postEl.querySelector('[slot="post-media-container"]') || postEl.querySelector(".media-container") || postEl;
            const iframe = document.createElement("iframe");
            const src = normalizeIframeSrc(media.src, audioManager.isMuted);
            iframe.src = src;
            iframe.className = "rr-embedded-iframe";
            iframe.tabIndex = -1;
            iframe.setAttribute("loading", "eager");
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowfullscreen", "true");
            iframe.setAttribute("allow", "autoplay; fullscreen; encrypted-media; picture-in-picture");
            container.appendChild(iframe);
            try {
              iframe.blur();
            } catch {
            }
            audioManager.invalidateVideoCache(postEl);
          }
        }
        unconstrainPostMedia(postEl);
        applySubtitlesState(postEl, this.subtitlesEnabled);
      }
      if (this.videosOnlyMode && !hasVideo) {
        postEl.classList.add("rr-filtered-out");
      } else {
        postEl.classList.remove("rr-filtered-out");
      }
      postEl.style.removeProperty("display");
      const NATIVE_SUPPRESSION_SELECTORS = '[slot="credit-bar"], [slot="post-credit-bar"], [slot="title-and-metadata"], [slot="title"], [slot="action-row"], [slot="text-body"], shreddit-post-action-row, feed-post-action-row, shreddit-action-bar, rpl-action-bar, shreddit-post-credit-bar, faceplate-tracker, shreddit-interaction-container';
      const VOTE_OFFSCREEN_SELECTORS = '[slot="vote"], [slot="vote-button"], shreddit-post-vote-control, [data-testid="post-vote-control"]';
      Array.from(postEl.children).forEach((child) => {
        const el = child;
        if (el.classList?.contains("rr-post-overlay") || el.classList?.contains("rr-link-card-container") || el.classList?.contains("rr-text-card-container")) {
          return;
        }
        if (el.matches?.(NATIVE_SUPPRESSION_SELECTORS)) {
          el.classList.add("rr-native-suppressed");
          return;
        }
        if (el.matches?.(VOTE_OFFSCREEN_SELECTORS)) {
          el.classList.add("rr-native-offscreen");
          return;
        }
        if (!isLinkPost && !isTextPost && (el.matches?.(
          '[slot="post-media-container"], shreddit-player-2, .media-container, gallery-carousel, faceplate-carousel, shreddit-aspect-ratio, shreddit-async-loader'
        ) || el.querySelector("video, img:not(.shreddit-subreddit-icon__icon), iframe, gallery-carousel, faceplate-carousel, shreddit-player-2") !== null)) {
          return;
        }
        el.classList.add("rr-native-suppressed");
      });
      postEl.querySelectorAll(NATIVE_SUPPRESSION_SELECTORS).forEach((el) => {
        el.classList.add("rr-native-suppressed");
      });
      postEl.querySelectorAll(VOTE_OFFSCREEN_SELECTORS).forEach((el) => {
        el.classList.add("rr-native-offscreen");
      });
      renderReelOverlay(postEl, post, {
        hasVideo,
        isSubtitlesEnabled: () => this.subtitlesEnabled,
        onToggleSubtitles: () => this.toggleSubtitles()
      });
    }
    /**
     * Reverses enhancements on a single post element, completely restoring native Reddit state
     */
    restorePost(postEl) {
      postEl.querySelectorAll(
        ".rr-post-overlay, .rr-text-card-container, .rr-link-card-container"
      ).forEach((el) => el.remove());
      postEl.querySelectorAll("iframe.rr-embedded-iframe").forEach((ifr) => {
        ifr.remove();
      });
      if (postEl.shadowRoot) {
        const cleanupStyle = postEl.shadowRoot.querySelector("#rr-shadow-cleanup-style");
        cleanupStyle?.remove();
        const shadowActionBars = postEl.shadowRoot.querySelectorAll(
          'rpl-action-bar, [data-testid="action-row"], .shreddit-post-container, slot[name="action-row"], slot[name="share-button"], slot[name="credit-bar"]'
        );
        shadowActionBars.forEach((el) => {
          el.style.removeProperty("display");
        });
      }
      postEl.querySelectorAll(".rr-native-suppressed, .rr-native-offscreen").forEach((el) => {
        el.classList.remove("rr-native-suppressed", "rr-native-offscreen");
        el.style.removeProperty("display");
      });
      for (let i2 = 0; i2 < postEl.children.length; i2++) {
        const el = postEl.children[i2];
        if (el.classList?.contains("rr-native-suppressed") || el.classList?.contains("rr-native-offscreen")) {
          el.classList.remove("rr-native-suppressed", "rr-native-offscreen");
        }
        el.style?.removeProperty("display");
      }
      restorePostMedia(postEl);
      postEl.classList.remove("rr-filtered-out", "rr-is-link", "rr-is-text");
      postEl.style.removeProperty("display");
    }
    teardownAllPosts() {
      const posts = getPostElements();
      posts.forEach((p2) => this.restorePost(p2));
    }
    enhanceAllPosts() {
      const posts = getPostElements();
      posts.forEach((p2) => this.enhancePost(p2));
    }
    applyVideosOnlyFilter() {
      const posts = getPostElements();
      for (const postEl of posts) {
        const hasVideo = hasVideoContent(postEl, postEl.dataset?.rrPostType);
        if (this.videosOnlyMode && !hasVideo) {
          postEl.classList.add("rr-filtered-out");
        } else {
          postEl.classList.remove("rr-filtered-out");
        }
        postEl.style.removeProperty("display");
      }
    }
    startObservers() {
      this.stopObservers();
      document.documentElement.classList.toggle("rr-hide-captions", !this.subtitlesEnabled);
      this.feedObserver = new IntersectionObserver(
        (entries) => {
          if (!this.options.isReelModeActive()) return;
          for (const entry of entries) {
            const post = entry.target;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              unconstrainPostMedia(post);
              applySubtitlesState(post, this.subtitlesEnabled);
              audioManager.requestPlayback(post);
            } else if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
              applyAudioState(post, true);
              const video = audioManager.findVideo(post);
              if (video) {
                try {
                  if (!video.paused) video.pause();
                  video.muted = true;
                } catch {
                }
              }
            }
          }
        },
        {
          threshold: [0.2, 0.5, 0.8]
        }
      );
      const posts = getPostElements();
      posts.forEach((p2) => this.feedObserver?.observe(p2));
      this.mutationObserver = new MutationObserver((mutations) => {
        if (!this.options.isReelModeActive()) return;
        let hasRelevantChanges = false;
        for (const mutation of mutations) {
          if (mutation.type !== "childList" || mutation.addedNodes.length === 0) continue;
          for (let i2 = 0; i2 < mutation.addedNodes.length; i2++) {
            const node = mutation.addedNodes[i2];
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node;
            if (el.matches?.('shreddit-post, article, [data-testid="post-container"], .Post') || el.querySelector?.('shreddit-post, article, [data-testid="post-container"], .Post')) {
              hasRelevantChanges = true;
              break;
            }
          }
          if (hasRelevantChanges) break;
        }
        if (!hasRelevantChanges) return;
        if (this.mutationDebounce) clearTimeout(this.mutationDebounce);
        this.mutationDebounce = setTimeout(() => {
          this.mutationDebounce = null;
          if (!this.options.isReelModeActive()) return;
          this.enhanceAllPosts();
          this.applyVideosOnlyFilter();
          if (this.feedObserver) {
            const currentPosts = getPostElements();
            currentPosts.forEach((p2) => this.feedObserver?.observe(p2));
          }
        }, 150);
      });
      this.mutationObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    stopObservers() {
      if (this.feedObserver) {
        this.feedObserver.disconnect();
        this.feedObserver = null;
      }
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
      if (this.mutationDebounce) {
        clearTimeout(this.mutationDebounce);
        this.mutationDebounce = null;
      }
    }
    scrollToNext() {
      const posts = getPostElements().filter((p2) => !p2.classList.contains("rr-filtered-out"));
      const active = getClosestPostToViewport();
      if (!active || posts.length === 0) return;
      const currentIndex = posts.indexOf(active);
      if (currentIndex >= 0 && currentIndex < posts.length - 1) {
        posts[currentIndex + 1].scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    scrollToPrev() {
      const posts = getPostElements().filter((p2) => !p2.classList.contains("rr-filtered-out"));
      const active = getClosestPostToViewport();
      if (!active || posts.length === 0) return;
      const currentIndex = posts.indexOf(active);
      if (currentIndex > 0) {
        posts[currentIndex - 1].scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }
  let isReelModeActive = false;
  let topBarElement = null;
  let stopRedgifsReady = null;
  function syncTopBarSound() {
    syncTopBarState(topBarElement, audioManager.isMuted, feedManager.isVideosOnly);
  }
  function handleToggleMute() {
    unlockAudio();
    const activePost = getClosestPostToViewport();
    audioManager.toggleMute(activePost || void 0);
    audioManager.reassertActiveIframeUnmute();
    syncTopBarSound();
  }
  function handleVolumeChange() {
    syncTopBarSound();
  }
  const feedManager = new FeedManager({
    isReelModeActive: () => isReelModeActive
  });
  const inputController = new InputController({
    isReelModeActive: () => isReelModeActive,
    getActivePost: () => getClosestPostToViewport(),
    getActiveReelPost: () => {
      const el = getClosestPostToViewport();
      if (!el) return null;
      try {
        return parsePostElement(el);
      } catch {
        return null;
      }
    },
    onExit: () => toggleReelMode(false),
    onToggleMute: handleToggleMute,
    onVolumeChange: handleVolumeChange,
    onToggleSubtitles: () => feedManager.toggleSubtitles(),
    onNextPost: () => feedManager.scrollToNext(),
    onPrevPost: () => feedManager.scrollToPrev()
  });
  function toggleReelMode(forceState) {
    const nextState = forceState !== void 0 ? forceState : !isReelModeActive;
    isReelModeActive = nextState;
    const feedContainer = document.querySelector('shreddit-feed, #posts-container, [data-testid="feed-container"]') || document.querySelector("main") || document.body;
    if (isReelModeActive) {
      unlockAudio();
      document.documentElement.classList.add("rr-active");
      feedContainer?.classList.add("rr-feed-container");
      feedManager.enhanceAllPosts();
      feedManager.applyVideosOnlyFilter();
      const activePost = getClosestPostToViewport();
      if (activePost) {
        activePost.scrollIntoView({ behavior: "instant", block: "start" });
        audioManager.requestPlayback(activePost);
      }
      if (topBarElement) topBarElement.remove();
      topBarElement = createTopBar(audioManager.isMuted, feedManager.isVideosOnly, {
        onExit: () => toggleReelMode(false),
        onToggleFilter: () => {
          const nextFilter = feedManager.toggleVideosOnly();
          syncTopBarState(topBarElement, audioManager.isMuted, nextFilter);
          const active = getClosestPostToViewport();
          if (active) {
            active.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        },
        onToggleMute: handleToggleMute
      });
      document.body.appendChild(topBarElement);
      feedManager.startObservers();
      inputController.attach();
      if (!stopRedgifsReady) {
        stopRedgifsReady = listenForRedGifsReady(() => ({
          muted: audioManager.isMuted,
          volume: audioManager.volume
        }));
      }
    } else {
      document.documentElement.classList.remove("rr-active");
      feedContainer?.classList.remove("rr-feed-container");
      audioManager.stopAll();
      if (topBarElement) {
        topBarElement.remove();
        topBarElement = null;
      }
      feedManager.stopObservers();
      inputController.detach();
      feedManager.teardownAllPosts();
    }
  }
  function init() {
    if (typeof window !== "undefined" && /redgifs\.com/i.test(window.location.hostname)) {
      return;
    }
    const fabContainerId = "rr-fab-container";
    let fabContainer = document.getElementById(fabContainerId);
    if (!fabContainer) {
      fabContainer = document.createElement("div");
      fabContainer.id = fabContainerId;
      document.body.appendChild(fabContainer);
    }
    R(/* @__PURE__ */ u(FabButton, { onClick: () => toggleReelMode() }), fabContainer);
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
  if (typeof window !== "undefined" && isRedGifsFrame()) {
    initRedGifsBridge();
  }
  if (typeof window !== "undefined") {
    window.extractPosts = extractPosts;
    window.observeNewPosts = observeNewPosts;
    window.proxyUpvote = proxyUpvote;
    window.proxyDownvote = proxyDownvote;
    window.AudioManager = AudioManager;
    window.audioManager = audioManager;
    window.resolveMedia = resolveMedia;
    window.unconstrainPostMedia = unconstrainPostMedia;
  }

})();