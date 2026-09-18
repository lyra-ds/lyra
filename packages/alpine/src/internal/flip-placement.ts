/** The side and alignment that keep a popup within the visual viewport when possible. */
export interface FlipPlacement {
  /** Which vertical side of the anchor a popup is rendered on. */
  side: 'down' | 'up';
  /** Which horizontal edge of the anchor the popup is aligned to. */
  align: 'start' | 'end';
}

/** Default offset used by the existing popup recipes. */
const DEFAULT_GAP = 6;

type VerticalSide = FlipPlacement['side'];

interface PopupInlineGeometry {
  boxSizing: string;
  maxHeight: string;
  overflowY: string;
  overscrollBehaviorY: string;
}

interface PopupBoundState {
  constrained: boolean;
}

function intrinsicHeight(popup: HTMLElement): number {
  return Math.max(popup.offsetHeight, popup.scrollHeight + popup.offsetHeight - popup.clientHeight);
}

function setBoundedHeight(
  popup: HTMLElement,
  availableHeight: number,
  inlineGeometry: PopupInlineGeometry,
  boundState: PopupBoundState,
): void {
  // Preserve the consumer's fitting geometry until this helper has actually added a constraint.
  // Afterwards use the content extent so a viewport resize can update or remove that constraint.
  const shouldBound =
    (boundState.constrained ? intrinsicHeight(popup) : popup.offsetHeight) > availableHeight;
  if (!shouldBound) {
    restoreInlineGeometry(popup, inlineGeometry);
    boundState.constrained = false;
    return;
  }
  boundState.constrained = true;
  const maxHeight = `${Math.max(0, availableHeight)}px`;
  const overflowY = 'auto';
  const overscrollBehaviorY = 'contain';
  const boxSizing = 'border-box';

  if (popup.style.maxHeight !== maxHeight) popup.style.maxHeight = maxHeight;
  if (popup.style.overflowY !== overflowY) popup.style.overflowY = overflowY;
  if (popup.style.overscrollBehaviorY !== overscrollBehaviorY) {
    popup.style.overscrollBehaviorY = overscrollBehaviorY;
  }
  if (popup.style.boxSizing !== boxSizing) popup.style.boxSizing = boxSizing;
}

function restoreInlineGeometry(popup: HTMLElement, geometry: PopupInlineGeometry): void {
  popup.style.boxSizing = geometry.boxSizing;
  popup.style.maxHeight = geometry.maxHeight;
  popup.style.overflowY = geometry.overflowY;
  popup.style.overscrollBehaviorY = geometry.overscrollBehaviorY;
}

/** Measure the placement that gives an anchored popup the most usable viewport room. */
export function measureFlipPlacement(
  anchor: HTMLElement,
  popup: HTMLElement,
  gap = DEFAULT_GAP,
  side?: VerticalSide,
  bound = false,
  inlineGeometry = snapshotInlineGeometry(popup),
  boundState: PopupBoundState = { constrained: false },
): FlipPlacement {
  const rect = anchor.getBoundingClientRect();
  // Non-opted owners retain the original offset-height placement measurement.
  const height = bound && boundState.constrained ? intrinsicHeight(popup) : popup.offsetHeight;
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

  const resolvedSide = side ?? (height <= roomBelow || roomAbove <= roomBelow ? 'down' : 'up');
  if (bound) {
    setBoundedHeight(
      popup,
      resolvedSide === 'down' ? roomBelow : roomAbove,
      inlineGeometry,
      boundState,
    );
  }

  return {
    side: resolvedSide,
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
  side?: VerticalSide,
  bound = false,
): () => void {
  const inlineGeometry = snapshotInlineGeometry(popup);
  const boundState: PopupBoundState = { constrained: false };
  const measure = (): void =>
    onPlacement(measureFlipPlacement(anchor, popup, gap, side, bound, inlineGeometry, boundState));

  measure();
  window.addEventListener('scroll', measure, { capture: true, passive: true });
  window.addEventListener('resize', measure);
  // The visual viewport changes without a window resize: toolbar collapse, pinch zoom, and the
  // on-screen keyboard opening under a focused search input.
  window.visualViewport?.addEventListener('resize', measure);
  window.visualViewport?.addEventListener('scroll', measure);
  let resizeFrame = 0;
  const resizeObserver = bound
    ? new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(measure);
      })
    : null;
  if (resizeObserver) {
    resizeObserver.observe(anchor);
    resizeObserver.observe(popup);
  }

  return () => {
    window.removeEventListener('scroll', measure, { capture: true });
    window.removeEventListener('resize', measure);
    window.visualViewport?.removeEventListener('resize', measure);
    window.visualViewport?.removeEventListener('scroll', measure);
    resizeObserver?.disconnect();
    cancelAnimationFrame(resizeFrame);
    if (bound) restoreInlineGeometry(popup, inlineGeometry);
  };
}

function snapshotInlineGeometry(popup: HTMLElement): PopupInlineGeometry {
  return {
    boxSizing: popup.style.boxSizing,
    maxHeight: popup.style.maxHeight,
    overflowY: popup.style.overflowY,
    overscrollBehaviorY: popup.style.overscrollBehaviorY,
  };
}
