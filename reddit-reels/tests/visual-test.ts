import { chromium, devices } from 'playwright';
import { join } from 'path';
import { existsSync } from 'fs';

const FIXTURES_DIR = join(import.meta.dir, 'fixtures');
const ENTRY_FILE = join(import.meta.dir, '../src/index.ts');

async function ensureBundleAndServer() {
  // 1. Build latest bundle
  await Bun.build({
    entrypoints: [ENTRY_FILE],
    outdir: FIXTURES_DIR,
    target: 'browser',
    format: 'iife',
  });
  console.log('[Visual Test] Bundled latest userscript client into', FIXTURES_DIR);

  // 2. Start server
  const server = Bun.serve({
    port: 3000,
    fetch(req) {
      const url = new URL(req.url);
      let pathname = url.pathname;

      if (pathname === '/' || pathname === '/mock-reddit.html') {
        const file = Bun.file(join(FIXTURES_DIR, 'mock-reddit.html'));
        return new Response(file, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const filePath = join(FIXTURES_DIR, pathname.replace(/^\//, ''));
      if (existsSync(filePath)) {
        const file = Bun.file(filePath);
        return new Response(file);
      }

      return new Response('404 Not Found', { status: 404 });
    },
  });

  return server;
}

async function runVisualTest() {
  const server = await ensureBundleAndServer();
  const pixel7 = devices['Pixel 7'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...pixel7,
  });
  const page = await context.newPage();

  page.on('console', (msg) => console.log('[Browser Console]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('[Browser Error]', err));

  console.log('Navigating to http://127.0.0.1:3000/mock-reddit.html...');
  await page.goto('http://127.0.0.1:3000/mock-reddit.html');
  await page.waitForLoadState('domcontentloaded');

  const screenshotsDir = join(import.meta.dir, '../test-screenshots');
  await Bun.$`mkdir -p ${screenshotsDir}`;

  // 1. Initial page screenshot
  await page.screenshot({ path: join(screenshotsDir, '1-initial-feed.png') });
  console.log('Captured 1-initial-feed.png');

  // 2. Click FAB
  const fab = page.locator('button.rr-fab');
  await fab.click();
  await page.waitForTimeout(600);

  // 3. Post 1 in Reel Mode screenshot
  await page.screenshot({ path: join(screenshotsDir, '2-reel-post-1.png') });
  console.log('Captured 2-reel-post-1.png');

  // Check if video 1 is playing unmuted
  const video1Status = await page.evaluate(() => {
    const v1 = document.querySelector('#mock-video-1') as HTMLVideoElement;
    return {
      paused: v1 ? v1.paused : null,
      muted: v1 ? v1.muted : null,
      currentTime: v1 ? v1.currentTime : null,
    };
  });
  console.log('Video 1 status (unmuted playback):', video1Status);

  // 4. Tap video to toggle pause
  console.log('Tapping video 1 to pause...');
  await page.evaluate(() => {
    const v1 = document.querySelector('#mock-video-1') as HTMLVideoElement;
    v1?.click();
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(screenshotsDir, '2b-reel-post-1-pause-tap.png') });
  console.log('Captured 2b-reel-post-1-pause-tap.png');

  // 5. Scroll down to Post 2
  console.log('Scrolling down to Post 2...');
  await page.evaluate(() => {
    const post2 = document.querySelector('#t3_nativevideo2');
    post2?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);

  // 6. Post 2 screenshot
  await page.screenshot({ path: join(screenshotsDir, '3-reel-post-2-scrolled.png') });
  console.log('Captured 3-reel-post-2-scrolled.png');

  // 6b. Double-tap on video to toggle Fit (Original)
  console.log('Double-tapping video to toggle Fit mode...');
  const v2Locator = page.locator('#mock-video-2');
  await v2Locator.click();
  await page.waitForTimeout(60);
  await v2Locator.click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(screenshotsDir, '3b-reel-post-2-fit-toggle.png') });
  console.log('Captured 3b-reel-post-2-fit-toggle.png');

  // 6c. Double-tap again to toggle back to Fill (Full Bleed)
  await page.waitForTimeout(400);
  await v2Locator.click();
  await page.waitForTimeout(60);
  await v2Locator.click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(screenshotsDir, '3c-reel-post-2-fill-toggle.png') });
  console.log('Captured 3c-reel-post-2-fill-toggle.png');

  // Check video 1 and video 2 statuses (Audio Mutex check)
  const videoStatuses = await page.evaluate(() => {
    const v1 = document.querySelector('#mock-video-1') as HTMLVideoElement;
    const v2 = document.querySelector('#mock-video-2') as HTMLVideoElement;
    return {
      v1: v1 ? { paused: v1.paused, muted: v1.muted, currentTime: v1.currentTime } : null,
      v2: v2 ? { paused: v2.paused, muted: v2.muted, currentTime: v2.currentTime } : null,
    };
  });
  console.log('Audio Mutex check on Post 2:', videoStatuses);

  // 7. Click Upvote on Post 2's action rail
  console.log('Clicking upvote on Post 2 action rail...');
  await page.evaluate(() => {
    const post2 = document.querySelector('#t3_nativevideo2');
    const railUpBtn = post2?.querySelector<HTMLButtonElement>('.rr-upvote-btn');
    if (railUpBtn) {
      railUpBtn.click();
    }
  });
  await page.waitForTimeout(300);

  // 8. Post 2 liked screenshot
  await page.screenshot({ path: join(screenshotsDir, '4-reel-post-2-liked.png') });
  console.log('Captured 4-reel-post-2-liked.png');

  const upvoteCheck = await page.evaluate(() => {
    const post2 = document.querySelector('#t3_nativevideo2');
    const railUpBtn = post2?.querySelector('.rr-upvote-btn');
    const nativeBtn = post2?.querySelector('button[aria-label="Upvote"]');
    const scoreLabel = post2?.querySelector('.rr-score-label');
    return {
      railUpActive: railUpBtn?.classList.contains('is-active-up'),
      nativeAriaPressed: nativeBtn?.getAttribute('aria-pressed'),
      displayedScore: scoreLabel?.textContent,
    };
  });
  console.log('Upvote proxy and UI state check:', upvoteCheck);

  // 9. Click the global Sound Toggle in the top bar
  console.log('Clicking top-bar sound toggle...');
  await page.evaluate(() => {
    const soundBtn = document.querySelector('.rr-sound-btn-top') as HTMLButtonElement | null;
    soundBtn?.click();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(screenshotsDir, '5-reel-post-2-muted.png') });
  console.log('Captured 5-reel-post-2-muted.png');

  // 10. Scroll down to Post 4 (External Link Post)
  console.log('Scrolling down to Post 4 (Link Post)...');
  await page.evaluate(() => {
    const post4 = document.querySelector('#t3_linkpost4');
    post4?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(screenshotsDir, '6-reel-post-4-link.png') });
  console.log('Captured 6-reel-post-4-link.png');

  // 11. Scroll down to Post 5 (Text-only Discussion Post)
  console.log('Scrolling down to Post 5 (Text Post)...');
  await page.evaluate(() => {
    const post5 = document.querySelector('#t3_textpost5');
    post5?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(screenshotsDir, '8-reel-post-5-text.png') });
  console.log('Captured 8-reel-post-5-text.png');

  const textPostCheck = await page.evaluate(() => {
    const post5 = document.querySelector('#t3_textpost5');
    const textCard = post5?.querySelector('.rr-text-card');
    const title = textCard?.querySelector('.rr-text-card-title')?.textContent?.trim();
    const body = textCard?.querySelector('.rr-text-card-body')?.textContent?.trim();
    const score = post5?.querySelector('.rr-score-label')?.textContent?.trim();
    const actionRail = post5?.querySelector('.rr-action-rail');
    const labels = Array.from(post5?.querySelectorAll('.rr-action-label') || []).map(l => l.textContent?.trim());
    return {
      hasTextCard: !!textCard,
      title,
      hasBody: !!body && body.length > 0,
      score,
      labels,
      hasSoundBtn: !!post5?.querySelector('.rr-sound-btn'),
    };
  });
  console.log('Post 5 Text Post check:', textPostCheck);

  // 11b. Scroll down to Post 6 (Multiple-Image Gallery Post)
  console.log('Scrolling down to Post 6 (Gallery Post)...');
  await page.evaluate(() => {
    const post6 = document.querySelector('#t3_gallery6');
    post6?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(screenshotsDir, '9-reel-post-6-gallery.png') });
  console.log('Captured 9-reel-post-6-gallery.png');

  const galleryPostCheck = await page.evaluate(() => {
    const post6 = document.querySelector('#t3_gallery6');
    const gallery = post6?.querySelector('gallery-carousel');
    const carousel = post6?.querySelector('faceplate-carousel');
    const img = post6?.querySelector('img.media-lightbox-img') as HTMLImageElement | null;
    const imgRect = img ? img.getBoundingClientRect() : null;
    const subBadge = post6?.querySelector('.rr-sub-badge') as HTMLElement | null;
    const author = post6?.querySelector('.rr-author') as HTMLElement | null;
    const meta = post6?.querySelector('.rr-post-meta') as HTMLElement | null;
    const voteGroup = post6?.querySelector('.rr-vote-group') as HTMLElement | null;
    const score = voteGroup?.querySelector('.rr-score-label')?.textContent?.trim();
    const prevBtn = post6?.querySelector('[slot="previous-button"], .prev-btn') as HTMLElement | null;
    const nextBtn = post6?.querySelector('[slot="next-button"], .next-btn') as HTMLElement | null;

    const subRect = subBadge ? subBadge.getBoundingClientRect() : null;
    const authorRect = author ? author.getBoundingClientRect() : null;
    const authorPointerEvents = author ? window.getComputedStyle(author).pointerEvents : null;
    const isInline = !!(subRect && authorRect && Math.abs(subRect.top - authorRect.top) < 10);

    return {
      hasGallery: !!gallery,
      hasCarousel: !!carousel,
      imgVisible: !!img && !!imgRect && imgRect.width > 0 && imgRect.height > 0,
      imgRect,
      subName: subBadge?.textContent?.trim(),
      authorName: author?.textContent?.trim(),
      isInline,
      authorPointerEvents,
      score,
      prevBtnVisible: !!prevBtn,
      nextBtnVisible: !!nextBtn,
    };
  });
  console.log('Post 6 Gallery Post check:', galleryPostCheck);

  // 11b2. Click next button to slide to Image 2 in Gallery
  console.log('Clicking next slide button on Post 6 (Gallery Slide 2)...');
  await page.evaluate(() => {
    const post6 = document.querySelector('#t3_gallery6');
    const nextBtn = post6?.querySelector('[slot="next-button"], .next-btn') as HTMLButtonElement;
    nextBtn?.click();
    const ul = post6?.querySelector('ul');
    if (ul) ul.scrollLeft += window.innerWidth;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(screenshotsDir, '9b-reel-post-6-gallery-next-slide.png') });
  console.log('Captured 9b-reel-post-6-gallery-next-slide.png');

  const gallerySlide2Check = await page.evaluate(() => {
    const post6 = document.querySelector('#t3_gallery6');
    const slide2Img = post6?.querySelector('li[slot="page-1"] img, li:nth-child(2) img') as HTMLImageElement | null;
    const rect = slide2Img ? slide2Img.getBoundingClientRect() : null;
    return {
      slide2ImgExists: !!slide2Img,
      slide2ImgVisible: !!rect && rect.width > 0 && rect.height > 0,
      slide2Rect: rect,
    };
  });
  console.log('Post 6 Gallery Slide 2 check:', gallerySlide2Check);

  // 11c. Scroll down to Post 7 (Rich Text Discussion Post: r/OpenAI)
  console.log('Scrolling down to Post 7 (OpenAI Text Post)...');
  await page.evaluate(() => {
    const post7 = document.querySelector('#t3_1wk0zyk');
    post7?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(screenshotsDir, '10-reel-post-7-openai-text.png') });
  console.log('Captured 10-reel-post-7-openai-text.png');

  const post7Check = await page.evaluate(() => {
    const post7 = document.querySelector('#t3_1wk0zyk');
    const textCard = post7?.querySelector('.rr-text-card');
    const title = textCard?.querySelector('.rr-text-card-title')?.textContent?.trim();
    const openBtn = textCard?.querySelector('.rr-text-open-btn') as HTMLAnchorElement | null;
    const authorLink = post7?.querySelector('.rr-author') as HTMLAnchorElement | null;
    return {
      hasTextCard: !!textCard,
      title,
      bodyParagraphs: post7?.querySelectorAll('.rr-text-card-body p').length,
      openBtnHref: openBtn?.href,
      authorHref: authorLink?.href,
      authorPointerEvents: authorLink ? window.getComputedStyle(authorLink).pointerEvents : null,
      authorCursor: authorLink ? window.getComputedStyle(authorLink).cursor : null,
    };
  });
  console.log('Post 7 Text Post check:', post7Check);

  // 11d. Scroll down to Post 8 (Crosspost Post: r/accelerate)
  console.log('Scrolling down to Post 8 (Crosspost)...');
  await page.evaluate(() => {
    const post8 = document.querySelector('#t3_1wknx0y');
    post8?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(screenshotsDir, '11-reel-post-8-crosspost.png') });
  console.log('Captured 11-reel-post-8-crosspost.png');

  const post8Check = await page.evaluate(() => {
    const post8 = document.querySelector('#t3_1wknx0y');
    const img = post8?.querySelector('img#post-image') as HTMLImageElement | null;
    const imgRect = img ? img.getBoundingClientRect() : null;
    const creditBar = post8?.querySelector('.crosspost-credit-bar') as HTMLElement | null;
    const nestedStats = post8?.querySelector('.text-secondary-plain-weak') as HTMLElement | null;
    const authorLink = post8?.querySelector('.rr-author') as HTMLAnchorElement | null;
    return {
      imgVisible: !!img && !!imgRect && imgRect.width > 0 && imgRect.height > 0,
      imgRect,
      creditBarHidden: creditBar ? window.getComputedStyle(creditBar).display === 'none' : true,
      nestedStatsHidden: nestedStats ? window.getComputedStyle(nestedStats).display === 'none' : true,
      authorHref: authorLink?.href,
      authorText: authorLink?.textContent?.trim(),
    };
  });
  console.log('Post 8 Crosspost check:', post8Check);

  // 11e. Scroll down to Post 9 (RedGifs Video Post)
  console.log('Scrolling down to Post 9 (RedGifs Video Post)...');
  await page.evaluate(() => {
    const post9 = document.querySelector('#t3_redgifs9');
    post9?.scrollIntoView({ behavior: 'smooth' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(screenshotsDir, '12-reel-post-9-redgifs.png') });
  console.log('Captured 12-reel-post-9-redgifs.png');

  const post9Check = await page.evaluate(() => {
    const post9 = document.querySelector('#t3_redgifs9');
    const linkCard = post9?.querySelector('.rr-link-card-container');
    const iframe = post9?.querySelector('iframe.rr-embedded-iframe') as HTMLIFrameElement | null;
    const soundBtn = document.querySelector('.rr-sound-btn-top');
    const ccBtn = post9?.querySelector('.rr-cc-btn');
    return {
      hasLinkCard: !!linkCard,
      hasIframe: !!iframe,
      iframeSrc: iframe?.src,
      hasGlobalSoundBtn: !!soundBtn,
      hasCcBtn: !!ccBtn,
    };
  });
  console.log('Post 9 RedGifs check:', post9Check);

  // 11f. Test Subtitle Toggle via hotkey "c"
  console.log('Testing Subtitles toggle via hotkey "c"...');
  await page.keyboard.press('c');
  await page.waitForTimeout(200);
  const subtitlesState = await page.evaluate(() => {
    return {
      docHasHideCaptions: document.documentElement.classList.contains('rr-hide-captions'),
      storedPref: localStorage.getItem('@reddit-reels/subtitles'),
    };
  });
  console.log('Subtitles state after pressing "c":', subtitlesState);

  console.log('Clicking Videos Only filter button in top bar...');
  await page.evaluate(() => {
    const filterBtn = document.querySelector('.rr-filter-btn-top') as HTMLButtonElement;
    filterBtn?.click();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(screenshotsDir, '7-reel-videos-only-filter.png') });
  console.log('Captured 7-reel-videos-only-filter.png');

  await browser.close();
  server.stop();
  console.log('Visual test completed successfully!');
}

runVisualTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
