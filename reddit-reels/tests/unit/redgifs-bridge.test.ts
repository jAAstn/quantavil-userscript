import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { GlobalWindow } from 'happy-dom';
import { isRedGifsFrame, initRedGifsBridge, REDGIFS_MESSAGE_SOURCE } from '../../src/media/redgifs-bridge';
import { applyAudioState, AudioManager } from '../../src/media/audio-manager';
import { determinePostType } from '../../src/extractor/dom-extractor';

describe('RedGifs Bridge & Seamless Audio Protocol', () => {
  let window: GlobalWindow;
  let document: Document;

  beforeEach(() => {
    window = new GlobalWindow({ url: 'https://www.redgifs.com/ifr/fancyjumpingfrog' });
    document = window.document;
    (globalThis as any).window = window;
    (globalThis as any).document = document;
    (globalThis as any).Node = window.Node;
    (globalThis as any).HTMLElement = window.HTMLElement;
    (globalThis as any).HTMLVideoElement = window.HTMLVideoElement;
    (globalThis as any).HTMLIFrameElement = window.HTMLIFrameElement;
    (globalThis as any).MutationObserver = window.MutationObserver;
    (globalThis as any).MessageEvent = window.MessageEvent;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).Node;
    delete (globalThis as any).HTMLElement;
    delete (globalThis as any).HTMLVideoElement;
    delete (globalThis as any).HTMLIFrameElement;
    delete (globalThis as any).MutationObserver;
    delete (globalThis as any).MessageEvent;
  });

  it('isRedGifsFrame detects redgifs.com hostname accurately', () => {
    expect(isRedGifsFrame()).toBe(true);

    const redditWin = new GlobalWindow({ url: 'https://www.reddit.com/r/gifs' });
    (globalThis as any).window = redditWin;
    expect(isRedGifsFrame()).toBe(false);
  });

  it('initRedGifsBridge syncs audio state to <video> and handles SET_AUDIO message', () => {
    document.body.innerHTML = `
      <div id="player">
        <video src="https://media.redgifs.com/test.mp4"></video>
      </div>
    `;

    const video = document.querySelector<HTMLVideoElement>('video')!;
    let played = false;
    let paused = false;
    Object.defineProperty(video, 'paused', { value: true, writable: true, configurable: true });
    video.play = async () => {
      played = true;
      (video as any).paused = false;
    };
    video.pause = () => {
      paused = true;
      (video as any).paused = true;
    };

    const teardown = initRedGifsBridge();

    // Initial state: unmuted by default
    expect(video.muted).toBe(false);
    expect(video.volume).toBe(1.0);

    // Send SET_AUDIO to mute
    window.dispatchEvent(
      new (window as any).MessageEvent('message', {
        data: {
          source: REDGIFS_MESSAGE_SOURCE,
          type: 'SET_AUDIO',
          muted: true,
          volume: 0.3,
        },
      })
    );

    expect(video.muted).toBe(true);
    expect(video.volume).toBe(0.3);

    // Send SET_AUDIO to unmute and verify play trigger
    window.dispatchEvent(
      new (window as any).MessageEvent('message', {
        data: {
          source: REDGIFS_MESSAGE_SOURCE,
          type: 'SET_AUDIO',
          muted: false,
          volume: 0.8,
        },
      })
    );

    expect(video.muted).toBe(false);
    expect(video.volume).toBe(0.8);
    expect(played).toBe(true);

    // Send PAUSE
    Object.defineProperty(video, 'paused', { value: false, writable: true, configurable: true });
    window.dispatchEvent(
      new (window as any).MessageEvent('message', {
        data: {
          source: REDGIFS_MESSAGE_SOURCE,
          type: 'PAUSE',
        },
      })
    );

    expect(paused).toBe(true);
    expect(video.muted).toBe(true);

    teardown();
  });

  it('applyAudioState dispatches postMessage bridge events without modifying ifr.src', () => {
    const container = document.createElement('div');
    const ifr = document.createElement('iframe');
    const originalSrc = 'https://www.redgifs.com/ifr/testfrog?autoplay=1&muted=0';
    ifr.src = originalSrc;
    container.appendChild(ifr);

    const receivedMessages: any[] = [];
    Object.defineProperty(ifr, 'contentWindow', {
      value: {
        postMessage: (msg: any) => {
          receivedMessages.push(msg);
        },
      },
      configurable: true,
    });

    // Apply muted = true
    applyAudioState(container, true, 0.4);

    // Assert ifr.src was NOT mutated (prevents destructive reload loop!)
    expect(ifr.src).toBe(originalSrc);

    // Assert message bridge protocol was dispatched
    const bridgeMsg = receivedMessages.find((m) => m.source === 'reddit-reels' && m.type === 'SET_AUDIO');
    expect(bridgeMsg).toBeDefined();
    expect(bridgeMsg.muted).toBe(true);
    expect(bridgeMsg.volume).toBe(0);

    // Apply muted = false
    applyAudioState(container, false, 0.7);
    expect(ifr.src).toBe(originalSrc);
    const unmutedMsg = receivedMessages.filter((m) => m.source === 'reddit-reels' && m.type === 'SET_AUDIO').pop();
    expect(unmutedMsg.muted).toBe(false);
    expect(unmutedMsg.volume).toBe(0.7);
  });

  it('determinePostType classifies YouTube, TikTok, and direct MP4 links as video even when marked post-type="link"', () => {
    const ytPost = document.createElement('shreddit-post');
    ytPost.setAttribute('post-type', 'link');
    ytPost.setAttribute('content-href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(determinePostType(ytPost, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('video');

    const mp4Post = document.createElement('shreddit-post');
    mp4Post.setAttribute('post-type', 'link');
    mp4Post.setAttribute('content-href', 'https://example.com/clip.mp4');
    expect(determinePostType(mp4Post, 'https://example.com/clip.mp4')).toBe('video');

    const newsPost = document.createElement('shreddit-post');
    newsPost.setAttribute('post-type', 'link');
    newsPost.setAttribute('content-href', 'https://www.theverge.com/tech-news');
    expect(determinePostType(newsPost, 'https://www.theverge.com/tech-news')).toBe('link');
  });
});
