import { test, expect } from '@playwright/test';

test.describe('DOM Extractor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mock-reddit.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('extracts all <shreddit-post> elements and reads attributes correctly', async ({ page }) => {
    const posts = await page.evaluate(() => {
      // Calls extractPosts exposed on window
      const extracted = (window as any).extractPosts();
      return extracted.map((post: any) => ({
        id: post.id,
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        score: post.score,
        commentCount: post.commentCount,
        permalink: post.permalink,
        contentHref: post.contentHref,
        postType: post.postType,
        isUpvoted: post.isUpvoted,
        isDownvoted: post.isDownvoted,
        mediaUrl: post.mediaUrl,
      }));
    });

    expect(posts).toHaveLength(9);

    // Verify Post 1 (RedGifs Video Post)
    const post1 = posts[0];
    expect(post1.id).toBe('t3_redgifs1');
    expect(post1.title).toBe('Incredible acrobatic jump on RedGifs');
    expect(post1.author).toBe('redgifs_creator');
    expect(post1.subreddit).toBe('r/gifs');
    expect(post1.score).toBe(1542);
    expect(post1.commentCount).toBe(42);
    expect(post1.contentHref).toContain('redgifs.com/watch/acrobaticjump123');
    expect(post1.postType).toBe('video');
    expect(post1.isUpvoted).toBe(false);
    expect(post1.isDownvoted).toBe(false);

    // Verify Post 2 (Native Reddit Video Post)
    const post2 = posts[1];
    expect(post2.id).toBe('t3_nativevideo2');
    expect(post2.title).toBe('Puppy learning how to climb stairs');
    expect(post2.author).toBe('doggo_fanatic');
    expect(post2.subreddit).toBe('r/aww');
    expect(post2.score).toBe(8930);
    expect(post2.commentCount).toBe(128);
    expect(post2.contentHref).toContain('v.redd.it');
    expect(post2.postType).toBe('video');
    expect(post2.mediaUrl).toBeDefined();

    // Verify Post 3 (Image Post)
    const post3 = posts[2];
    expect(post3.id).toBe('t3_image3');
    expect(post3.title).toBe('Sunset over the Rocky Mountains');
    expect(post3.author).toBe('outdoor_explorer');
    expect(post3.subreddit).toBe('r/EarthPorn');
    expect(post3.score).toBe(4320);
    expect(post3.commentCount).toBe(75);
    expect(post3.postType).toBe('image');

    // Verify Post 4 (Link Post)
    const post4 = posts[3];
    expect(post4.id).toBe('t3_linkpost4');
    expect(post4.title).toContain('ABVP rides Gen Z protest wave');
    expect(post4.author).toBe('GuestFromBudushchego');
    expect(post4.subreddit).toBe('r/india');
    expect(post4.score).toBe(83);
    expect(post4.commentCount).toBe(20);
    expect(post4.contentHref).toContain('thehindu.com');
    expect(post4.postType).toBe('link');
  });

  test('handles dynamic post additions via observeNewPosts', async ({ page }) => {
    const receivedNewPosts = await page.evaluate(() => {
      return new Promise<any[]>((resolve) => {
        const received: any[] = [];
        const disconnect = (window as any).observeNewPosts((posts: any[]) => {
          received.push(...posts.map((p) => ({ id: p.id, title: p.title, postType: p.postType })));
          disconnect();
          resolve(received);
        });

        // Dynamically append a new shreddit-post
        const newPost = document.createElement('shreddit-post');
        newPost.setAttribute('id', 't3_dynamic1');
        newPost.setAttribute('post-title', 'Dynamic post via infinite scroll');
        newPost.setAttribute('author', 'scroll_user');
        newPost.setAttribute('post-type', 'video');
        newPost.setAttribute('content-href', 'https://v.redd.it/dynamic123');
        document.getElementById('posts-container')?.appendChild(newPost);
      });
    });

    expect(receivedNewPosts).toHaveLength(1);
    expect(receivedNewPosts[0].id).toBe('t3_dynamic1');
    expect(receivedNewPosts[0].title).toBe('Dynamic post via infinite scroll');
    expect(receivedNewPosts[0].postType).toBe('video');
  });
});
