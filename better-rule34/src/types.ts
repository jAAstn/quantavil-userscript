export type FutaOption = 'all' | 'hide' | 'only';

export interface CardData {
  id: string;
  title: string;
  url: string;
  previewUrl: string | null;
  thumbUrl: string;
  durationSeconds: number;
  durationFormatted: string;
  ratingPercent: number;
  votesCount: number;
  viewsCount: number;
  viewsFormatted: string;
  commentsCount: number;
  hasSound: boolean;
  isHd: boolean;
  isFuta: boolean;
  isWatched: boolean;
  submittedAgo: string;
  submittedYear: number;
}

export interface FilterState {
  query: string;
  soundOnly: boolean;
  hdOnly: boolean;
  futaFilter: FutaOption;
  hideWatched: boolean;
  minRating: number;
  minViews: number;
  minYear: number;
  durationMinSeconds: number | null;
}
