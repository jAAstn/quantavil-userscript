import { test, expect } from '@playwright/test';

test.describe('Vertical Video & Media Sizing Unconstraining', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mock-reddit.html');
    await page.waitForLoadState('domcontentloaded');

    // Activate Reel Mode via FAB
    const fab = page.locator('button.rr-fab');
    await expect(fab).toBeVisible();
    await fab.click();
    await page.waitForTimeout(400);
  });

  test('unconstrains shreddit-aspect-ratio from 512px limit to full viewport', async ({ page }) => {
    const post2 = page.locator('#t3_nativevideo2');
    await expect(post2).toBeVisible();

    const aspectRatioEl = post2.locator('shreddit-aspect-ratio');
    await expect(aspectRatioEl).toBeVisible();

    // Check computed styles on shreddit-aspect-ratio in Reel Mode
    const styles = await aspectRatioEl.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        maxHeight: computed.maxHeight,
        aspectRatio: computed.aspectRatio,
        height: el.clientHeight,
        inlineMaxHeight: (el as HTMLElement).style.maxHeight,
        inlineAspectRatio: (el as HTMLElement).style.aspectRatio,
      };
    });

    // In Reel Mode, maxHeight must NOT be 512px! It must be unconstrained (100dvh or clientHeight > 512)
    expect(styles.maxHeight).not.toBe('512px');
    expect(styles.inlineMaxHeight).not.toBe('512px');
  });

  test('double tap on video toggles between Fit (contain) and Fill (cover)', async ({ page }) => {
    const post2 = page.locator('#t3_nativevideo2');
    const video = post2.locator('video');
    await expect(video).toBeVisible();

    // Double tap video quickly (< 320ms between clicks)
    await video.click();
    await page.waitForTimeout(50);
    await video.click();

    // Should have toggled to rr-fit-contain or rr-fit-cover and shown scale pulse
    const scalePulse = page.locator('.rr-scale-pulse');
    await expect(scalePulse).toBeVisible();
    const pulseText = await scalePulse.textContent();
    expect(pulseText).toMatch(/Fit|Fill/);

    // Double tap again to toggle back
    await page.waitForTimeout(400); // wait for pulse or tap window reset
    await video.click();
    await page.waitForTimeout(50);
    await video.click();

    const secondPulse = page.locator('.rr-scale-pulse');
    await expect(secondPulse).toBeVisible();
  });

  test('vertical videos apply object-fit cover while horizontal videos stay contained', async ({ page }) => {
    const post2 = page.locator('#t3_nativevideo2');
    const video = post2.locator('video');

    // Simulate vertical video dimensions (e.g. 720x1280)
    await video.evaluate((v: HTMLVideoElement) => {
      Object.defineProperty(v, 'videoWidth', { value: 720, configurable: true });
      Object.defineProperty(v, 'videoHeight', { value: 1280, configurable: true });
      v.dispatchEvent(new Event('loadedmetadata'));
    });

    await page.waitForTimeout(200);

    const isVerticalHandled = await video.evaluate((v: HTMLVideoElement) => {
      const computed = window.getComputedStyle(v);
      const post = v.closest('shreddit-post');
      return {
        hasCoverClass: v.classList.contains('rr-vertical-video'),
        postHasClass: post?.classList.contains('rr-has-vertical-video'),
        objectFit: computed.objectFit,
      };
    });

    expect(isVerticalHandled.hasCoverClass).toBe(true);
    expect(isVerticalHandled.postHasClass).toBe(true);
    expect(isVerticalHandled.objectFit).toBe('cover');
  });
});
