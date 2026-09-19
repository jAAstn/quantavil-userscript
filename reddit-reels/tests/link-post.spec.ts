import { test, expect } from '@playwright/test';

test.describe('Link Post & Clutter Eradication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mock-reddit.html');
    await page.waitForLoadState('domcontentloaded');

    // Activate Reel Mode via FAB
    const fab = page.locator('button.rr-fab');
    await expect(fab).toBeVisible();
    await fab.click();
    await page.waitForTimeout(300);
  });

  test('link post renders Vanguard link card without leaking native clutter', async ({ page }) => {
    const linkPost = page.locator('#t3_linkpost4');
    await expect(linkPost).toBeVisible();

    // 1. Verify Vanguard Link Card is rendered
    const linkCard = linkPost.locator('.rr-link-card');
    await expect(linkCard).toBeVisible();

    // 2. Verify domain badge and headline
    const domainBadge = linkPost.locator('.rr-link-domain-badge');
    await expect(domainBadge).toBeVisible();
    await expect(domainBadge).toContainText('thehindu.com');

    const cardTitle = linkPost.locator('.rr-link-card-title');
    await expect(cardTitle).toBeVisible();
    await expect(cardTitle).toContainText('ABVP rides Gen Z protest wave');

    const ctaBtn = linkPost.locator('.rr-link-card-cta');
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toContainText('Read Article');

    // 3. Verify ALL native clutter is hidden
    const nativeCreditBar = linkPost.locator('[slot="credit-bar"]');
    await expect(nativeCreditBar).toBeHidden();

    const nativeTitleMetadata = linkPost.locator('[slot="title-and-metadata"]');
    await expect(nativeTitleMetadata).toBeHidden();

    const nativeActionRow = linkPost.locator('[slot="action-row"]');
    await expect(nativeActionRow).toBeHidden();

    // 4. Verify sound button is NOT present on Post 4's action rail
    const post4Rail = linkPost.locator('.rr-action-rail');
    await expect(post4Rail).toBeVisible();
    const soundBtn = post4Rail.locator('.rr-sound-btn');
    await expect(soundBtn).toHaveCount(0);

    // 5. Verify action rail buttons still work on Post 4 (Upvote, Downvote, Comments)
    const upvoteBtn = post4Rail.locator('.rr-upvote-btn');
    await expect(upvoteBtn).toBeVisible();
    const scoreLabel = post4Rail.locator('.rr-score-label');
    await expect(scoreLabel).toContainText('83');

    const commentBtn = post4Rail.locator('.rr-comment-btn');
    await expect(commentBtn).toBeVisible();

    // 6. Verify video posts do NOT duplicate the sound button in the rail
    // (mute is a single global control in the top bar)
    const videoPost = page.locator('#t3_nativevideo2');
    await expect(videoPost.locator('.rr-action-rail .rr-sound-btn')).toHaveCount(0);
    await expect(page.locator('.rr-sound-btn-top')).toBeVisible();
  });

  test('top bar filter toggles between All Reels and Videos Only', async ({ page }) => {
    const filterBtn = page.locator('.rr-filter-btn-top');
    await expect(filterBtn).toBeVisible();

    // Initially All Reels mode (Post 4 link post is visible)
    const linkPost = page.locator('#t3_linkpost4');
    await expect(linkPost).toBeVisible();

    // Click filter button to switch to Videos Only
    await filterBtn.click();
    await expect(filterBtn).toContainText('Videos Only');
    await expect(linkPost).toBeHidden();

    // Image post (Post 3) should also be hidden
    const imagePost = page.locator('#t3_image3');
    await expect(imagePost).toBeHidden();

    // Video posts (Post 1 & 2) should remain visible
    const videoPost1 = page.locator('#t3_redgifs1');
    await expect(videoPost1).toBeVisible();

    // Click again to switch back to All Reels
    await filterBtn.click();
    await expect(filterBtn).toContainText('All Reels');
    await expect(linkPost).toBeVisible();
  });
});
