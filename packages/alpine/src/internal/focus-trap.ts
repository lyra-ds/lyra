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

type FocusBoundary = 'before' | 'after';

interface FocusBoundaryResource {
  element: HTMLSpanElement;
  activate(): void;
  deactivate(): void;
  dispose(): void;
}

function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.hasAttribute('hidden')) return false;
  if (element.closest('[inert]')) return false;
  if (element.closest('[aria-hidden="true"]')) return false;
  if (element.getClientRects().length === 0) return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (!style) return false;
  return style.visibility !== 'hidden' && style.visibility !== 'collapse';
}

function getTabbableCandidates(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isTabbable);
}

function createFocusBoundary(
  ownerDocument: Document,
  boundary: FocusBoundary,
  consumePendingBoundary: (boundary: FocusBoundary) => boolean,
  panel: HTMLElement,
): FocusBoundaryResource {
  const element = ownerDocument.createElement('span');
  element.className = 'lyra-visually-hidden';
  element.tabIndex = -1;
  element.setAttribute('aria-hidden', 'true');
  element.dataset.lyraFocusTrapBoundary = boundary;

  const onFocus = (): void => {
    if (!consumePendingBoundary(boundary)) return;

    const candidates = getTabbableCandidates(panel);
    const target = boundary === 'before' ? candidates.at(-1) : candidates[0];
    (target ?? panel).focus();
  };
  element.addEventListener('focus', onFocus);

  return {
    element,
    activate() {
      element.tabIndex = 0;
    },
    deactivate() {
      element.tabIndex = -1;
    },
    dispose() {
      element.removeEventListener('focus', onFocus);
      element.remove();
    },
  };
}

/** Bind a live, panel-scoped Tab trap and return the listener cleanup. */
export function attachFocusTrap(panel: HTMLElement): () => void {
  const parent = panel.parentNode;
  if (!parent) return () => undefined;

  let pendingBoundary: FocusBoundary | undefined;
  const beforeBoundary = createFocusBoundary(
    panel.ownerDocument,
    'before',
    consumePendingBoundary,
    panel,
  );
  const afterBoundary = createFocusBoundary(
    panel.ownerDocument,
    'after',
    consumePendingBoundary,
    panel,
  );

  function deactivateBoundaries(): void {
    pendingBoundary = undefined;
    beforeBoundary.deactivate();
    afterBoundary.deactivate();
  }

  function consumePendingBoundary(boundary: FocusBoundary): boolean {
    if (pendingBoundary !== boundary) return false;
    deactivateBoundaries();
    return true;
  }

  parent.insertBefore(beforeBoundary.element, panel);
  parent.insertBefore(afterBoundary.element, panel.nextSibling);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || event.defaultPrevented) return;

    const candidates = getTabbableCandidates(panel);
    if (candidates.length === 0) {
      event.preventDefault();
      deactivateBoundaries();
      panel.focus();
      return;
    }

    const first = candidates[0];
    const last = candidates[candidates.length - 1];
    const activeElement = panel.ownerDocument.activeElement;
    if (activeElement === panel) {
      event.preventDefault();
      deactivateBoundaries();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey) {
      if (activeElement === first) {
        event.preventDefault();
        deactivateBoundaries();
        last.focus();
        return;
      }
    } else if (activeElement === last) {
      event.preventDefault();
      deactivateBoundaries();
      first.focus();
      return;
    }

    pendingBoundary = event.shiftKey ? 'before' : 'after';
    (pendingBoundary === 'before' ? beforeBoundary : afterBoundary).activate();
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') deactivateBoundaries();
  };

  const onFocusOut = (event: FocusEvent): void => {
    if (
      event.relatedTarget !== beforeBoundary.element &&
      event.relatedTarget !== afterBoundary.element
    ) {
      deactivateBoundaries();
    }
  };

  panel.addEventListener('keydown', onKeyDown);
  panel.addEventListener('keyup', onKeyUp);
  panel.addEventListener('focusout', onFocusOut);
  return () => {
    deactivateBoundaries();
    panel.removeEventListener('keydown', onKeyDown);
    panel.removeEventListener('keyup', onKeyUp);
    panel.removeEventListener('focusout', onFocusOut);
    beforeBoundary.dispose();
    afterBoundary.dispose();
  };
}
