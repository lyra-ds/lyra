import { useEffect, type RefObject } from 'react';

/**
 * Raw candidate selector. The result is refined by {@link isTabbable} because a bare
 * selector can still match invisible/inert elements that must never become wrap targets.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Post-query visibility/interactivity filter (review fix). Drops elements that are
 * disabled, `hidden`, inside an `inert` or `aria-hidden="true"` subtree, or not actually
 * rendered — so none of them can be selected as a Tab wrap target.
 */
function isTabbable(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled')) return false;
  if (el.hasAttribute('hidden')) return false;
  if (el.closest('[inert]')) return false;
  if (el.closest('[aria-hidden="true"]')) return false;
  // Not rendered: no client rects (covers display:none ancestors and detached nodes).
  if (el.getClientRects().length === 0) return false;
  const style = getComputedStyle(el);
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  return true;
}

/**
 * Hand-rolled focus trap for the APG Dialog (Modal) pattern (D-15). While `active`, Tab and
 * Shift+Tab wrap around the focusable elements found INSIDE `panelRef.current` — the portal
 * subtree — never a React-tree ancestor (Pitfall 8).
 *
 * Key contracts:
 * - The focusable list is queried on EVERY keydown from `panelRef.current` (never cached), so
 *   content mounted/unmounted while the dialog is open is always seen, then filtered through
 *   {@link isTabbable}.
 * - Edge wrap: Tab on the last candidate focuses the first; Shift+Tab on the first focuses the last.
 * - ZERO-candidate containment: when the filtered list is empty (e.g. a plain-text Dialog with no
 *   close button — both valid per the handoff contract), Tab and Shift+Tab are `preventDefault`-ed
 *   and focus is kept on the panel itself. Callers guarantee the panel is programmatically
 *   focusable via `tabIndex={-1}` (plan 03-07). Focus can never escape to the background.
 * - Panel-focused routing: when the panel element itself holds focus and candidates exist, Tab
 *   focuses the first candidate and Shift+Tab the last.
 *
 * The listener is bound to the panel node, so it fires whether the panel itself or a descendant
 * holds focus (events bubble up to the panel).
 */
export function useFocusTrap(panelRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    if (!panel) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return;

      // Re-read the live panel node each keydown (content may have changed since bind).
      const node = panelRef.current;
      if (!node) return;

      const candidates = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(isTabbable);

      // Zero tabbable candidates: contain focus on the panel itself.
      if (candidates.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }

      const first = candidates[0];
      const last = candidates[candidates.length - 1];
      const activeEl = document.activeElement;

      // Panel itself focused: route into the candidate list.
      if (activeEl === node) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      // Edge wrap.
      if (event.shiftKey) {
        if (activeEl === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    }

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [panelRef, active]);
}
