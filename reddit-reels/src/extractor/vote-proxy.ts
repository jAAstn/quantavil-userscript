import { ReelPost } from './types';
import { queryDeep, UPVOTE_SELECTORS, DOWNVOTE_SELECTORS, checkIsUpvoted, checkIsDownvoted } from './dom-extractor';

/**
 * Dispatches a click event on an element.
 * If the element is a container wrapping a button, targets the inner button.
 */
function clickButton(element: HTMLElement): boolean {
  const target =
    element.tagName.toLowerCase() === 'button'
      ? element
      : element.querySelector<HTMLElement>('button') ?? element;

  try {
    target.click();
    return true;
  } catch {
    try {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      return target.dispatchEvent(clickEvent);
    } catch {
      return false;
    }
  }
}

/**
 * Finds the native upvote button within post.element and dispatches a click event.
 * Returns true if the button was found and clicked, false otherwise.
 */
export function proxyUpvote(post: ReelPost): boolean {
  if (!post || !post.element) return false;

  const button = queryDeep(post.element, UPVOTE_SELECTORS);
  if (!button) return false;

  const success = clickButton(button);
  if (success && post.element) {
    // Use the same thorough vote-state checks as display code so
    // ReelPost fields cannot drift from what the overlay shows.
    post.isUpvoted = checkIsUpvoted(post.element);
    const downBtn = queryDeep(post.element, DOWNVOTE_SELECTORS);
    if (downBtn) {
      post.isDownvoted = checkIsDownvoted(post.element);
    }
  }

  return success;
}

/**
 * Finds the native downvote button within post.element and dispatches a click event.
 * Returns true if the button was found and clicked, false otherwise.
 */
export function proxyDownvote(post: ReelPost): boolean {
  if (!post || !post.element) return false;

  const button = queryDeep(post.element, DOWNVOTE_SELECTORS);
  if (!button) return false;

  const success = clickButton(button);
  if (success && post.element) {
    post.isDownvoted = checkIsDownvoted(post.element);
    const upBtn = queryDeep(post.element, UPVOTE_SELECTORS);
    if (upBtn) {
      post.isUpvoted = checkIsUpvoted(post.element);
    }
  }

  return success;
}
