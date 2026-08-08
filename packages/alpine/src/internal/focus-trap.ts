/**
 * Raw focus candidates. The result is further refined because selectors alone can match
 * invisible or inert elements that must never become a Tab wrap target.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.hasAttribute('hidden')) return false;
  if (element.closest('[inert]')) return false;
  if (element.closest('[aria-hidden="true"]')) return false;
  if (element.getClientRects().length === 0) return false;
  const style = getComputedStyle(element);
  return style.visibility !== 'hidden' && style.visibility !== 'collapse';
}

/** Bind a live, panel-scoped Tab trap and return the listener cleanup. */
export function attachFocusTrap(panel: HTMLElement): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    const candidates = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      isTabbable,
    );
    if (candidates.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = candidates[0];
    const last = candidates[candidates.length - 1];
    const activeElement = document.activeElement;
    if (activeElement === panel) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey) {
      if (activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  panel.addEventListener('keydown', onKeyDown);
  return () => panel.removeEventListener('keydown', onKeyDown);
}
