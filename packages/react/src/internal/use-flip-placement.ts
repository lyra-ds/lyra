import { useEffect, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Reveal a popup item in layout coordinates, unaffected by entrance transforms. */
export function focusPopupItem(
  popup: HTMLElement | null,
  item: HTMLElement | null | undefined,
): void {
  if (!item) return;
  if (popup) {
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < popup.scrollTop) popup.scrollTop = top;
    else if (bottom > popup.scrollTop + popup.clientHeight) {
      popup.scrollTop = bottom - popup.clientHeight;
    }
  }
  item.focus({ preventScroll: true });
}

/** The side and alignment that keep a popup within the visual viewport when possible. */
export interface FlipPlacement {
  /** Which vertical side of the anchor a popup is rendered on. */
  side: 'down' | 'up';
  /** Which horizontal edge of the anchor the popup is aligned to. */
  align: 'start' | 'end';
}

/** Default offset used by the existing popup recipes. */
const DEFAULT_GAP = 6;

/**
 * `useLayoutEffect` warns when it runs on the server. Popups only ever measure in a browser, so
 * fall back to `useEffect` during SSR — the returned placement stays `"down"` there either way.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
  // scrollHeight preserves the popup's un-clipped content extent after a prior measurement has
  // applied max-height. Include borders so the viewport comparison uses the rendered box.
  return Math.max(popup.offsetHeight, popup.scrollHeight + popup.offsetHeight - popup.clientHeight);
}

function setBoundedHeight(
  popup: HTMLElement,
  availableHeight: number,
  inlineGeometry: PopupInlineGeometry,
  boundState: PopupBoundState,
): void {
  // Before we add a constraint, respect a consumer's existing rendered geometry. Once we have
  // added one, keep comparing against the content extent so viewport changes can update or remove
  // our own constraint.
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

/**
 * Chooses the side an absolutely positioned popup opens to, so it does not push the page into a
 * scroll it did not need.
 *
 * Stays `"down"` — the recipe's default — unless the popup does not fit below the anchor AND there
 * is more room above it. Measured when `open` flips, then again while open on scroll (captured, so
 * scrollable ancestors count) and resize.
 *
 * @param open Whether the popup is currently rendered. Placement resets to down/start when closed.
 * @param anchorRef The element the popup is positioned against — usually the trigger.
 * @param popRef The popup itself. Must be in the DOM whenever `open` is true.
 * @param gap The rendered gap between anchor and popup, in CSS pixels. Default: `6`.
 * @param side A caller-selected vertical side. Omit for automatic placement.
 */
export function useFlipPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popRef: RefObject<HTMLElement | null>,
  gap = DEFAULT_GAP,
  side?: VerticalSide,
  bound = false,
): FlipPlacement {
  const [placement, setPlacement] = useState<FlipPlacement>({ side: 'down', align: 'start' });

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPlacement({ side: 'down', align: 'start' });
      return;
    }

    let popup: HTMLElement | null = null;
    let inlineGeometry: PopupInlineGeometry | null = null;
    const boundState: PopupBoundState = { constrained: false };

    const measure = (): void => {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop) return;
      if (popup !== pop) {
        popup = pop;
        inlineGeometry = {
          boxSizing: pop.style.boxSizing,
          maxHeight: pop.style.maxHeight,
          overflowY: pop.style.overflowY,
          overscrollBehaviorY: pop.style.overscrollBehaviorY,
        };
      }
      const rect = anchor.getBoundingClientRect();
      // Owners that do not opt into bounded scrolling retain their original placement
      // measurement and lifecycle (notably Combobox's internally scrolling list).
      const height = bound && boundState.constrained ? intrinsicHeight(pop) : pop.offsetHeight;
      const width = pop.offsetWidth;
      // getBoundingClientRect is relative to the layout viewport, which on iOS Safari extends
      // behind the dynamic toolbar and ignores pinch zoom. Measure against the visual viewport
      // instead, or the popup "fits" below while being off-screen for the reader.
      const vv = window.visualViewport;
      const top = vv ? vv.offsetTop : 0;
      const bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const left = vv ? vv.offsetLeft : 0;
      const right = vv ? vv.offsetLeft + vv.width : window.innerWidth;
      const roomBelow = bottom - rect.bottom - gap;
      const roomAbove = rect.top - top - gap;
      const roomRight = right - rect.left;
      const roomLeft = rect.right - left;
      const resolvedSide = side ?? (height <= roomBelow || roomAbove <= roomBelow ? 'down' : 'up');
      if (bound && inlineGeometry) {
        setBoundedHeight(
          pop,
          resolvedSide === 'down' ? roomBelow : roomAbove,
          inlineGeometry,
          boundState,
        );
      }
      setPlacement({
        side: resolvedSide,
        align: width <= roomRight || roomLeft <= roomRight ? 'start' : 'end',
      });
    };

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
    const anchor = anchorRef.current;
    const pop = popRef.current;
    if (resizeObserver && anchor) resizeObserver.observe(anchor);
    if (resizeObserver && pop) resizeObserver.observe(pop);
    return () => {
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
      resizeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
      if (bound && popup && inlineGeometry) restoreInlineGeometry(popup, inlineGeometry);
    };
  }, [open, anchorRef, popRef, gap, side, bound]);

  return placement;
}
