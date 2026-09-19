export * from './types';
export {
  extractPosts,
  observeNewPosts,
  parsePostElement,
  checkIsUpvoted,
  checkIsDownvoted,
  queryDeep,
  UPVOTE_SELECTORS,
  DOWNVOTE_SELECTORS,
} from './dom-extractor';
export {
  proxyUpvote,
  proxyDownvote,
} from './vote-proxy';
