import { describe, expect, it } from 'bun:test';
import { parseNextLink } from '../src/autopager';
import {
  DEFAULT_FILTER,
  matchesClientFilter,
  parseDuration,
  parseRating,
  parseSubmittedYear,
  parseViews,
  resolveNextPageUrl,
} from '../src/parse';
import type { CardData } from '../src/types';

describe('parsers', () => {
  it('parses duration, views, ratings, and year correctly', () => {
    expect(parseDuration('10:53')).toBe(653);
    expect(parseDuration('1:02:15')).toBe(3735);
    expect(parseViews('4.9K')).toBe(4900);
    expect(parseViews('1.5M')).toBe(1500000);
    expect(parseRating('81% (666)')).toEqual({ percent: 81, count: 666 });
    expect(parseSubmittedYear('2 years ago', 2026)).toBe(2024);
    expect(parseSubmittedYear('2023-05-12', 2026)).toBe(2023);
  });

  it('preserves query parameters on next page URL resolution', () => {
    const current = 'https://rule34video.com/latest-updates/?post_date_from=2026-01-01';
    expect(resolveNextPageUrl(current, '/latest-updates/2/')).toBe(
      'https://rule34video.com/latest-updates/2/?post_date_from=2026-01-01',
    );
  });

  it('parses next link from DOM or data-parameters with various from prefixes', () => {
    const el1 = {
      querySelector: () => ({
        getAttribute: (attr: string) => (attr === 'data-parameters' ? 'q:overwatch;sort_by:;from_videos+from_albums:33' : '#search'),
      }),
    } as unknown as Element;
    expect(parseNextLink(el1, 'https://rule34video.com/search/overwatch/')).toEqual({
      url: null,
      fromParam: 33,
    });

    const el2 = {
      querySelector: () => ({
        getAttribute: (attr: string) => (attr === 'href' ? '/latest-updates/33/' : null),
      }),
    } as unknown as Element;
    expect(parseNextLink(el2, 'https://rule34video.com/latest-updates/32/')).toEqual({
      url: 'https://rule34video.com/latest-updates/33/',
      fromParam: null,
    });
  });
});

describe('matchesClientFilter', () => {
  const card: CardData = {
    id: '1',
    title: 'Genshin Impact Animation',
    url: 'https://rule34video.com/video/1/',
    previewUrl: null,
    thumbUrl: 'https://thumb.jpg',
    durationSeconds: 200,
    durationFormatted: '3:20',
    ratingPercent: 95,
    votesCount: 10,
    viewsCount: 5000,
    viewsFormatted: '5K',
    commentsCount: 2,
    hasSound: true,
    isHd: true,
    isFuta: false,
    isWatched: false,
    submittedAgo: '1 year ago',
    submittedYear: 2025,
  };

  it('evaluates filters accurately', () => {
    expect(matchesClientFilter(card, DEFAULT_FILTER)).toBe(true);
    expect(matchesClientFilter(card, { ...DEFAULT_FILTER, query: 'overwatch' })).toBe(false);
    expect(matchesClientFilter(card, { ...DEFAULT_FILTER, minRating: 98 })).toBe(false);
    expect(matchesClientFilter(card, { ...DEFAULT_FILTER, minViews: 10000 })).toBe(false);
    expect(matchesClientFilter(card, { ...DEFAULT_FILTER, durationMinSeconds: 300 })).toBe(false);
    expect(matchesClientFilter(card, { ...DEFAULT_FILTER, minYear: 2026 })).toBe(false);
    expect(matchesClientFilter(card, { ...DEFAULT_FILTER, futaFilter: 'only' })).toBe(false);
    expect(matchesClientFilter({ ...card, isFuta: true }, { ...DEFAULT_FILTER, futaFilter: 'hide' })).toBe(false);
  });
});

