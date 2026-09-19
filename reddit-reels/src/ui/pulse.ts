/**
 * Animated pulse feedback for play/pause and scale mode changes
 */

export function showPlayPulse(isPlaying: boolean): void {
  const existing = document.querySelector('.rr-play-pulse');
  if (existing) existing.remove();

  const pulse = document.createElement('div');
  pulse.className = 'rr-play-pulse';
  pulse.innerHTML = isPlaying
    ? `<svg width="44" height="44" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
    : `<svg width="44" height="44" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

  document.body.appendChild(pulse);
  setTimeout(() => pulse.remove(), 550);
}

export function showScalePulse(mode: string): void {
  const existing = document.querySelector('.rr-scale-pulse');
  if (existing) existing.remove();

  const pulse = document.createElement('div');
  pulse.className = 'rr-scale-pulse';
  pulse.textContent = mode;

  document.body.appendChild(pulse);
  setTimeout(() => pulse.remove(), 650);
}
