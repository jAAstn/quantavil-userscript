/**
 * Input Controller Subsystem
 * Handles keyboard hotkeys and tap gestures (play/pause, fit/fill toggle)
 */

import { audioManager, unlockAudio, applyAudioState } from '../media';
import { showPlayPulse, showScalePulse } from '../ui/pulse';

export const POST_SELECTORS = 'shreddit-post, article, [data-testid="post-container"], .Post';

export interface InputControllerOptions {
  isReelModeActive: () => boolean;
  getActivePost: () => HTMLElement | null;
  onExit: () => void;
  onToggleMute: () => void;
  onToggleSubtitles?: () => void;
  onNextPost?: () => void;
  onPrevPost?: () => void;
}

export class InputController {
  private options: InputControllerOptions;
  private lastTapTimestamp = 0;
  private lastTapPost: HTMLElement | null = null;
  private singleTapTimer: ReturnType<typeof setTimeout> | null = null;
  private clickListener: ((e: MouseEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: InputControllerOptions) {
    this.options = options;
  }

  public attach(): void {
    if (!this.clickListener) {
      this.clickListener = (e: MouseEvent) => this.handleTap(e);
      document.addEventListener('click', this.clickListener, true);
    }

    if (!this.keydownListener) {
      this.keydownListener = (e: KeyboardEvent) => this.handleKeyDown(e);
      window.addEventListener('keydown', this.keydownListener);
    }
  }

  public detach(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, true);
      this.clickListener = null;
    }

    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }

    this.lastTapTimestamp = 0;
    this.lastTapPost = null;
    if (this.singleTapTimer) {
      clearTimeout(this.singleTapTimer);
      this.singleTapTimer = null;
    }
  }

  private fireSingleTap(post: HTMLElement): void {
    if (!this.options.isReelModeActive()) return;
    const video = audioManager.findVideo(post);
    if (video) {
      const wasPaused = video.paused;
      if (wasPaused) {
        applyAudioState(post, audioManager.isMuted);
        video.play().catch(() => {});
      } else {
        video.pause();
      }

      // Show pulse animation
      showPlayPulse(wasPaused);
    }
  }

  private handleTap(e: MouseEvent): void {
    if (!this.options.isReelModeActive()) return;

    const target = e.target as HTMLElement;
    // Ignore clicks on action rail, info links, link cards, text cards, or buttons
    if (
      target.closest(
        '.rr-action-rail, .rr-post-info, .rr-top-bar, .rr-link-card-container, .rr-text-card-container, button, a, shreddit-post-action-row, [slot="action-row"], [slot="vote"]'
      )
    ) {
      return;
    }

    const post = target.closest(POST_SELECTORS) as HTMLElement | null;
    if (!post) return;

    // On any tap, unlock audio permission
    unlockAudio();

    // Check for double-tap to toggle Fit (contain) vs Fill (cover).
    // Single-tap play/pause is deferred by 320ms so a double-tap does not
    // also pause/play on its first tap.
    const now = Date.now();
    if (now - this.lastTapTimestamp < 320 && this.lastTapPost === post) {
      if (this.singleTapTimer) {
        clearTimeout(this.singleTapTimer);
        this.singleTapTimer = null;
      }
      this.lastTapTimestamp = 0;
      this.lastTapPost = null;
      const isCurrentlyContain = post.classList.contains('rr-fit-contain');
      if (isCurrentlyContain) {
        post.classList.remove('rr-fit-contain');
        post.classList.add('rr-fit-cover');
        showScalePulse('Fill (Full Bleed)');
      } else {
        post.classList.remove('rr-fit-cover');
        post.classList.add('rr-fit-contain');
        showScalePulse('Fit (Original)');
      }
      return;
    }

    this.lastTapTimestamp = now;
    this.lastTapPost = post;

    if (this.singleTapTimer) {
      clearTimeout(this.singleTapTimer);
    }
    this.singleTapTimer = setTimeout(() => {
      this.singleTapTimer = null;
      this.fireSingleTap(post);
    }, 320);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.options.isReelModeActive()) return;

    if (e.key === 'Escape') {
      this.options.onExit();
    } else if (e.key === 'm' || e.key === 'M') {
      this.options.onToggleMute();
    } else if (e.key === 'c' || e.key === 'C') {
      this.options.onToggleSubtitles?.();
    } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
      this.options.onNextPost?.();
    } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
      this.options.onPrevPost?.();
    }
  }
}
