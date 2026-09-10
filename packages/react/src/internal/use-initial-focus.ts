import { useCallback, useEffect, useRef, type RefObject } from 'react';

const TASK_CONTROL_SELECTOR = 'a[href],button,input,select,textarea';
const INITIAL_FOCUS_SELECTOR = `${TASK_CONTROL_SELECTOR},[tabindex]`;

export interface UseInitialFocusOptions {
  initialFocusTo?: () => HTMLElement | null;
  panelRef: RefObject<HTMLElement | null>;
  captureOpener: (element: Element | null) => void;
  defaultFocusTo?: () => HTMLElement | null;
}

export interface InitialFocusOwner {
  focusInitial: () => void;
  resetInitialFocus: () => void;
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

export function isEligibleInitialFocusTarget(
  target: HTMLElement | null,
  panel: HTMLElement,
): target is HTMLElement {
  const ownerDocument = panel.ownerDocument;
  const HTMLElementConstructor = ownerDocument.defaultView?.HTMLElement;
  if (!HTMLElementConstructor || !(target instanceof HTMLElementConstructor)) return false;
  if (target.ownerDocument !== ownerDocument || !target.isConnected) return false;
  if (target === ownerDocument.body || target === ownerDocument.documentElement) return false;
  if (!panel.contains(target)) return false;
  if (target.closest('[role="dialog"][aria-modal="true"]') !== panel) return false;
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

export function getInitialFocusTarget(
  panel: HTMLElement,
  initialFocusTo?: () => HTMLElement | null,
  defaultFocusTo?: () => HTMLElement | null,
): HTMLElement {
  if (initialFocusTo) {
    const declaredTarget = initialFocusTo();
    return isEligibleInitialFocusTarget(declaredTarget, panel) ? declaredTarget : panel;
  }

  const defaultTarget = defaultFocusTo?.() ?? null;
  if (isEligibleInitialFocusTarget(defaultTarget, panel)) return defaultTarget;

  for (const candidate of panel.querySelectorAll<HTMLElement>(INITIAL_FOCUS_SELECTOR)) {
    const isDefaultControl = candidate.tabIndex >= 0 || candidate.matches(TASK_CONTROL_SELECTOR);
    if (isDefaultControl && isEligibleInitialFocusTarget(candidate, panel)) return candidate;
  }
  return panel;
}

export function useInitialFocus({
  initialFocusTo,
  panelRef,
  captureOpener,
  defaultFocusTo,
}: UseInitialFocusOptions): InitialFocusOwner {
  const completedRef = useRef(false);
  const resolverRef = useRef(initialFocusTo);

  useEffect(() => {
    resolverRef.current = initialFocusTo;
  }, [initialFocusTo]);

  const focusInitial = useCallback(() => {
    if (completedRef.current) return;
    const panel = panelRef.current;
    if (!panel) return;

    completedRef.current = true;
    captureOpener(panel.ownerDocument.activeElement);
    try {
      getInitialFocusTarget(panel, resolverRef.current, defaultFocusTo).focus();
    } catch (error) {
      panel.focus();
      throw error;
    }
  }, [captureOpener, defaultFocusTo, panelRef]);

  const resetInitialFocus = useCallback(() => {
    completedRef.current = false;
  }, []);

  return { focusInitial, resetInitialFocus };
}
