export interface ResolvedMedia {
  type: 'video' | 'image' | 'iframe';
  src: string;
  poster?: string;
  hasAudio: boolean;
  element?: HTMLElement;
}
