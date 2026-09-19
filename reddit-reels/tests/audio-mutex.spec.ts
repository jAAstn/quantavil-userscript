import { test, expect } from '@playwright/test';

test.describe('Audio Mutex & AudioManager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mock-reddit.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('starting playback on the second video immediately stops and mutes the first (0 audio overlap)', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const v1 = document.getElementById('mock-video-1') as HTMLVideoElement;
      const v2 = document.getElementById('mock-video-2') as HTMLVideoElement;
      const manager = (window as any).audioManager;

      // Ensure manager starts unmuted for testing
      manager.isMuted = false;

      // 1. Start playback on video 1
      manager.requestPlayback(v1);

      const state1 = {
        v1IsActive: manager.getActiveVideo() === v1,
        v1Muted: v1.muted,
      };

      // 2. Request playback on video 2 (simulating Reel slide transition)
      manager.requestPlayback(v2);

      const state2 = {
        v1Paused: v1.paused,
        v1Muted: v1.muted,
        v1CurrentTime: v1.currentTime,
        v2IsActive: manager.getActiveVideo() === v2,
        v2Muted: v2.muted,
      };

      return { state1, state2 };
    });

    // Verification step 1: Video 1 was initially active and unmuted
    expect(result.state1.v1IsActive).toBe(true);
    expect(result.state1.v1Muted).toBe(false);

    // Verification step 2: Transition to Video 2 immediately paused and muted Video 1
    expect(result.state2.v1Paused).toBe(true);
    expect(result.state2.v1Muted).toBe(true);
    expect(result.state2.v1CurrentTime).toBe(0);
    expect(result.state2.v2IsActive).toBe(true);
    expect(result.state2.v2Muted).toBe(false);
  });

  test('stopAll() halts playback, mutes, and clears active video reference', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const v2 = document.getElementById('mock-video-2') as HTMLVideoElement;
      const manager = (window as any).audioManager;

      manager.isMuted = false;
      manager.requestPlayback(v2);

      const beforeStop = {
        v2IsActive: manager.getActiveVideo() === v2,
      };

      manager.stopAll();

      const afterStop = {
        v2Paused: v2.paused,
        v2Muted: v2.muted,
        v2CurrentTime: v2.currentTime,
        activeVideo: manager.getActiveVideo(),
      };

      return { beforeStop, afterStop };
    });

    expect(result.beforeStop.v2IsActive).toBe(true);
    expect(result.afterStop.v2Paused).toBe(true);
    expect(result.afterStop.v2Muted).toBe(true);
    expect(result.afterStop.v2CurrentTime).toBe(0);
    expect(result.afterStop.activeVideo).toBeNull();
  });

  test('toggleMute updates global audio state and active video muted property', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const v1 = document.getElementById('mock-video-1') as HTMLVideoElement;
      const manager = (window as any).audioManager;

      manager.isMuted = false;
      manager.requestPlayback(v1);

      const initialMuted = manager.isMuted;
      const initialVideoMuted = v1.muted;

      // Toggle to muted
      const toggled1 = manager.toggleMute();
      const videoMutedAfterToggle1 = v1.muted;

      // Toggle back to unmuted
      const toggled2 = manager.toggleMute();
      const videoMutedAfterToggle2 = v1.muted;

      manager.stopAll();

      return {
        initialMuted,
        initialVideoMuted,
        toggled1,
        videoMutedAfterToggle1,
        toggled2,
        videoMutedAfterToggle2,
      };
    });

    expect(result.initialMuted).toBe(false);
    expect(result.initialVideoMuted).toBe(false);
    expect(result.toggled1).toBe(true);
    expect(result.videoMutedAfterToggle1).toBe(true);
    expect(result.toggled2).toBe(false);
    expect(result.videoMutedAfterToggle2).toBe(false);
  });
});
