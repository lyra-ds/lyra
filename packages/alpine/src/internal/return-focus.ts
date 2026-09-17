export interface ReturnFocusOptions {
  ownerDocument: Document;
  opener: Element | null;
  panel: HTMLElement | null;
  overlay: HTMLElement | null;
  returnFocusTo?: () => Element | null;
}

function isProgrammaticallyFocusable(target: HTMLElement): boolean {
  if (target.matches('input[type="hidden" i]')) return false;

  const tabIndex = target.getAttribute('tabindex');
  if (tabIndex !== null && target.tabIndex === Number.parseInt(tabIndex, 10)) return true;
  if (target.isContentEditable && !target.parentElement?.isContentEditable) return true;
  if (
    target.matches(
      'a[href], area[href], button, select, textarea, iframe, object, embed, audio[controls], video[controls], input',
    )
  ) {
    return true;
  }
  if (target.localName !== 'summary') return false;

  const details = target.parentElement;
  return details?.localName === 'details' && details.querySelector(':scope > summary') === target;
}

function asOwnerDocumentHTMLElement(
  target: Element | null,
  ownerDocument: Document,
): HTMLElement | null {
  const HTMLElementConstructor = ownerDocument.defaultView?.HTMLElement;
  return HTMLElementConstructor && target instanceof HTMLElementConstructor ? target : null;
}

function isEligibleReturnFocusTarget(
  target: Element | null,
  ownerDocument: Document,
  panel: HTMLElement | null,
  overlay: HTMLElement | null,
): target is HTMLElement {
  const element = asOwnerDocumentHTMLElement(target, ownerDocument);
  if (!element || element.ownerDocument !== ownerDocument || !element.isConnected) return false;
  if (element === ownerDocument.body || element === ownerDocument.documentElement) return false;
  if (panel?.contains(element) || overlay?.contains(element)) return false;
  if (element.matches(':disabled')) return false;
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (!isProgrammaticallyFocusable(element)) return false;

  const style = ownerDocument.defaultView?.getComputedStyle(element);
  return (
    style?.display !== 'none' &&
    style?.visibility !== 'hidden' &&
    style?.visibility !== 'collapse' &&
    element.getClientRects().length > 0
  );
}

/** Resolves and restores a modal's current logical focus destination after an accepted close. */
export function restoreReturnFocus({
  ownerDocument,
  opener,
  panel,
  overlay,
  returnFocusTo,
}: ReturnFocusOptions): void {
  const resolved = returnFocusTo?.() ?? null;
  if (isEligibleReturnFocusTarget(resolved, ownerDocument, panel, overlay)) {
    resolved.focus({ preventScroll: true });
    return;
  }
  if (isEligibleReturnFocusTarget(opener, ownerDocument, panel, overlay)) {
    opener.focus();
  }
}
