import { test, expect } from '@playwright/test';

test.describe('Floating Action Button (FAB) & In-Place Reel Mode Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mock-reddit.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('FAB button is rendered with pure SVG icon and no text', async ({ page }) => {
    const fab = page.locator('button.rr-fab');
    await expect(fab).toBeVisible();
    await expect(fab).toHaveAttribute('aria-label', 'Open Reddit Reel Mode');
    const icon = fab.locator('svg.rr-fab-icon');
    await expect(icon).toBeVisible();
    // Ensure no text content
    await expect(fab).toHaveText('');
  });

  test('clicking FAB activates in-place Reel Mode and exit button deactivates it', async ({ page }) => {
    const fab = page.locator('button.rr-fab');
    await expect(fab).toBeVisible();
    await fab.click();

    // Verify in-place reel mode class is applied to html
    const html = page.locator('html');
    await expect(html).toHaveClass(/rr-active/);

    // Verify top bar with Exit and Sound buttons appears
    const topBar = page.locator('.rr-top-bar');
    await expect(topBar).toBeVisible();

    // Verify posts are present in DOM
    const posts = page.locator('shreddit-post');
    await expect(posts).toHaveCount(9);

    // Click exit button in top bar
    const exitBtn = page.locator('.rr-top-bar button[aria-label="Exit Reel Mode"]');
    await expect(exitBtn).toBeVisible();
    await exitBtn.click();

    // Verify reel mode class is removed and FAB reappears
    await expect(html).not.toHaveClass(/rr-active/);
    await expect(topBar).not.toBeVisible();
    await expect(fab).toBeVisible();
  });
});
