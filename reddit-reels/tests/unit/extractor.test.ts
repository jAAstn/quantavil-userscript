import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GlobalWindow } from 'happy-dom';
import {
  extractPosts,
  observeNewPosts,
  parsePostElement,
} from '../../src/extractor';
import { proxyUpvote, proxyDownvote } from '../../src/extractor';
import { ReelPost } from '../../src/extractor/types';

describe('DOM Extractor & Vote Proxy', () => {
  let window: GlobalWindow;
  let document: Document;

  beforeEach(() => {
    window = new GlobalWindow();
    document = window.document;
    (globalThis as any).window = window;
    (globalThis as any).document = document;
    (globalThis as any).Node = window.Node;
    (globalThis as any).HTMLElement = window.HTMLElement;
    (globalThis as any).MutationObserver = window.MutationObserver;
    (globalThis as any).MouseEvent = window.MouseEvent;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).Node;
    delete (globalThis as any).HTMLElement;
    delete (globalThis as any).MutationObserver;
    delete (globalThis as any).MouseEvent;
  });

  describe('extractPosts with <shreddit-post>', () => {
    it('extracts complete metadata from <shreddit-post> attributes', () => {
      document.body.innerHTML = `
        <shreddit-post
          id="t3_17abcde"
          post-title="Hilarious kitten reaction"
          author="cat_lover"
          subreddit-prefixed-name="r/aww"
          score="1250"
          comment-count="42"
          permalink="/r/aww/comments/17abcde/hilarious_kitten_reaction/"
          content-href="https://v.redd.it/xyz123/DASH_720.mp4"
          post-type="video"
          vote-state="upvoted"
        >
          <div slot="title">Hilarious kitten reaction</div>
          <button aria-label="Upvote" aria-pressed="true" name="upvote"></button>
          <button aria-label="Downvote" name="downvote"></button>
        </shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(1);

      const post = posts[0];
      expect(post.id).toBe('t3_17abcde');
      expect(post.title).toBe('Hilarious kitten reaction');
      expect(post.author).toBe('cat_lover');
      expect(post.subreddit).toBe('r/aww');
      expect(post.score).toBe(1250);
      expect(post.commentCount).toBe(42);
      expect(post.permalink).toBe('/r/aww/comments/17abcde/hilarious_kitten_reaction/');
      expect(post.contentHref).toBe('https://v.redd.it/xyz123/DASH_720.mp4');
      expect(post.postType).toBe('video');
      expect(post.isUpvoted).toBe(true);
      expect(post.isDownvoted).toBe(false);
      expect(post.element).toBeDefined();
    });

    it('parses formatted score suffixes like "14.2k" and "2.1M"', () => {
      document.body.innerHTML = `
        <shreddit-post
          id="post_k"
          post-title="High score"
          author="u/test"
          subreddit-name="gaming"
          score="14.2k"
          comment-count="1.5k"
          permalink="/r/gaming/comments/post_k/high_score/"
          content-href="https://i.redd.it/pic.jpg"
          post-type="image"
        ></shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(1);
      expect(posts[0].score).toBe(14200);
      expect(posts[0].commentCount).toBe(1500);
      expect(posts[0].subreddit).toBe('r/gaming');
      expect(posts[0].author).toBe('test');
      expect(posts[0].postType).toBe('image');
    });

    it('handles missing attributes gracefully via slot and inner element fallbacks', () => {
      document.body.innerHTML = `
        <shreddit-post permalink="/r/videos/comments/xyz987/cool_video/">
          <h2 slot="title">Fallback Title</h2>
          <a data-click-id="user" href="/user/cool_creator">u/cool_creator</a>
          <span slot="credit-bar">3.4k</span>
          <a data-click-id="comments" href="/r/videos/comments/xyz987/cool_video/">99 comments</a>
          <video src="https://v.redd.it/test.mp4"></video>
        </shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(1);
      const post = posts[0];

      expect(post.id).toBe('t3_xyz987');
      expect(post.title).toBe('Fallback Title');
      expect(post.author).toBe('cool_creator');
      expect(post.subreddit).toBe('r/videos');
      expect(post.score).toBe(3400);
      expect(post.commentCount).toBe(99);
      expect(post.postType).toBe('video');
      expect(post.contentHref).toBe('https://v.redd.it/test.mp4');
    });

    it('detects gallery and link post types correctly', () => {
      document.body.innerHTML = `
        <shreddit-post
          id="gallery_1"
          post-title="Photo Album"
          permalink="/r/pics/comments/gallery_1/"
          content-href="https://reddit.com/gallery/gallery_1"
          post-type="gallery"
        ></shreddit-post>
        <shreddit-post
          id="link_1"
          post-title="External News"
          permalink="/r/news/comments/link_1/"
          content-href="https://www.theverge.com/article"
          post-type="link"
        ></shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(2);
      expect(posts[0].postType).toBe('gallery');
      expect(posts[1].postType).toBe('link');
    });

    it('detects RedGifs and Streamable posts as video even if marked as post-type="link"', () => {
      document.body.innerHTML = `
        <shreddit-post
          id="rg_1"
          post-title="Redgifs video"
          domain="redgifs.com"
          permalink="/r/gifs/comments/rg_1/"
          content-href="https://www.redgifs.com/watch/popularclip123"
          post-type="link"
        ></shreddit-post>
        <shreddit-post
          id="st_1"
          post-title="Streamable video"
          domain="streamable.com"
          permalink="/r/videos/comments/st_1/"
          content-href="https://streamable.com/xyz123"
          post-type="link"
        ></shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(2);
      expect(posts[0].postType).toBe('video');
      expect(posts[1].postType).toBe('video');
    });

    it('detects text-only posts and extracts body text cleanly', () => {
      document.body.innerHTML = `
        <shreddit-post
          id="t3_text1"
          post-title="Any app to run niri commands?"
          author="kurlicue"
          subreddit-prefixed-name="r/niri"
          score="1"
          comment-count="4"
          permalink="/r/niri/comments/text1/any_app_to_run_niri_commands/"
          content-href="https://www.reddit.com/r/niri/comments/text1/any_app_to_run_niri_commands/"
          post-type="text"
        >
          <shreddit-post-text-body slot="text-body">
            <div property="schema:articleBody">
              <p>I want to be able to open a search box, type a niri bind, and press enter to run it.</p>
            </div>
          </shreddit-post-text-body>
        </shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(1);
      const post = posts[0];
      expect(post.postType).toBe('text');
      expect(post.title).toBe('Any app to run niri commands?');
      expect(post.score).toBe(1);
      expect(post.commentCount).toBe(4);
      expect(post.textBody).toContain('I want to be able to open a search box');
    });

    it('detects rich text posts with post-type="multi_media" and domain="self.OpenAI" as text even with subreddit icons', () => {
      document.body.innerHTML = `
        <shreddit-post
          id="t3_1wk0zyk"
          post-title="I built a 24/7 AI television network. It's been running for 15 months"
          author="ScriptLurker"
          subreddit-prefixed-name="r/OpenAI"
          score="441"
          comment-count="129"
          permalink="/r/OpenAI/comments/1wk0zyk/i_built_a_247_ai_television_network_its_been/"
          content-href="https://www.reddit.com/r/OpenAI/comments/1wk0zyk/i_built_a_247_ai_television_network_its_been/"
          post-type="multi_media"
          domain="self.OpenAI"
        >
          <!-- Subreddit Icon in Header: must not trick extractor into thinking this is an image post! -->
          <div slot="credit-bar">
            <img class="shreddit-subreddit-icon__icon" src="https://styles.redditmedia.com/sub-icon.png" />
          </div>
          <!-- Real 18-paragraph text body -->
          <shreddit-post-text-body slot="text-body">
            <div class="text-neutral-content">
              <p>For the past 15 months, I have been building something called Botflix: a 24/7 AI-native television network.</p>
              <p>It generates scripts, voices, and shows autonomously.</p>
            </div>
          </shreddit-post-text-body>
        </shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(1);
      const post = posts[0];
      expect(post.postType).toBe('text');
      expect(post.title).toContain('AI television network');
      expect(post.author).toBe('ScriptLurker');
      expect(post.textBody).toContain('Botflix: a 24/7 AI-native television network');
      expect(post.mediaUrl).toBeUndefined();
    });

    it('detects crosspost with post-type="crosspost" and extracts primary image, ignoring subreddit icons', () => {
      document.body.innerHTML = `
        <shreddit-post
          id="t3_1wknx0y"
          post-title="New paper shows that AI has a concept of pain and actively tries not to get hurt"
          author="JobKnown5009"
          subreddit-prefixed-name="r/accelerate"
          score="37"
          comment-count="27"
          permalink="/r/accelerate/comments/1wknx0y/new_paper_shows_that_ai_has_a_concept_of_pain_and/"
          content-href="/r/singularity/comments/1wkignw/new_paper_shows_that_ai_has_a_concept_of_pain_and/"
          post-type="crosspost"
          domain="i.redd.it"
        >
          <div slot="credit-bar">
            <img class="shreddit-subreddit-icon__icon" src="https://styles.redditmedia.com/sub-icon.png" />
          </div>
          <div slot="post-media-container">
            <div class="crosspost-credit-bar">r/singularity • 7hr. ago</div>
            <div class="crosspost-title">New paper shows that AI has a concept of pain</div>
            <div data-aspect-ratio-container>
              <div class="media-lightbox-img">
                <img class="post-background-image-filter" src="https://preview.redd.it/filter.png" />
                <img id="post-image" data-post-media-primary class="preview-img" src="https://preview.redd.it/pain-paper.png" />
              </div>
            </div>
            <div class="text-secondary-plain-weak">558 upvotes</div>
          </div>
        </shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(1);
      const post = posts[0];
      expect(post.postType).toBe('image');
      expect(post.mediaUrl).toBe('https://preview.redd.it/pain-paper.png');
      expect(post.author).toBe('JobKnown5009');
    });

    it('extracts score and comment count from shadowRoot when host attributes are absent', () => {
      const postEl = document.createElement('shreddit-post');
      postEl.setAttribute('id', 't3_shadow_nums');
      postEl.setAttribute('permalink', '/r/test/comments/shadow_nums/');

      const shadow = postEl.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <rpl-action-bar>
          <div data-testid="action-row">
            <button data-action-bar-action="upvote"></button>
            <faceplate-number number="42">42</faceplate-number>
            <button data-action-bar-action="downvote"></button>
            <a data-action-bar-action="comments">
              <faceplate-number number="12">12</faceplate-number>
            </a>
          </div>
        </rpl-action-bar>
      `;

      document.body.innerHTML = '';
      document.body.appendChild(postEl);

      const posts = extractPosts(document);
      expect(posts.length).toBe(1);
      expect(posts[0].score).toBe(42);
      expect(posts[0].commentCount).toBe(12);
    });

    it('falls back to standard reddit container selectors like [data-testid="post-container"] and .Post', () => {
      document.body.innerHTML = `
        <div data-testid="post-container" id="t3_desktop1" data-author="desktop_user">
          <h1 data-test-id="post-content">Desktop Reddit Post</h1>
          <a data-click-id="subreddit" href="/r/technology/">r/technology</a>
          <div data-test-id="post-score">500</div>
          <a data-click-id="comments" href="/r/technology/comments/desktop1/desktop_reddit_post/">15 comments</a>
          <a data-click-id="body" href="https://example.com/tech-news"></a>
        </div>
        <article class="Post" id="t3_desktop2">
          <h2>Second Desktop Post</h2>
          <a data-testid="post_author_link" href="/user/author2">u/author2</a>
          <a href="/r/science/">r/science</a>
          <div class="score">42</div>
          <a href="/r/science/comments/desktop2/">8 comments</a>
        </article>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(2);
      expect(posts[0].id).toBe('t3_desktop1');
      expect(posts[0].title).toBe('Desktop Reddit Post');
      expect(posts[0].subreddit).toBe('r/technology');
      expect(posts[0].score).toBe(500);

      expect(posts[1].id).toBe('t3_desktop2');
      expect(posts[1].title).toBe('Second Desktop Post');
      expect(posts[1].author).toBe('author2');
      expect(posts[1].subreddit).toBe('r/science');
    });

    it('can parse a single HTMLElement directly with parsePostElement', () => {
      const el = document.createElement('shreddit-post');
      el.setAttribute('id', 'single_1');
      el.setAttribute('post-title', 'Single Element');
      el.setAttribute('author', 'solo');
      el.setAttribute('subreddit-prefixed-name', 'r/solo');
      el.setAttribute('score', '99');
      el.setAttribute('comment-count', '3');
      el.setAttribute('permalink', '/r/solo/comments/single_1/');
      el.setAttribute('content-href', 'https://v.redd.it/solo.mp4');
      el.setAttribute('post-type', 'video');

      const post = parsePostElement(el);
      expect(post.id).toBe('single_1');
      expect(post.title).toBe('Single Element');
      expect(post.postType).toBe('video');
    });

    it('extracts from an HTMLElement root that is itself a shreddit-post', () => {
      const el = document.createElement('shreddit-post');
      el.setAttribute('id', 'root_post');
      el.setAttribute('post-title', 'Root Post');
      el.setAttribute('subreddit-prefixed-name', 'r/root');

      const posts = extractPosts(el);
      expect(posts.length).toBe(1);
      expect(posts[0].id).toBe('root_post');
      expect(posts[0].title).toBe('Root Post');
    });

    it('extracts vote state from active classes when aria-pressed is absent', () => {
      document.body.innerHTML = `
        <shreddit-post id="active_class_post">
          <button aria-label="Upvote" class="vote-button active upvoted"></button>
          <button aria-label="Downvote" class="vote-button"></button>
        </shreddit-post>
        <shreddit-post id="downvoted_class_post">
          <button aria-label="Upvote" class="vote-button"></button>
          <button aria-label="Downvote" class="vote-button text-interactive-pressed"></button>
        </shreddit-post>
      `;

      const posts = extractPosts(document);
      expect(posts.length).toBe(2);
      expect(posts[0].isUpvoted).toBe(true);
      expect(posts[0].isDownvoted).toBe(false);
      expect(posts[1].isUpvoted).toBe(false);
      expect(posts[1].isDownvoted).toBe(true);
    });
  });

  describe('vote-proxy', () => {
    it('proxies upvote and updates post.isUpvoted state', () => {
      document.body.innerHTML = `
        <shreddit-post id="post_vote_update">
          <button aria-label="Upvote" name="upvote"></button>
          <button aria-label="Downvote" name="downvote"></button>
        </shreddit-post>
      `;

      const post = extractPosts(document)[0];
      const upBtn = post.element.querySelector('button[name="upvote"]') as HTMLButtonElement;
      upBtn.addEventListener('click', () => {
        upBtn.setAttribute('aria-pressed', 'true');
      });

      expect(post.isUpvoted).toBe(false);
      const res = proxyUpvote(post);
      expect(res).toBe(true);
      expect(post.isUpvoted).toBe(true);
    });

    it('proxies downvote and updates post.isDownvoted state', () => {
      document.body.innerHTML = `
        <shreddit-post id="post_downvote_update">
          <button aria-label="Upvote" name="upvote"></button>
          <button aria-label="Downvote" name="downvote"></button>
        </shreddit-post>
      `;

      const post = extractPosts(document)[0];
      const downBtn = post.element.querySelector('button[name="downvote"]') as HTMLButtonElement;
      downBtn.addEventListener('click', () => {
        downBtn.setAttribute('aria-pressed', 'true');
      });

      expect(post.isDownvoted).toBe(false);
      const res = proxyDownvote(post);
      expect(res).toBe(true);
      expect(post.isDownvoted).toBe(true);
    });
    it('proxies upvote by clicking the native upvote button', () => {
      document.body.innerHTML = `
        <shreddit-post id="post_vote_1">
          <div slot="title">Vote Test</div>
          <button aria-label="Upvote" name="upvote"></button>
          <button aria-label="Downvote" name="downvote"></button>
        </shreddit-post>
      `;

      const post = extractPosts(document)[0];
      const upvoteBtn = post.element.querySelector('button[name="upvote"]') as HTMLButtonElement;

      let clicked = false;
      upvoteBtn.addEventListener('click', () => {
        clicked = true;
      });

      const success = proxyUpvote(post);
      expect(success).toBe(true);
      expect(clicked).toBe(true);
    });

    it('proxies downvote by clicking the native downvote button', () => {
      document.body.innerHTML = `
        <shreddit-post id="post_vote_2">
          <div slot="title">Downvote Test</div>
          <button aria-label="Upvote" name="upvote"></button>
          <button aria-label="Downvote" name="downvote"></button>
        </shreddit-post>
      `;

      const post = extractPosts(document)[0];
      const downvoteBtn = post.element.querySelector('button[name="downvote"]') as HTMLButtonElement;

      let clicked = false;
      downvoteBtn.addEventListener('click', () => {
        clicked = true;
      });

      const success = proxyDownvote(post);
      expect(success).toBe(true);
      expect(clicked).toBe(true);
    });

    it('handles slot-wrapped upvote button [slot="upvote-button"]', () => {
      document.body.innerHTML = `
        <shreddit-post id="post_slot_vote">
          <div slot="upvote-button">
            <button aria-label="Upvote"></button>
          </div>
        </shreddit-post>
      `;

      const post = extractPosts(document)[0];
      const btn = post.element.querySelector('button') as HTMLButtonElement;
      let clicked = false;
      btn.addEventListener('click', () => {
        clicked = true;
      });

      const success = proxyUpvote(post);
      expect(success).toBe(true);
      expect(clicked).toBe(true);
    });

    it('handles modern shadowRoot data-action-bar-action voting buttons', () => {
      const postEl = document.createElement('shreddit-post');
      postEl.setAttribute('id', 'post_modern_shadow_vote');

      const shadow = postEl.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <rpl-action-bar>
          <div data-testid="action-row">
            <button data-action-bar-action="upvote"></button>
            <button data-action-bar-action="downvote"></button>
          </div>
        </rpl-action-bar>
      `;

      document.body.innerHTML = '';
      document.body.appendChild(postEl);

      const post = extractPosts(document)[0];
      const upBtn = shadow.querySelector('button[data-action-bar-action="upvote"]') as HTMLButtonElement;
      let upClicked = false;
      upBtn.addEventListener('click', () => {
        upClicked = true;
      });

      const success = proxyUpvote(post);
      expect(success).toBe(true);
      expect(upClicked).toBe(true);
    });

    it('returns false when voting button cannot be found or post is invalid', () => {
      const dummyPost: ReelPost = {
        id: 'none',
        title: 'no button',
        author: 'nobody',
        subreddit: 'r/none',
        score: 0,
        commentCount: 0,
        permalink: '',
        contentHref: '',
        postType: 'link',
        element: document.createElement('div'),
      };

      expect(proxyUpvote(dummyPost)).toBe(false);
      expect(proxyDownvote(dummyPost)).toBe(false);
      expect(proxyUpvote(null as any)).toBe(false);
      expect(proxyDownvote(null as any)).toBe(false);
    });
  });

  describe('observeNewPosts', () => {
    it('observes DOM mutations, ignores existing posts, and calls onNewPosts with only new posts', async () => {
      document.body.innerHTML = `
        <shreddit-feed>
          <shreddit-post id="post_initial" post-title="Initial"></shreddit-post>
        </shreddit-feed>
      `;

      const observedPosts: ReelPost[][] = [];
      const unsubscribe = observeNewPosts((posts) => {
        observedPosts.push(posts);
      });

      // Appending a new post
      const feed = document.querySelector('shreddit-feed')!;
      const newPostEl = document.createElement('shreddit-post');
      newPostEl.setAttribute('id', 'post_new_1');
      newPostEl.setAttribute('post-title', 'Newly Added Reel');
      newPostEl.setAttribute('post-type', 'video');
      newPostEl.setAttribute('content-href', 'https://v.redd.it/sample.mp4');
      feed.appendChild(newPostEl);

      // Wait for debounce (150ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(observedPosts.length).toBe(1);
      expect(observedPosts[0].length).toBe(1);
      expect(observedPosts[0][0].id).toBe('post_new_1');
      expect(observedPosts[0][0].title).toBe('Newly Added Reel');

      // Add the same post again or non-post node; should not emit duplicates
      const nonPostEl = document.createElement('div');
      nonPostEl.textContent = 'Random banner';
      feed.appendChild(nonPostEl);

      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(observedPosts.length).toBe(1); // No new post emitted

      unsubscribe();

      // Appending after unsubscribe should not trigger onNewPosts
      const anotherPost = document.createElement('shreddit-post');
      anotherPost.setAttribute('id', 'post_new_2');
      feed.appendChild(anotherPost);

      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(observedPosts.length).toBe(1);
    });
  });
});
