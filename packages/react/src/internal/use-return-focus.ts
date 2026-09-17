import { useCallback, useEffect, useRef, type RefObject } from 'react';

// `@lyra-ds/react` has no Node ambient types. The build replaces this development guard.
declare const process: { env: { NODE_ENV?: string } };

export interface UseReturnFocusOptions {
  open: boolean;
  returnFocusTo?: () => HTMLElement | null;
  panelRef: RefObject<HTMLElement | null>;
  overlayRef: RefObject<HTMLElement | null>;
  active?: boolean;
  closeAuthorityRef?: RefObject<boolean>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
}

export interface ReturnFocusOwner {
  captureOpener: (element: Element | null) => void;
}

function isProgrammaticallyFocusable(target: HTMLElement): boolean {
  if (target.matches('input[type="hidden" i]')) return false;
  const tabIndex = target.getAttribute('tabindex');
  if (tabIndex !== null && target.tabIndex === Number.parseInt(tabIndex, 10)) return true;
  if (target.isContentEditable && !target.parentElement?.isContentEditable) return true;
  if (
    target.matches(
      'a[href], area[href], button, select, textarea, iframe, object, embed, audio[controls], video[controls]',
    )
  ) {
    return true;
  }
  if (target.matches('input')) return true;
  if (target.localName !== 'summary') return false;

  const details = target.parentElement;
  return details?.localName === 'details' && details.querySelector(':scope > summary') === target;
}

function isEligibleReturnFocusTarget(
  target: HTMLElement | null,
  ownerDocument: Document,
  panel: HTMLElement | null,
  overlay: HTMLElement | null,
): target is HTMLElement {
  if (!target || target.ownerDocument !== ownerDocument || !target.isConnected) return false;
  if (target === ownerDocument.body || target === ownerDocument.documentElement) return false;
  if (panel?.contains(target) || overlay?.contains(target)) return false;
  if (target.matches(':disabled')) return false;
  if (target.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (!isProgrammaticallyFocusable(target)) return false;

  const style = ownerDocument.defaultView?.getComputedStyle(target);
  return (
    style?.display !== 'none' &&
    style?.visibility !== 'hidden' &&
    style?.visibility !== 'collapse' &&
    target.getClientRects().length > 0
  );
}

/**
 * Owns a modal's one-shot return-focus attempt for each accepted close transition.
 * Consumers choose a current logical target; this hook checks that it is safe to focus.
 */
export function useReturnFocus({
  open,
  returnFocusTo,
  panelRef,
  overlayRef,
  active = open,
  closeAuthorityRef,
  fallbackFocusRef,
}: UseReturnFocusOptions): ReturnFocusOwner {
  const previousOpenRef = useRef(open);
  const previousActiveRef = useRef(active);
  const openerRef = useRef<HTMLElement | null>(null);
  const capturedForCycleRef = useRef(false);
  const resolverRef = useRef(returnFocusTo);

  // Capture the resolver only after its render has committed; a suspended render must not
  // replace the callback used by the accepted close transition.
  useEffect(() => {
    resolverRef.current = returnFocusTo;
  }, [returnFocusTo]);

  const captureOpener = useCallback((element: Element | null) => {
    if (capturedForCycleRef.current) return;
    const elementConstructor = element?.ownerDocument.defaultView?.HTMLElement;
    openerRef.current =
      elementConstructor && element instanceof elementConstructor ? element : null;
    capturedForCycleRef.current = true;
  }, []);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    const wasActive = previousActiveRef.current;
    previousOpenRef.current = open;
    previousActiveRef.current = active;
    if (active || !wasActive) return;

    // Parent-driven branch deactivation is not an accepted close for this owner. It releases
    // this cycle's opener so a controlled child can capture a fresh one when its parent returns.
    if (open || !wasOpen || (closeAuthorityRef && !closeAuthorityRef.current)) {
      openerRef.current = null;
      capturedForCycleRef.current = false;
      return;
    }

    const ownerDocument = panelRef.current?.ownerDocument ?? openerRef.current?.ownerDocument;
    if (!ownerDocument) return;

    const resolverTarget = resolverRef.current?.() ?? null;
    const panel = panelRef.current;
    const overlay = overlayRef.current;
    const opener = openerRef.current;
    const fallback = fallbackFocusRef?.current ?? null;
    let target: HTMLElement | null = null;
    if (isEligibleReturnFocusTarget(resolverTarget, ownerDocument, panel, overlay)) {
      target = resolverTarget;
    } else if (isEligibleReturnFocusTarget(opener, ownerDocument, panel, overlay)) {
      target = opener;
    } else if (isEligibleReturnFocusTarget(fallback, ownerDocument, panel, overlay)) {
      target = fallback;
    }

    openerRef.current = null;
    capturedForCycleRef.current = false;
    if (target) {
      target.focus({ preventScroll: true });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Lyra modal could not restore focus after closing. Provide an eligible returnFocusTo target.',
      );
    }
  }, [active, closeAuthorityRef, fallbackFocusRef, open, overlayRef, panelRef]);

  return { captureOpener };
}
