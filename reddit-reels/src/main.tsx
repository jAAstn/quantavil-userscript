import { render } from 'preact';
import './style.css';
import { audioManager, applyAudioState, unlockAudio } from './media';
import {
  FabButton,
  createTopBar,
  syncTopBarState,
} from './ui';
import {
  FeedManager,
  InputController,
  getClosestPostToViewport,
  unconstrainPostMedia,
} from './core';

export { unconstrainPostMedia };

let isReelModeActive = false;
let topBarElement: HTMLElement | null = null;

function syncTopBarSound(): void {
  // Single global mute control lives in the top bar.
  syncTopBarState(topBarElement, audioManager.isMuted, feedManager.isVideosOnly);
}

function handleToggleMute(): void {
  unlockAudio();
  const activePost = getClosestPostToViewport();
  const nextMuted = audioManager.toggleMute(activePost || undefined);
  if (activePost) {
    applyAudioState(activePost, nextMuted);
  }
  syncTopBarSound();
}

const feedManager = new FeedManager({
  isReelModeActive: () => isReelModeActive,
});

const inputController = new InputController({
  isReelModeActive: () => isReelModeActive,
  getActivePost: () => getClosestPostToViewport(),
  onExit: () => toggleReelMode(false),
  onToggleMute: handleToggleMute,
  onToggleSubtitles: () => feedManager.toggleSubtitles(),
  onNextPost: () => feedManager.scrollToNext(),
  onPrevPost: () => feedManager.scrollToPrev(),
});

/**
 * Toggle In-Place Reel Mode ON or OFF
 */
export function toggleReelMode(forceState?: boolean): void {
  const nextState = forceState !== undefined ? forceState : !isReelModeActive;
  isReelModeActive = nextState;

  const feedContainer =
    document.querySelector('shreddit-feed, #posts-container, [data-testid="feed-container"]') ||
    document.querySelector('main') ||
    document.body;

  if (isReelModeActive) {
    unlockAudio();
    document.documentElement.classList.add('rr-active');
    feedContainer?.classList.add('rr-feed-container');

    feedManager.enhanceAllPosts();
    feedManager.applyVideosOnlyFilter();

    const activePost = getClosestPostToViewport();
    if (activePost) {
      activePost.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
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
          active.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      onToggleMute: handleToggleMute,
    });
    document.body.appendChild(topBarElement);

    feedManager.startObservers();
    inputController.attach();
  } else {
    document.documentElement.classList.remove('rr-active');
    feedContainer?.classList.remove('rr-feed-container');
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

function init(): void {
  const fabContainerId = 'rr-fab-container';
  let fabContainer = document.getElementById(fabContainerId);
  if (!fabContainer) {
    fabContainer = document.createElement('div');
    fabContainer.id = fabContainerId;
    document.body.appendChild(fabContainer);
  }

  render(<FabButton onClick={() => toggleReelMode()} />, fabContainer);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
