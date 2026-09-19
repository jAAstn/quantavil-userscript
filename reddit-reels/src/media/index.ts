import { ReelPost } from '../extractor/types';
import { ResolvedMedia } from './types';
import { audioManager, AudioManager } from './audio-manager';

export * from './types';
export * from './audio-manager';

/**
 * Direct DOM media resolver.
 * Inspects Reddit's already-rendered post element and extracts the active media source
 * with zero external network requests or rate limits.
 */
export function resolveMedia(post: ReelPost): ResolvedMedia {
  const el = post.element;
  if (!el) {
    return {
      type: 'image',
      src: post.mediaUrl || post.contentHref || '',
      hasAudio: false,
    };
  }

  // 1. Native video or shreddit-player-2
  const video = el.querySelector<HTMLVideoElement>('video');
  const player = el.querySelector<HTMLElement>('shreddit-player-2');
  if (video || player) {
    const src =
      video?.currentSrc ||
      video?.src ||
      player?.getAttribute('stream-url') ||
      player?.getAttribute('src') ||
      post.mediaUrl ||
      post.contentHref ||
      '';
    const poster =
      video?.poster ||
      player?.getAttribute('poster') ||
      player?.getAttribute('preview') ||
      undefined;

    return {
      type: 'video',
      src,
      poster,
      hasAudio: player?.getAttribute('has-audio') !== 'false',
      element: video || player || undefined,
    };
  }

  // 2. Embedded iframe (e.g. RedGifs, Streamable, YouTube)
  const iframe = el.querySelector<HTMLIFrameElement>('iframe');
  if (iframe && iframe.src) {
    return {
      type: 'iframe',
      src: iframe.src,
      hasAudio: true,
      element: iframe,
    };
  }

  // 3. Fallback: Check if post links to RedGifs
  if (post.contentHref && /redgifs\.com/i.test(post.contentHref)) {
    const match = post.contentHref.match(/redgifs\.com\/(?:watch|ifr|v)\/([a-zA-Z0-9_-]+)/i);
    if (!match) {
      // Unknown RedGifs URL shape — degrade to an image/link card instead of
      // inserting a broken iframe with an empty ID.
      const imgFallback = el.querySelector<HTMLImageElement>('img');
      const fallbackSrc = imgFallback?.src || post.mediaUrl || post.contentHref || '';
      return {
        type: 'image',
        src: fallbackSrc,
        poster: fallbackSrc,
        hasAudio: false,
      };
    }
    return {
      type: 'iframe',
      src: `https://www.redgifs.com/ifr/${match[1]}?autoplay=1&muted=0`,
      hasAudio: true,
    };
  }

  // 4. Image or gallery
  const img = el.querySelector<HTMLImageElement>(
    'img[src*="i.redd.it"], img[src*="preview.redd.it"], [slot="post-media-container"] img, img'
  );
  const imgSrc = img?.src || post.mediaUrl || post.contentHref || '';

  return {
    type: 'image',
    src: imgSrc,
    poster: imgSrc,
    hasAudio: false,
  };
}

export { audioManager, AudioManager };
