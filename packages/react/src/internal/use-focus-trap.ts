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

type FocusBoundary = 'before' | 'after';

interface FocusBoundaryResource {
  element: HTMLSpanElement;
  activate: () => void;
  deactivate: () => void;
  dispose: () => void;
}

/**
 * Post-query visibility/interactivity filter (review fix). Drops elements that are
 * disabled, `hidden`, inside an `inert` or `aria-hidden="true"` subtree, or not actually
 * rendered — so none of them can be selected as a Tab wrap target.
 */
function isTabbable(el: HTMLElement): boolean {
  if (el.tabIndex < 0) return false;
  if (el.matches(':disabled')) return false;
  if (el.hasAttribute('hidden')) return false;
  if (el.closest('[inert]')) return false;
  if (el.closest('[aria-hidden="true"]')) return false;
  // Not rendered: no client rects (covers display:none ancestors and detached nodes).
  if (el.getClientRects().length === 0) return false;
  const style = getComputedStyle(el);
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  return true;
}

function getTabbableCandidates(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isTabbable);
}

function isProgrammaticallyFocusable(element: HTMLElement): boolean {
  if (element.matches('input[type="hidden" i]')) return false;

  const tabIndex = element.getAttribute('tabindex');
  if (tabIndex !== null && element.tabIndex === Number.parseInt(tabIndex, 10)) return true;
  if (element.isContentEditable && !element.parentElement?.isContentEditable) return true;
  if (
    element.matches(
      'a[href], area[href], button, select, textarea, iframe, object, embed, audio[controls], video[controls]',
    )
  ) {
    return true;
  }
  if (element.matches('input')) return true;
  if (element.localName !== 'summary') return false;

  const details = element.parentElement;
  return details?.localName === 'details' && details.querySelector(':scope > summary') === element;
}

function isVisibleAndEnabled(element: HTMLElement): boolean {
  if (!element.isConnected || element.matches(':disabled')) return false;
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (element.getClientRects().length === 0) return false;

  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  return (
    style?.display !== 'none' && style?.visibility !== 'hidden' && style?.visibility !== 'collapse'
  );
}

function isEligibleFocusableElement(element: HTMLElement): boolean {
  const { body, documentElement } = element.ownerDocument;
  if (element === body || element === documentElement) return false;
  return isVisibleAndEnabled(element) && isProgrammaticallyFocusable(element);
}

function isEligiblePanel(panel: HTMLElement): boolean {
  return isVisibleAndEnabled(panel);
}

function isFocusBoundary(element: HTMLElement): boolean {
  return element.hasAttribute('data-lyra-focus-trap-boundary');
}

function isOwnedByPanel(element: HTMLElement, panel: HTMLElement): boolean {
  if (element !== panel && !panel.contains(element)) return false;

  const modalBranch = element.closest<HTMLElement>('[role="dialog"][aria-modal="true"]');
  if (modalBranch) return modalBranch === panel;

  const dialogBranch = element.closest<HTMLElement>('[role="dialog"]');
  return !dialogBranch || dialogBranch === panel;
}

function getRecoveryCandidates(panel: HTMLElement, observedFocus?: HTMLElement): HTMLElement[] {
  const candidates = getTabbableCandidates(panel).filter((candidate) =>
    isOwnedByPanel(candidate, panel),
  );
  if (
    !observedFocus ||
    !isOwnedByPanel(observedFocus, panel) ||
    candidates.includes(observedFocus)
  ) {
    return candidates;
  }

  const nextCandidateIndex = candidates.findIndex((candidate) =>
    Boolean(observedFocus.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING),
  );
  candidates.splice(
    nextCandidateIndex === -1 ? candidates.length : nextCandidateIndex,
    0,
    observedFocus,
  );
  return candidates;
}

function createFocusBoundary(
  panelRef: RefObject<HTMLElement | null>,
  boundary: FocusBoundary,
  consumePendingBoundary: (boundary: FocusBoundary) => boolean,
): FocusBoundaryResource {
  const guard = document.createElement('span');
  guard.className = 'lyra-visually-hidden';
  guard.tabIndex = -1;
  guard.setAttribute('aria-hidden', 'true');
  guard.dataset.lyraFocusTrapBoundary = boundary;

  const onFocus = (): void => {
    if (!consumePendingBoundary(boundary)) return;

    const panel = panelRef.current;
    if (!panel) return;

    const candidates = getTabbableCandidates(panel);
    const target = boundary === 'before' ? candidates[candidates.length - 1] : candidates[0];
    (target ?? panel).focus();
  };
  guard.addEventListener('focus', onFocus);

  return {
    element: guard,
    activate: () => {
      guard.tabIndex = 0;
    },
    deactivate: () => {
      guard.tabIndex = -1;
    },
    dispose: () => {
      guard.removeEventListener('focus', onFocus);
      guard.remove();
    },
  };
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
 * - Native boundaries: visually-hidden, local focus guards surround the panel. They are only
 *   added to native navigation during their panel's current Tab keystroke, repairing a browser
 *   that skips all remaining ordinary controls without creating persistent keyboard stops.
 *
 * The listener is bound to the panel node, so it fires whether the panel itself or a descendant
 * holds focus (events bubble up to the panel).
 */
export function useFocusTrap(panelRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    if (!panel) return;
    const parent = panel.parentElement;
    if (!parent) return;

    let disposed = false;
    let lastOwnedFocus: HTMLElement | null = null;
    let lastCandidateOrder: HTMLElement[] = [];
    let lastCandidateOrdinal: number | undefined;
    let pendingBoundary: FocusBoundary | undefined;

    const captureOwnedFocus = (target: EventTarget | null): void => {
      const elementConstructor = panel.ownerDocument.defaultView?.HTMLElement;
      if (!elementConstructor || !(target instanceof elementConstructor)) return;
      if (isFocusBoundary(target) || !isOwnedByPanel(target, panel)) return;

      lastOwnedFocus = target;
      lastCandidateOrder = getRecoveryCandidates(panel, target);
      lastCandidateOrdinal = lastCandidateOrder.indexOf(target);
      if (lastCandidateOrdinal === -1) lastCandidateOrdinal = undefined;
    };

    const getEligibleActiveDestination = (): HTMLElement | null => {
      const activeElement = panel.ownerDocument.activeElement;
      const elementConstructor = panel.ownerDocument.defaultView?.HTMLElement;
      if (!elementConstructor || !(activeElement instanceof elementConstructor)) return null;
      if (isFocusBoundary(activeElement)) return activeElement;
      if (activeElement === panel) return isEligiblePanel(panel) ? panel : null;
      return isEligibleFocusableElement(activeElement) ? activeElement : null;
    };

    const focusRecoveryTarget = (): void => {
      if (disposed || !lastOwnedFocus || !isEligiblePanel(panel)) return;

      const lostFocus = lastOwnedFocus;
      const activeElement = panel.ownerDocument.activeElement;
      if (
        activeElement === lostFocus &&
        isOwnedByPanel(lostFocus, panel) &&
        isEligibleFocusableElement(lostFocus)
      ) {
        lastCandidateOrder = getRecoveryCandidates(panel, lostFocus);
        lastCandidateOrdinal = lastCandidateOrder.indexOf(lostFocus);
        return;
      }
      const activeDestination = getEligibleActiveDestination();
      if (activeDestination) {
        if (!isFocusBoundary(activeDestination) && !isOwnedByPanel(activeDestination, panel)) {
          lastOwnedFocus = null;
          lastCandidateOrder = [];
          lastCandidateOrdinal = undefined;
        }
        return;
      }

      if (isOwnedByPanel(lostFocus, panel) && isEligibleFocusableElement(lostFocus)) {
        lostFocus.focus({ preventScroll: true });
        captureOwnedFocus(panel.ownerDocument.activeElement);
        return;
      }

      const liveCandidates = getRecoveryCandidates(panel);
      const isEligibleOwnedCandidate = (candidate: HTMLElement): boolean =>
        liveCandidates.includes(candidate);
      let target: HTMLElement | undefined;
      if (lostFocus.isConnected && panel.contains(lostFocus)) {
        const currentOrder = getRecoveryCandidates(panel, lostFocus);
        const currentOrdinal = currentOrder.indexOf(lostFocus);
        if (currentOrdinal !== -1) {
          target = currentOrder.slice(currentOrdinal + 1).find(isEligibleOwnedCandidate);
          target ??= currentOrder.slice(0, currentOrdinal).reverse().find(isEligibleOwnedCandidate);
        }
      } else if (lastCandidateOrdinal !== undefined) {
        target = lastCandidateOrder.slice(lastCandidateOrdinal + 1).find(isEligibleOwnedCandidate);
        target ??= lastCandidateOrder
          .slice(0, lastCandidateOrdinal)
          .reverse()
          .find(isEligibleOwnedCandidate);
      }

      target ??= liveCandidates[Math.min(lastCandidateOrdinal ?? 0, liveCandidates.length - 1)];
      (target ?? panel).focus({ preventScroll: true });
      captureOwnedFocus(panel.ownerDocument.activeElement);
    };

    const deactivateBoundaries = (): void => {
      pendingBoundary = undefined;
      beforeBoundary.deactivate();
      afterBoundary.deactivate();
    };
    const consumePendingBoundary = (boundary: FocusBoundary): boolean => {
      if (pendingBoundary !== boundary) return false;
      deactivateBoundaries();
      return true;
    };
    const beforeBoundary = createFocusBoundary(panelRef, 'before', consumePendingBoundary);
    const afterBoundary = createFocusBoundary(panelRef, 'after', consumePendingBoundary);
    parent.insertBefore(beforeBoundary.element, panel);
    parent.insertBefore(afterBoundary.element, panel.nextSibling);
    const observer = new MutationObserver(focusRecoveryTarget);
    observer.observe(panel, { attributes: true, childList: true, subtree: true });
    captureOwnedFocus(panel.ownerDocument.activeElement);

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Tab' || event.defaultPrevented) return;

      const node = panelRef.current;
      if (!node) return;

      pendingBoundary = event.shiftKey ? 'before' : 'after';
      (pendingBoundary === 'before' ? beforeBoundary : afterBoundary).activate();

      // Re-read the live panel node each keydown (content may have changed since bind).
      const candidates = getTabbableCandidates(node);

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

    function onKeyUp(event: KeyboardEvent): void {
      if (event.key === 'Tab') deactivateBoundaries();
    }

    const onFocusOut = (event: FocusEvent): void => {
      const elementConstructor = panel.ownerDocument.defaultView?.HTMLElement;
      const relatedTarget = event.relatedTarget;
      if (
        elementConstructor &&
        relatedTarget instanceof elementConstructor &&
        !isFocusBoundary(relatedTarget) &&
        !isOwnedByPanel(relatedTarget, panel) &&
        isEligibleFocusableElement(relatedTarget)
      ) {
        lastOwnedFocus = null;
        lastCandidateOrder = [];
        lastCandidateOrdinal = undefined;
      }
      if (
        event.relatedTarget !== beforeBoundary.element &&
        event.relatedTarget !== afterBoundary.element
      ) {
        deactivateBoundaries();
      }
    };

    function onFocusIn(event: FocusEvent): void {
      captureOwnedFocus(event.target);
    }

    panel.addEventListener('keydown', onKeyDown);
    panel.addEventListener('keyup', onKeyUp);
    panel.addEventListener('focusout', onFocusOut);
    panel.addEventListener('focusin', onFocusIn);
    return () => {
      disposed = true;
      observer.disconnect();
      panel.removeEventListener('keydown', onKeyDown);
      panel.removeEventListener('keyup', onKeyUp);
      panel.removeEventListener('focusout', onFocusOut);
      panel.removeEventListener('focusin', onFocusIn);
      beforeBoundary.dispose();
      afterBoundary.dispose();
    };
  }, [panelRef, active]);
}
