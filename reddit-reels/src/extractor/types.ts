export type PostType = 'video' | 'image' | 'gallery' | 'link' | 'text';

export interface ReelPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  commentCount: number;
  permalink: string;
  contentHref: string;
  postType: PostType;
  element: HTMLElement;
  mediaUrl?: string;
  textBody?: string;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  isScoreHidden?: boolean;
}
