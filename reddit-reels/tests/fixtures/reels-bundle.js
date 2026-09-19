(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  function __accessProp(key) {
    return this[key];
  }
  var __toCommonJS = (from) => {
    var entry = (__moduleCache ??= new WeakMap).get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function") {
      for (var key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(entry, key))
          __defProp(entry, key, {
            get: __accessProp.bind(from, key),
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          });
    }
    __moduleCache.set(from, entry);
    return entry;
  };
  var __moduleCache;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // src/index.ts
  var exports_src = {};
  __export(exports_src, {
    AudioManager: () => AudioManager,
    DOWNVOTE_SELECTORS: () => DOWNVOTE_SELECTORS,
    UPVOTE_SELECTORS: () => UPVOTE_SELECTORS,
    audioManager: () => audioManager,
    checkIsDownvoted: () => checkIsDownvoted,
    checkIsUpvoted: () => checkIsUpvoted,
    determinePostType: () => determinePostType,
    extractAuthor: () => extractAuthor,
    extractContentHref: () => extractContentHref,
    extractPermalink: () => extractPermalink,
    extractPostId: () => extractPostId,
    extractPosts: () => extractPosts,
    extractRedGifsId: () => extractRedGifsId,
    extractRedGifsIdFromPost: () => extractRedGifsIdFromPost,
    extractSubreddit: () => extractSubreddit,
    extractTitle: () => extractTitle,
    isRedGifsUrl: () => isRedGifsUrl,
    isRedditVideo: () => isRedditVideo,
    observeNewPosts: () => observeNewPosts,
    parseCommentCount: () => parseCommentCount,
    parsePostElement: () => parsePostElement,
    parseScore: () => parseScore,
    proxyDownvote: () => proxyDownvote,
    proxyUpvote: () => proxyUpvote,
    queryDeep: () => queryDeep,
    resolveMedia: () => resolveMedia,
    resolveRedGifs: () => resolveRedGifs,
    resolveRedditImage: () => resolveRedditImage,
    resolveRedditVideo: () => resolveRedditVideo
  });

  // src/extractor/dom-extractor.ts
  function parseScore(val) {
    if (!val)
      return 0;
    const trimmed = val.trim();
    if (!trimmed || trimmed === "•" || trimmed.toLowerCase() === "vote")
      return 0;
    const kMatch = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*k$/i);
    if (kMatch) {
      return Math.round(parseFloat(kMatch[1]) * 1000);
    }
    const mMatch = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*m$/i);
    if (mMatch) {
      return Math.round(parseFloat(mMatch[1]) * 1e6);
    }
    const parsed = parseInt(trimmed.replace(/,/g, ""), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  function parseCommentCount(val) {
    if (!val)
      return 0;
    const trimmed = val.trim();
    const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*([km])?/i);
    if (match) {
      let num = parseFloat(match[1]);
      const multiplier = match[2]?.toLowerCase();
      if (multiplier === "k")
        num *= 1000;
      else if (multiplier === "m")
        num *= 1e6;
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
    return element.dataset.reelPostId || `t3_gen_${Math.random().toString(36).slice(2, 10)}`;
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
    const heading = element.querySelector('h1, h2, [data-test-id="post-content"] h1, [data-test-id="post-content"] h2');
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
    const authorLink = element.querySelector('a[href*="/user/"], [data-testid="post_author_link"], [data-click-id="user"], [slot="authorName"]');
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
    const subLink = element.querySelector('a[data-click-id="subreddit"], a[href^="/r/"]:not([href*="/comments/"]), a[href*="reddit.com/r/"]:not([href*="/comments/"])');
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
    const commentsLink = element.querySelector('a[data-click-id="comments"], a[slot="full-post-link"], a[href*="/comments/"]');
    if (commentsLink) {
      const href = commentsLink.getAttribute("href");
      if (href)
        return href;
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
      if (src)
        return src;
    }
    const video = element.querySelector("video");
    if (video) {
      if (video.src)
        return video.src;
      const source = video.querySelector("source");
      if (source?.src)
        return source.src;
    }
    const img = element.querySelector('shreddit-aspect-ratio img, [data-testid="post-image"] img, img.preview, img');
    if (img?.src) {
      return img.src;
    }
    const linkAnchor = element.querySelector('a[data-click-id="body"], a.title, [slot="post-media-container"] a');
    if (linkAnchor?.href) {
      return linkAnchor.href;
    }
    return permalink;
  }
  function determinePostType(element, contentHref) {
    const rawType = element.getAttribute("post-type")?.toLowerCase();
    if (rawType === "video" || rawType === "image" || rawType === "gallery" || rawType === "link") {
      return rawType;
    }
    if (rawType === "gallery" || element.querySelector('shreddit-gallery, gallery-carousel, [data-testid="media-gallery"]') !== null) {
      return "gallery";
    }
    const isVideo = rawType === "video" || element.querySelector('shreddit-player-2, video, [data-testid="shreddit-player"]') !== null || /(\.mp4|\.webm|\.m3u8|v\.redd\.it|redgifs\.com)/i.test(contentHref);
    if (isVideo) {
      return "video";
    }
    const isImage = rawType === "image" || element.querySelector('shreddit-aspect-ratio img, [data-testid="post-image"], img.preview, img') !== null || /(\.jpg|\.jpeg|\.png|\.webp|\.gif|i\.redd\.it|i\.imgur\.com)/i.test(contentHref);
    if (isImage) {
      return "image";
    }
    return "link";
  }
  var UPVOTE_SELECTORS = [
    'button[aria-label*="upvote" i]',
    'button[name="upvote"]',
    '[slot="upvote-button"]',
    '[slot="upvote-button"] button',
    'button[data-click-id="upvote"]',
    'button[id*="upvote" i]',
    'faceplate-tracker[action="upvote"] button',
    'faceplate-tracker[source="post"][action="upvote"] button',
    'shreddit-post-action-row button[aria-label*="upvote" i]',
    '[data-testid="upvote-button"]',
    ".arrow.up",
    ".arrow.upmod"
  ];
  var DOWNVOTE_SELECTORS = [
    'button[aria-label*="downvote" i]',
    'button[name="downvote"]',
    '[slot="downvote-button"]',
    '[slot="downvote-button"] button',
    'button[data-click-id="downvote"]',
    'button[id*="downvote" i]',
    'faceplate-tracker[action="downvote"] button',
    'faceplate-tracker[source="post"][action="downvote"] button',
    'shreddit-post-action-row button[aria-label*="downvote" i]',
    '[data-testid="downvote-button"]',
    ".arrow.down",
    ".arrow.downmod"
  ];
  function queryDeep(root, selectors) {
    for (const selector of selectors) {
      const found = root.querySelector(selector);
      if (found)
        return found;
    }
    if (root.shadowRoot) {
      for (const selector of selectors) {
        const found = root.shadowRoot.querySelector(selector);
        if (found)
          return found;
      }
    }
    for (const child of Array.from(root.children)) {
      if (child.shadowRoot) {
        const found = queryDeep(child, selectors);
        if (found)
          return found;
      }
    }
    return null;
  }
  function checkIsUpvoted(element) {
    const voteState = element.getAttribute("vote-state") || element.getAttribute("score-state");
    if (voteState === "upvoted" || voteState === "upvote")
      return true;
    if (element.getAttribute("liked") === "true")
      return true;
    if (element.classList.contains("likes"))
      return true;
    const btn = queryDeep(element, UPVOTE_SELECTORS);
    if (btn) {
      if (btn.getAttribute("aria-pressed") === "true")
        return true;
      if (btn.getAttribute("aria-checked") === "true")
        return true;
      if (btn.getAttribute("data-selected") === "true")
        return true;
      if (btn.classList.contains("active") || btn.classList.contains("upvoted") || btn.classList.contains("upmod") || btn.classList.contains("text-interactive-pressed")) {
        return true;
      }
    }
    return false;
  }
  function checkIsDownvoted(element) {
    const voteState = element.getAttribute("vote-state") || element.getAttribute("score-state");
    if (voteState === "downvoted" || voteState === "downvote")
      return true;
    if (element.getAttribute("liked") === "false")
      return true;
    if (element.classList.contains("dislikes"))
      return true;
    const btn = queryDeep(element, DOWNVOTE_SELECTORS);
    if (btn) {
      if (btn.getAttribute("aria-pressed") === "true")
        return true;
      if (btn.getAttribute("aria-checked") === "true")
        return true;
      if (btn.getAttribute("data-selected") === "true")
        return true;
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
    const scoreAttr = element.getAttribute("score");
    if (scoreAttr !== null) {
      score = parseScore(scoreAttr);
    } else {
      const scoreElem = element.querySelector('[slot="credit-bar"], faceplate-number, [data-test-id="post-score"], .score');
      if (scoreElem) {
        score = parseScore(scoreElem.textContent);
      }
    }
    let commentCount = 0;
    const commentAttr = element.getAttribute("comment-count");
    if (commentAttr !== null) {
      commentCount = parseCommentCount(commentAttr);
    } else {
      const commentElem = element.querySelector('a[data-click-id="comments"], [slot="comment-count"], a[href*="/comments/"]');
      if (commentElem) {
        commentCount = parseCommentCount(commentElem.textContent);
      }
    }
    const isUpvoted = checkIsUpvoted(element);
    const isDownvoted = checkIsDownvoted(element);
    let mediaUrl = undefined;
    if (postType === "video") {
      const player = element.querySelector("shreddit-player-2");
      const videoEl = element.querySelector("video");
      mediaUrl = player?.getAttribute("stream-url") || player?.getAttribute("src") || videoEl?.getAttribute("src") || contentHref || undefined;
    } else if (postType === "image") {
      const img = element.querySelector("img");
      mediaUrl = img?.getAttribute("src") || contentHref || undefined;
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
      isUpvoted,
      isDownvoted
    };
  }
  function findPostElements(root) {
    const elements = [];
    const seen = new Set;
    if ("matches" in root && (root.matches("shreddit-post") || root.matches('[data-testid="post-container"]') || root.matches(".Post"))) {
      elements.push(root);
      seen.add(root);
    }
    const shredditPosts = Array.from(root.querySelectorAll("shreddit-post"));
    for (const el of shredditPosts) {
      if (!seen.has(el)) {
        elements.push(el);
        seen.add(el);
      }
    }
    const fallbackPosts = Array.from(root.querySelectorAll('[data-testid="post-container"], .Post'));
    for (const el of fallbackPosts) {
      if (!seen.has(el) && !elements.some((p) => p.contains(el))) {
        elements.push(el);
        seen.add(el);
      }
    }
    return elements;
  }
  function extractPosts(root) {
    const targetRoot = root ?? (typeof document !== "undefined" ? document : null);
    if (!targetRoot)
      return [];
    const postElements = findPostElements(targetRoot);
    const posts = [];
    const seenIds = new Set;
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
      return () => {};
    }
    const seenIds = new Set;
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
          for (let i = 0;i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node;
              if (el.matches?.('shreddit-post, [data-testid="post-container"], .Post') || el.querySelector?.('shreddit-post, [data-testid="post-container"], .Post')) {
                hasRelevantChanges = true;
                break;
              }
            }
          }
        }
        if (hasRelevantChanges)
          break;
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

  // src/extractor/vote-proxy.ts
  function clickButton(element) {
    const target = element.tagName.toLowerCase() === "button" ? element : element.querySelector("button") ?? element;
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
  function proxyUpvote(post) {
    if (!post || !post.element)
      return false;
    const button = queryDeep(post.element, UPVOTE_SELECTORS);
    if (!button)
      return false;
    const success = clickButton(button);
    if (success) {
      post.isUpvoted = button.getAttribute("aria-pressed") === "true";
      const downBtn = queryDeep(post.element, DOWNVOTE_SELECTORS);
      if (downBtn) {
        post.isDownvoted = downBtn.getAttribute("aria-pressed") === "true";
      }
    }
    return success;
  }
  function proxyDownvote(post) {
    if (!post || !post.element)
      return false;
    const button = queryDeep(post.element, DOWNVOTE_SELECTORS);
    if (!button)
      return false;
    const success = clickButton(button);
    if (success) {
      post.isDownvoted = button.getAttribute("aria-pressed") === "true";
      const upBtn = queryDeep(post.element, UPVOTE_SELECTORS);
      if (upBtn) {
        post.isUpvoted = upBtn.getAttribute("aria-pressed") === "true";
      }
    }
    return success;
  }

  // src/media/audio-manager.ts
  var STORAGE_KEY = "reddit_reels_muted";
  function getInitialMuteState() {
    try {
      if (typeof GM_getValue === "function") {
        const gmVal = GM_getValue(STORAGE_KEY, null);
        if (gmVal !== null && typeof gmVal === "boolean") {
          return gmVal;
        }
      }
    } catch {}
    try {
      if (typeof localStorage !== "undefined") {
        const localVal = localStorage.getItem(STORAGE_KEY);
        if (localVal !== null) {
          return localVal === "true";
        }
      }
    } catch {}
    return false;
  }
  function persistMuteState(muted) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(STORAGE_KEY, muted);
      }
    } catch {}
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(muted));
      }
    } catch {}
  }

  class AudioManager {
    activeVideo = null;
    trackedVideos = new Set;
    _isMuted;
    constructor(initialMuted) {
      this._isMuted = initialMuted !== undefined ? initialMuted : getInitialMuteState();
    }
    get isMuted() {
      return this._isMuted;
    }
    set isMuted(value) {
      this._isMuted = value;
      persistMuteState(this._isMuted);
      if (this.activeVideo) {
        this.activeVideo.muted = this._isMuted;
      }
    }
    getActiveVideo() {
      return this.activeVideo;
    }
    requestPlayback(target) {
      if (!target)
        return;
      this.trackedVideos.add(target);
      if (this.activeVideo && this.activeVideo !== target) {
        try {
          this.activeVideo.pause();
          this.activeVideo.muted = true;
          this.activeVideo.currentTime = 0;
        } catch {}
      }
      for (const v of this.trackedVideos) {
        if (v !== target) {
          try {
            if (!v.paused) {
              v.pause();
            }
            v.muted = true;
            v.currentTime = 0;
          } catch {}
        }
      }
      try {
        if (typeof document !== "undefined") {
          const domVideos = document.querySelectorAll("video");
          domVideos.forEach((v) => {
            if (v !== target && !v.paused) {
              try {
                v.pause();
                v.muted = true;
                v.currentTime = 0;
              } catch {}
            }
          });
        }
      } catch {}
      this.activeVideo = target;
      target.muted = this._isMuted;
      target.playsInline = true;
      const playPromise = target.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err) => {
          if (!target.muted && (err.name === "NotAllowedError" || err.name === "AbortError")) {
            target.muted = true;
            target.play().catch(() => {});
          }
        });
      }
    }
    toggleMute() {
      this._isMuted = !this._isMuted;
      persistMuteState(this._isMuted);
      if (this.activeVideo) {
        this.activeVideo.muted = this._isMuted;
        if (!this._isMuted && this.activeVideo.paused) {
          this.activeVideo.play().catch(() => {});
        }
      }
      return this._isMuted;
    }
    stopAll() {
      if (this.activeVideo) {
        try {
          this.activeVideo.pause();
          this.activeVideo.muted = true;
          this.activeVideo.currentTime = 0;
        } catch {}
        this.activeVideo = null;
      }
      for (const v of this.trackedVideos) {
        try {
          if (!v.paused) {
            v.pause();
          }
          v.muted = true;
          v.currentTime = 0;
        } catch {}
      }
      try {
        if (typeof document !== "undefined") {
          const domVideos = document.querySelectorAll("video");
          domVideos.forEach((v) => {
            try {
              if (!v.paused) {
                v.pause();
              }
              v.muted = true;
              v.currentTime = 0;
            } catch {}
          });
        }
      } catch {}
    }
  }
  var audioManager = new AudioManager;

  // src/media/redgifs-resolver.ts
  var REDGIFS_TOKEN_KEY = "reddit_reels_redgifs_token";
  var TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
  async function httpGetJson(url, headers = {}) {
    const g = typeof globalThis !== "undefined" ? globalThis : window;
    const gmXhr = g.GM_xmlhttpRequest || (typeof GM_xmlhttpRequest !== "undefined" ? GM_xmlhttpRequest : null);
    if (typeof gmXhr === "function") {
      return new Promise((resolve, reject) => {
        gmXhr({
          method: "GET",
          url,
          headers,
          timeout: 8000,
          onload: (response) => {
            if (response.status >= 200 && response.status < 300) {
              try {
                const data = JSON.parse(response.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error(`Failed to parse JSON response from ${url}: ${e}`));
              }
            } else {
              reject(new Error(`HTTP ${response.status} (${response.statusText}) from ${url}`));
            }
          },
          onerror: (err) => reject(new Error(`Network error calling ${url}: ${JSON.stringify(err)}`)),
          ontimeout: () => reject(new Error(`Request timed out calling ${url}`))
        });
      });
    }
    const res = await fetch(url, {
      method: "GET",
      headers
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} (${res.statusText}) from ${url}`);
    }
    return await res.json();
  }
  function extractRedGifsId(urlOrId) {
    if (!urlOrId)
      return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && !trimmed.includes("/") && !trimmed.includes(".")) {
      return trimmed;
    }
    const match = trimmed.match(/(?:redgifs\.com\/(?:watch|ifr)\/)([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    const mediaMatch = trimmed.match(/(?:thumbs[0-9]*\.redgifs\.com\/)([a-zA-Z0-9_-]+)(?:\.mp4|\.webm|\.jpg|\.png)?/i);
    if (mediaMatch && mediaMatch[1]) {
      return mediaMatch[1];
    }
    return null;
  }
  function isRedGifsUrl(url) {
    if (!url)
      return false;
    return /redgifs\.com\/(?:watch|ifr)\/[a-zA-Z0-9_-]+/i.test(url) || extractRedGifsId(url) !== null;
  }
  function extractRedGifsIdFromPost(post) {
    if (post.contentHref) {
      const id = extractRedGifsId(post.contentHref);
      if (id)
        return id;
    }
    if (post.mediaUrl) {
      const id = extractRedGifsId(post.mediaUrl);
      if (id)
        return id;
    }
    if (post.element && typeof post.element.querySelectorAll === "function") {
      const iframes = post.element.querySelectorAll('iframe[src*="redgifs.com"]');
      for (let i = 0;i < iframes.length; i++) {
        const id = extractRedGifsId(iframes[i].src);
        if (id)
          return id;
      }
      const links = post.element.querySelectorAll('a[href*="redgifs.com"]');
      for (let i = 0;i < links.length; i++) {
        const id = extractRedGifsId(links[i].href);
        if (id)
          return id;
      }
    }
    return null;
  }
  async function getRedGifsToken() {
    const now = Date.now();
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(REDGIFS_TOKEN_KEY) : null;
      if (raw) {
        const cache = JSON.parse(raw);
        if (cache && cache.token && cache.expiresAt > now) {
          return cache.token;
        }
      }
    } catch {}
    const authUrl = "https://api.redgifs.com/v2/auth/temporary";
    const data = await httpGetJson(authUrl);
    if (!data || !data.token) {
      throw new Error("No token returned from RedGifs temporary auth API");
    }
    try {
      if (typeof localStorage !== "undefined") {
        const cache = {
          token: data.token,
          expiresAt: now + TOKEN_EXPIRY_MS - 3600000
        };
        localStorage.setItem(REDGIFS_TOKEN_KEY, JSON.stringify(cache));
      }
    } catch {}
    return data.token;
  }
  function clearCachedToken() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(REDGIFS_TOKEN_KEY);
      }
    } catch {}
  }
  async function resolveRedGifs(idOrUrl) {
    const id = extractRedGifsId(idOrUrl);
    if (!id) {
      return {
        type: "iframe",
        src: idOrUrl,
        hasAudio: true
      };
    }
    const fallbackIframe = {
      type: "iframe",
      src: `https://www.redgifs.com/ifr/${id}?autoplay=1&muted=0`,
      hasAudio: true
    };
    try {
      let token;
      try {
        token = await getRedGifsToken();
      } catch (authErr) {
        console.warn("[RedGifsResolver] Auth token fetch failed, using fallback iframe:", authErr);
        return fallbackIframe;
      }
      const apiUrl = `https://api.redgifs.com/v2/gifs/${encodeURIComponent(id.toLowerCase())}`;
      let res;
      try {
        res = await httpGetJson(apiUrl, {
          Authorization: `Bearer ${token}`
        });
      } catch (apiErr) {
        if (apiErr?.message?.includes("401")) {
          clearCachedToken();
          try {
            const freshToken = await getRedGifsToken();
            res = await httpGetJson(apiUrl, {
              Authorization: `Bearer ${freshToken}`
            });
          } catch {
            return fallbackIframe;
          }
        } else {
          console.warn("[RedGifsResolver] Metadata API failed, using fallback iframe:", apiErr);
          return fallbackIframe;
        }
      }
      const gif = res.gif || res;
      const urls = gif?.urls;
      if (urls) {
        const hdUrl = urls.hd;
        const sdUrl = urls.sd;
        const posterUrl = urls.poster || urls.thumbnail;
        const directUrl = hdUrl || sdUrl;
        if (directUrl) {
          return {
            type: "video",
            src: directUrl,
            poster: posterUrl,
            hasAudio: true,
            quality: hdUrl ? "hd" : "sd"
          };
        }
      }
      return fallbackIframe;
    } catch (err) {
      console.warn("[RedGifsResolver] Unexpected resolution error, falling back to iframe:", err);
      return fallbackIframe;
    }
  }

  // src/media/reddit-resolver.ts
  function isRedditVideo(post) {
    if (post.postType === "video")
      return true;
    if (post.contentHref && /v\.redd\.it/i.test(post.contentHref))
      return true;
    if (post.mediaUrl && /v\.redd\.it/i.test(post.mediaUrl))
      return true;
    if (post.element && typeof post.element.querySelector === "function") {
      if (post.element.querySelector('shreddit-player-2, video, [slot="post-media-container"] video')) {
        return true;
      }
    }
    return false;
  }
  function resolveRedditVideo(post) {
    let videoSrc = null;
    let posterUrl = undefined;
    let hasAudio = true;
    const el = post.element;
    if (el && typeof el.querySelector === "function") {
      const player = el.querySelector("shreddit-player-2");
      if (player) {
        const hasAudioAttr = player.getAttribute("has-audio");
        if (hasAudioAttr === "false") {
          hasAudio = false;
        }
        posterUrl = player.getAttribute("poster") || player.getAttribute("poster-url") || player.getAttribute("preview") || undefined;
        const packagedJson = player.getAttribute("packaged-media-json");
        if (packagedJson) {
          try {
            const parsed = JSON.parse(packagedJson);
            if (parsed.playbackMp4Url) {
              videoSrc = parsed.playbackMp4Url;
            } else if (parsed.hlsUrl) {
              videoSrc = parsed.hlsUrl;
            }
          } catch {}
        }
        if (!videoSrc) {
          const sources = player.querySelectorAll("source");
          for (let i = 0;i < sources.length; i++) {
            const src = sources[i].getAttribute("src") || sources[i].src;
            const type = sources[i].getAttribute("type") || "";
            if (src && (type.includes("mp4") || src.includes(".mp4"))) {
              videoSrc = src;
              break;
            } else if (src && !videoSrc) {
              videoSrc = src;
            }
          }
        }
        if (!videoSrc) {
          const streamUrl = player.getAttribute("stream-url");
          if (streamUrl) {
            videoSrc = streamUrl;
          }
        }
        if (!videoSrc) {
          const src = player.getAttribute("src");
          if (src) {
            videoSrc = src;
          }
        }
        if (!videoSrc) {
          const video = player.querySelector("video");
          if (video) {
            videoSrc = video.currentSrc || video.src || video.getAttribute("src");
            if (!posterUrl && video.poster) {
              posterUrl = video.poster;
            }
          }
        }
      }
      if (!videoSrc) {
        const video = el.querySelector("video");
        if (video) {
          videoSrc = video.currentSrc || video.src || video.getAttribute("src");
          if (!posterUrl && video.poster) {
            posterUrl = video.poster;
          }
        }
      }
      if (!posterUrl) {
        const img = el.querySelector('img[src*="preview.redd.it"], img[src*="i.redd.it"], img.preview-img');
        if (img) {
          posterUrl = img.src || img.getAttribute("src") || undefined;
        }
      }
    }
    if (!videoSrc) {
      if (post.mediaUrl && /v\.redd\.it/i.test(post.mediaUrl)) {
        videoSrc = post.mediaUrl;
      } else if (post.contentHref && /v\.redd\.it/i.test(post.contentHref)) {
        const match = post.contentHref.match(/v\.redd\.it\/([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          videoSrc = `https://v.redd.it/${match[1]}/HLSPlaylist.m3u8`;
        } else {
          videoSrc = post.contentHref;
        }
      }
    }
    if (videoSrc) {
      return {
        type: "video",
        src: videoSrc,
        poster: posterUrl,
        hasAudio,
        quality: "hd"
      };
    }
    return null;
  }
  function resolveRedditImage(post) {
    let imgSrc = null;
    const el = post.element;
    if (el && typeof el.querySelector === "function") {
      if (post.postType === "gallery") {
        const galleryImgs = el.querySelectorAll('gallery-carousel img, shreddit-aspect-ratio img, ul li img, img[src*="preview.redd.it"]');
        for (let i = 0;i < galleryImgs.length; i++) {
          const src = galleryImgs[i].src || galleryImgs[i].getAttribute("src");
          if (src) {
            imgSrc = src;
            break;
          }
        }
      }
      if (!imgSrc) {
        const img = el.querySelector('shreddit-media-lightbox-container img, [slot="post-media-container"] img, img[src*="i.redd.it"], img[src*="preview.redd.it"], img.preview-img');
        if (img) {
          imgSrc = img.src || img.getAttribute("src");
        }
      }
    }
    if (!imgSrc) {
      if (post.mediaUrl && /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(post.mediaUrl)) {
        imgSrc = post.mediaUrl;
      } else if (post.contentHref && (/\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(post.contentHref) || /i\.redd\.it/i.test(post.contentHref))) {
        imgSrc = post.contentHref;
      }
    }
    if (imgSrc) {
      return {
        type: "image",
        src: imgSrc,
        poster: imgSrc,
        hasAudio: false
      };
    }
    return null;
  }

  // src/media/index.ts
  async function resolveMedia(post) {
    const redGifsId = extractRedGifsIdFromPost(post);
    if (redGifsId) {
      try {
        const redGifsMedia = await resolveRedGifs(redGifsId);
        if (redGifsMedia) {
          return redGifsMedia;
        }
      } catch (err) {
        console.warn("[resolveMedia] Error resolving RedGifs post:", post.id, err);
        return {
          type: "iframe",
          src: `https://www.redgifs.com/ifr/${redGifsId}?autoplay=1&muted=0`,
          hasAudio: true
        };
      }
    }
    if (post.contentHref && isRedGifsUrl(post.contentHref) || post.mediaUrl && isRedGifsUrl(post.mediaUrl)) {
      const rawUrl = post.contentHref || post.mediaUrl || "";
      return resolveRedGifs(rawUrl);
    }
    const videoMedia = resolveRedditVideo(post);
    if (videoMedia) {
      return videoMedia;
    }
    const imageMedia = resolveRedditImage(post);
    if (imageMedia) {
      return imageMedia;
    }
    if (post.element && typeof post.element.querySelector === "function") {
      const iframe = post.element.querySelector("iframe");
      if (iframe && iframe.src) {
        return {
          type: "iframe",
          src: iframe.src,
          hasAudio: true
        };
      }
    }
    const targetUrl = post.mediaUrl || post.contentHref || "";
    if (/\.(mp4|webm|m3u8)($|\?)/i.test(targetUrl)) {
      return {
        type: "video",
        src: targetUrl,
        hasAudio: true,
        quality: "hd"
      };
    }
    if (/\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(targetUrl)) {
      return {
        type: "image",
        src: targetUrl,
        poster: targetUrl,
        hasAudio: false
      };
    }
    if (/imgur\.com\/([a-zA-Z0-9]+)\.gifv/i.test(targetUrl)) {
      const mp4Url = targetUrl.replace(/\.gifv$/i, ".mp4");
      return {
        type: "video",
        src: mp4Url,
        hasAudio: false
      };
    }
    return {
      type: "image",
      src: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23111111"/%3E%3C/svg%3E',
      hasAudio: false
    };
  }

  // src/index.ts
  if (typeof window !== "undefined") {
    window.extractPosts = extractPosts;
    window.observeNewPosts = observeNewPosts;
    window.proxyUpvote = proxyUpvote;
    window.proxyDownvote = proxyDownvote;
    window.AudioManager = AudioManager;
    window.audioManager = audioManager;
    window.resolveMedia = resolveMedia;
  }
})();
