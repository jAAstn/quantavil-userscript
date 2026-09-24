import { ReelPost } from './types';
import { queryDeep, UPVOTE_SELECTORS, DOWNVOTE_SELECTORS, checkIsUpvoted, checkIsDownvoted } from './dom-extractor';

/**
 * Dispatches a click event on an element.
 * If the element is a container wrapping a button, targets the inner button
 * (including buttons hidden inside nested shadowRoots).
 */
function deepInnerButton(element: HTMLElement): HTMLElement {
  if (element.tagName.toLowerCase() === 'button') return element;
  try {
    const direct = element.querySelector<HTMLElement>('button');
    if (direct) return direct;
  } catch {}
  try {
    const sr = (element as HTMLElement).shadowRoot;
    const inner = sr?.querySelector<HTMLElement>('button');
    if (inner) return inner;
  } catch {}
  try {
    const nested = element.querySelectorAll('*');
    for (let i = 0; i < nested.length; i++) {
      const el = nested[i] as HTMLElement;
      try {
        const btn = el.shadowRoot?.querySelector<HTMLElement>('button');
        if (btn) return btn;
      } catch {}
    }
  } catch {}
  return element;
}

function clickButton(element: HTMLElement): boolean {
  const target = deepInnerButton(element);

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
export function proxyUpvote(post: ReelPost, onSync?: () => void): boolean {
  if (!post || !post.element) return false;

  const button = queryDeep(post.element, UPVOTE_SELECTORS);
  if (!button) return false;

  const wasUpvoted = !!post.isUpvoted;
  const wasDownvoted = !!post.isDownvoted;

  const success = clickButton(button);
  if (success && post.element) {
    // Optimistic toggle
    if (wasUpvoted) {
      post.isUpvoted = false;
    } else {
      post.isUpvoted = true;
      post.isDownvoted = false;
    }

    // Synchronous check if native handler updated immediately (e.g. tests or simple DOM)
    const liveUp = checkIsUpvoted(post.element);
    const liveDown = checkIsDownvoted(post.element);
    if (liveUp !== wasUpvoted || liveDown !== wasDownvoted) {
      post.isUpvoted = liveUp;
      post.isDownvoted = liveDown;
    }

    // Deferred check for asynchronous Lit/WebComponent render lifecycle
    setTimeout(() => {
      if (post.element) {
        post.isUpvoted = checkIsUpvoted(post.element);
        post.isDownvoted = checkIsDownvoted(post.element);
      }
      onSync?.();
    }, 50);
  }

  return success;
}

/**
 * Finds the native downvote button within post.element and dispatches a click event.
 * Returns true if the button was found and clicked, false otherwise.
 */
export function proxyDownvote(post: ReelPost, onSync?: () => void): boolean {
  if (!post || !post.element) return false;

  const button = queryDeep(post.element, DOWNVOTE_SELECTORS);
  if (!button) return false;

  const wasUpvoted = !!post.isUpvoted;
  const wasDownvoted = !!post.isDownvoted;

  const success = clickButton(button);
  if (success && post.element) {
    // Optimistic toggle
    if (wasDownvoted) {
      post.isDownvoted = false;
    } else {
      post.isDownvoted = true;
      post.isUpvoted = false;
    }

    // Synchronous check if native handler updated immediately (e.g. tests or simple DOM)
    const liveUp = checkIsUpvoted(post.element);
    const liveDown = checkIsDownvoted(post.element);
    if (liveUp !== wasUpvoted || liveDown !== wasDownvoted) {
      post.isUpvoted = liveUp;
      post.isDownvoted = liveDown;
    }

    // Deferred check for asynchronous Lit/WebComponent render lifecycle
    setTimeout(() => {
      if (post.element) {
        post.isUpvoted = checkIsUpvoted(post.element);
        post.isDownvoted = checkIsDownvoted(post.element);
      }
      onSync?.();
    }, 50);
  }

  return success;
}
