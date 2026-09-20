import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { GlobalWindow } from 'happy-dom';
import { AudioManager } from '../../src/media/audio-manager';
import { resolveMedia } from '../../src/media';
import { ReelPost } from '../../src/extractor/types';

// Mock for HTMLVideoElement
class MockVideoElement {
  public paused: boolean = true;
  public muted: boolean = false;
  public currentTime: number = 0;
  public playsInline: boolean = false;
  public src: string = '';
  public poster: string = '';

  public async play(): Promise<void> {
    this.paused = false;
  }

  public pause(): void {
    this.paused = true;
  }

  public closest(): HTMLElement | null {
    return null;
  }
}

describe('AudioManager (Playback Controller)', () => {
  let manager: AudioManager;

  beforeEach(() => {
    manager = new AudioManager(false); // unmuted by default
  });

  it('is unmuted by default', () => {
    assert.equal(manager.isMuted, false);
  });

  it('enforces single-media mutex when switching videos (0 audio overlap)', () => {
    const video1 = new MockVideoElement() as unknown as HTMLVideoElement;
    const video2 = new MockVideoElement() as unknown as HTMLVideoElement;

    // Start video 1
    manager.requestPlayback(video1);
    assert.equal(video1.paused, false);
    assert.equal(video1.muted, false);

    // Progress
    video1.currentTime = 12.0;

    // Request video 2 -> video 1 must pause, mute, and reset
    manager.requestPlayback(video2);
    assert.equal(video1.paused, true, 'Previous video must be paused');
    assert.equal(video1.muted, true, 'Previous video must be muted');
    assert.equal(video1.currentTime, 0, 'Previous video currentTime must be reset to 0');

    assert.equal(video2.paused, false, 'New video must be playing');
    assert.equal(video2.muted, false, 'New video must inherit unmuted state');
  });

  it('toggles global mute state and applies to active video', () => {
    const video = new MockVideoElement() as unknown as HTMLVideoElement;
    manager.requestPlayback(video);
    assert.equal(manager.isMuted, false);
    assert.equal(video.muted, false);

    // Toggle to muted
    const newMuted = manager.toggleMute();
    assert.equal(newMuted, true);
    assert.equal(manager.isMuted, true);
    assert.equal(video.muted, true);

    // Toggle back to unmuted
    const unmuted = manager.toggleMute();
    assert.equal(unmuted, false);
    assert.equal(manager.isMuted, false);
    assert.equal(video.muted, false);
  });

  it('stopAll pauses and mutes all playback', () => {
    const video = new MockVideoElement() as unknown as HTMLVideoElement;
    manager.requestPlayback(video);

    manager.stopAll();
    assert.equal(video.paused, true);
    assert.equal(video.muted, true);
  });
});

describe('Direct DOM resolveMedia', () => {
  let window: GlobalWindow;
  let document: Document;

  beforeEach(() => {
    window = new GlobalWindow();
    document = window.document;
    (globalThis as any).window = window;
    (globalThis as any).document = document;
    (globalThis as any).Event = window.Event;
    (globalThis as any).Node = window.Node;
    (globalThis as any).HTMLElement = window.HTMLElement;
    (globalThis as any).HTMLVideoElement = window.HTMLVideoElement;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).Event;
    delete (globalThis as any).Node;
    delete (globalThis as any).HTMLElement;
    delete (globalThis as any).HTMLVideoElement;
  });

  it('resolves native video from element', () => {
    const fakeEl = {
      querySelector: (sel: string) => {
        if (sel === 'video') return { src: 'https://v.redd.it/test/video.mp4', poster: 'test.jpg' };
        return null;
      },
    } as unknown as HTMLElement;

    const post: ReelPost = {
      id: 't3_1',
      title: 'Native Video',
      author: 'user1',
      subreddit: 'r/videos',
      score: 100,
      commentCount: 10,
      permalink: '/r/videos/1',
      contentHref: 'https://v.redd.it/test/video.mp4',
      postType: 'video',
      element: fakeEl,
    };

    const res = resolveMedia(post);
    assert.equal(res.type, 'video');
    assert.equal(res.src, 'https://v.redd.it/test/video.mp4');
    assert.equal(res.hasAudio, true);
  });

  it('resolves iframe embed from element (e.g. RedGifs)', () => {
    const fakeEl = {
      querySelector: (sel: string) => {
        if (sel === 'iframe') return { src: 'https://www.redgifs.com/ifr/fancyjumpingfrog' };
        return null;
      },
    } as unknown as HTMLElement;

    const post: ReelPost = {
      id: 't3_2',
      title: 'RedGifs Embed',
      author: 'user2',
      subreddit: 'r/gifs',
      score: 250,
      commentCount: 15,
      permalink: '/r/gifs/2',
      contentHref: 'https://www.redgifs.com/watch/fancyjumpingfrog',
      postType: 'video',
      element: fakeEl,
    };

    const res = resolveMedia(post);
    assert.equal(res.type, 'iframe');
    assert.equal(res.src, 'https://www.redgifs.com/ifr/fancyjumpingfrog?muted=0');
    assert.equal(res.hasAudio, true);
  });

  it('normalizes RedGifs iframe muted param both directions', () => {
    const { normalizeIframeSrc } = require('../../src/media/audio-manager');
    assert.equal(
      normalizeIframeSrc('https://www.redgifs.com/ifr/abc?autoplay=1&muted=1', false),
      'https://www.redgifs.com/ifr/abc?autoplay=1&muted=0'
    );
    assert.equal(
      normalizeIframeSrc('https://www.redgifs.com/ifr/abc?autoplay=1&muted=0', true),
      'https://www.redgifs.com/ifr/abc?autoplay=1&muted=1'
    );
    assert.equal(
      normalizeIframeSrc('https://www.redgifs.com/ifr/abc', false),
      'https://www.redgifs.com/ifr/abc?muted=0'
    );
  });

  it('volume level persists and drives mute state', () => {
    const m = new AudioManager(false, 0.8);
    assert.equal(m.volume, 0.8);
    m.setVolume(0);
    assert.equal(m.volume, 0);
    assert.equal(m.isMuted, true);
    m.setVolume(0.5);
    assert.equal(m.volume, 0.5);
    assert.equal(m.isMuted, false);
    m.adjustVolume(0.2);
    assert.equal(m.volume, 0.7);
  });

  it('resolves image from element', () => {
    const fakeEl = {
      querySelector: (sel: string) => {
        if (sel.includes('img')) return { src: 'https://i.redd.it/sample.jpg' };
        return null;
      },
    } as unknown as HTMLElement;

    const post: ReelPost = {
      id: 't3_3',
      title: 'Image Post',
      author: 'user3',
      subreddit: 'r/pics',
      score: 50,
      commentCount: 5,
      permalink: '/r/pics/3',
      contentHref: 'https://i.redd.it/sample.jpg',
      postType: 'image',
      element: fakeEl,
    };

    const res = resolveMedia(post);
    assert.equal(res.type, 'image');
    assert.equal(res.src, 'https://i.redd.it/sample.jpg');
    assert.equal(res.hasAudio, false);
  });

  it('preserves square / 4:5 meme videos as contain and vertical videos as cover', () => {
    const { unconstrainPostMedia } = require('../../src/core/unconstrainer');

    const postEl = document.createElement('div');
    const video = document.createElement('video');
    Object.defineProperty(video, 'videoWidth', { value: 1080, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 1080, configurable: true }); // 1:1 square
    postEl.appendChild(video);

    unconstrainPostMedia(postEl);
    assert.equal(video.classList.contains('rr-vertical-video'), false);
    assert.equal(video.style.objectFit, 'contain');
    assert.equal(postEl.classList.contains('rr-has-vertical-video'), false);

    // Now test true 9:16 vertical reel
    Object.defineProperty(video, 'videoWidth', { value: 1080, configurable: true });
    Object.defineProperty(video, 'videoHeight', { value: 1920, configurable: true }); // 16:9 vertical
    video.dispatchEvent(new Event('loadedmetadata'));

    assert.equal(video.classList.contains('rr-vertical-video'), true);
    assert.equal(video.style.objectFit, 'cover');
    assert.equal(postEl.classList.contains('rr-has-vertical-video'), true);
  });

  it('toggles subtitles state and tracks mode', () => {
    const { applySubtitlesState } = require('../../src/core/unconstrainer');

    const postEl = document.createElement('div');
    const video = document.createElement('video');
    const fakeTrack = { mode: 'showing' };
    Object.defineProperty(video, 'textTracks', {
      value: [fakeTrack],
      configurable: true,
    });
    postEl.appendChild(video);

    applySubtitlesState(postEl, false);
    assert.equal(fakeTrack.mode, 'disabled');
    assert.equal(postEl.classList.contains('rr-hide-captions'), true);

    applySubtitlesState(postEl, true);
    assert.equal(fakeTrack.mode, 'showing');
    assert.equal(postEl.classList.contains('rr-hide-captions'), false);
  });
});
