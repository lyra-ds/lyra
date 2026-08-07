/** The side and alignment that keep a popup within the visual viewport when possible. */
export interface FlipPlacement {
  /** Which vertical side of the anchor a popup is rendered on. */
  side: 'down' | 'up';
  /** Which horizontal edge of the anchor the popup is aligned to. */
  align: 'start' | 'end';
}

/** Default offset used by the existing popup recipes. */
const DEFAULT_GAP = 6;

/** Measure the placement that gives an anchored popup the most usable viewport room. */
export function measureFlipPlacement(
  anchor: HTMLElement,
  popup: HTMLElement,
  gap = DEFAULT_GAP,
): FlipPlacement {
  const rect = anchor.getBoundingClientRect();
  const height = popup.offsetHeight;
  const width = popup.offsetWidth;
  // getBoundingClientRect is relative to the layout viewport, which on iOS Safari extends
  // behind the dynamic toolbar and ignores pinch zoom. Measure against the visual viewport
  // instead, or the popup "fits" below while being off-screen for the reader.
  const viewport = window.visualViewport;
  const top = viewport ? viewport.offsetTop : 0;
  const bottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
  const left = viewport ? viewport.offsetLeft : 0;
  const right = viewport ? viewport.offsetLeft + viewport.width : window.innerWidth;
  const roomBelow = bottom - rect.bottom - gap;
  const roomAbove = rect.top - top - gap;
  const roomRight = right - rect.left;
  const roomLeft = rect.right - left;

  return {
    side: height <= roomBelow || roomAbove <= roomBelow ? 'down' : 'up',
    align: width <= roomRight || roomLeft <= roomRight ? 'start' : 'end',
  };
}

/**
 * Measure immediately, then keep a rendered popup placed while its viewport changes.
 * Returns the cleanup function required when the popup closes or its Alpine scope is destroyed.
 */
export function observeFlipPlacement(
  anchor: HTMLElement,
  popup: HTMLElement,
  onPlacement: (placement: FlipPlacement) => void,
  gap = DEFAULT_GAP,
): () => void {
  const measure = (): void => onPlacement(measureFlipPlacement(anchor, popup, gap));

  measure();
  window.addEventListener('scroll', measure, { capture: true, passive: true });
  window.addEventListener('resize', measure);
  // The visual viewport changes without a window resize: toolbar collapse, pinch zoom, and the
  // on-screen keyboard opening under a focused search input.
  window.visualViewport?.addEventListener('resize', measure);
  window.visualViewport?.addEventListener('scroll', measure);

  return () => {
    window.removeEventListener('scroll', measure, { capture: true });
    window.removeEventListener('resize', measure);
    window.visualViewport?.removeEventListener('resize', measure);
    window.visualViewport?.removeEventListener('scroll', measure);
  };
}
