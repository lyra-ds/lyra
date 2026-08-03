import { useEffect, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

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
 */
export function useFlipPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popRef: RefObject<HTMLElement | null>,
  gap = DEFAULT_GAP,
): FlipPlacement {
  const [placement, setPlacement] = useState<FlipPlacement>({ side: 'down', align: 'start' });

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPlacement({ side: 'down', align: 'start' });
      return;
    }

    const measure = (): void => {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop) return;
      const rect = anchor.getBoundingClientRect();
      const height = pop.offsetHeight;
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
      setPlacement({
        side: height <= roomBelow || roomAbove <= roomBelow ? 'down' : 'up',
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
    return () => {
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [open, anchorRef, popRef, gap]);

  return placement;
}
