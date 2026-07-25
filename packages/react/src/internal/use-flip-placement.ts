import { useEffect, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Which side of the anchor a popup is rendered on. */
export type FlipPlacement = 'down' | 'up';

/** Matches the `calc(100% + 6px)` offset the popup recipes use. */
const GAP = 6;

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
 * @param open Whether the popup is currently rendered. Placement resets to `"down"` when closed.
 * @param anchorRef The element the popup is positioned against — usually the trigger.
 * @param popRef The popup itself. Must be in the DOM whenever `open` is true.
 */
export function useFlipPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popRef: RefObject<HTMLElement | null>,
): FlipPlacement {
  const [placement, setPlacement] = useState<FlipPlacement>('down');

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPlacement('down');
      return;
    }

    const measure = (): void => {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop) return;
      const rect = anchor.getBoundingClientRect();
      const height = pop.offsetHeight;
      const roomBelow = window.innerHeight - rect.bottom - GAP;
      const roomAbove = rect.top - GAP;
      setPlacement(height <= roomBelow || roomAbove <= roomBelow ? 'down' : 'up');
    };

    measure();
    window.addEventListener('scroll', measure, { capture: true, passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
    };
  }, [open, anchorRef, popRef]);

  return placement;
}
