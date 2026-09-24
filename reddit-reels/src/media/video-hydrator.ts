/**
 * Video Hydrator Subsystem
 * Hydrates lazy shreddit-player-2 videos so autoplay works on activation.
 */

function readPlayerSrc(player: HTMLElement): string {
  try {
    const direct = player.getAttribute('stream-url') || player.getAttribute('src');
    if (direct) return direct;
    const packed = player.getAttribute('packaged-media-json');
    if (packed) {
      try {
        const json = JSON.parse(packed);
        const url = json?.playbackMp4Url || json?.playback_url || json?.hlsUrl;
        if (typeof url === 'string' && url) return url;
      } catch {}
    }
  } catch {}
  return '';
}

/**
 * If video has no source yet, copy it from the host player component.
 * Returns true when video is ready (or already had a source).
 */
export function hydrateVideoFromPlayer(
  container: HTMLElement,
  video: HTMLVideoElement
): boolean {
  try {
    if (video.currentSrc) return true;
    if (video.readyState > 0 && video.src) return true;
    const player = video.closest?.('shreddit-player-2') as HTMLElement | null
      || container.querySelector?.('shreddit-player-2') as HTMLElement | null;
    if (!player) return !!video.src;
    const src = readPlayerSrc(player);
    if (!src) return !!video.src;
    video.src = src;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.muted = true;
    try { video.load(); } catch {}
    return true;
  } catch {
    return false;
  }
}

export function ensureAutoplayAttrs(video: HTMLVideoElement): void {
  try {
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
  } catch {}
}
