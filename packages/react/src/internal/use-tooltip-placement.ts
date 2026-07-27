import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Side of the target a tooltip is drawn on. */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Distance the stylesheet leaves between the target and the bubble. */
const OFFSET = 6;

/**
 * Keep a tooltip on the requested side unless it would be clipped, then use the opposite side.
 *
 * The bubble is a `::after` pseudo-element, so there is no node to measure — its used size comes
 * from `getComputedStyle(node, '::after')`, which reports real pixels once the element is laid out.
 *
 * Space is measured against `visualViewport`, never `window.innerHeight`: on iOS the layout viewport
 * extends behind the dynamic toolbar and ignores pinch zoom, so a bubble can "fit" on paper while
 * sitting off-screen. That mistake cost a round on the popovers; the same rule applies here.
 *
 * The flip is one-way — it never moves off a side that fits, so a tooltip does not oscillate as the
 * page scrolls.
 */
export function useTooltipPlacement(
  open: boolean,
  requested: TooltipPlacement,
  ref: RefObject<HTMLElement | null>,
): TooltipPlacement {
  const [placement, setPlacement] = useState<TooltipPlacement>(requested);
  const [previousOpen, setPreviousOpen] = useState(open);

  // Reset to the requested side on close by adjusting state during render, not from an effect:
  // a synchronous setState inside an effect body causes a cascading render, and `usePresence`
  // already establishes this pattern in the package.
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (!open) setPlacement(requested);
  }

  useEffect(() => {
    if (!open) return;

    const measure = (): void => {
      const node = ref.current;
      if (!node) return;

      const bubble = getComputedStyle(node, '::after');
      const width = parseFloat(bubble.width) || 0;
      const height = parseFloat(bubble.height) || 0;
      const box = node.getBoundingClientRect();
      const view = window.visualViewport;
      const viewTop = view?.offsetTop ?? 0;
      const viewLeft = view?.offsetLeft ?? 0;
      const viewHeight = view?.height ?? window.innerHeight;
      const viewWidth = view?.width ?? window.innerWidth;

      const room: Record<TooltipPlacement, number> = {
        top: box.top - viewTop,
        bottom: viewTop + viewHeight - box.bottom,
        left: box.left - viewLeft,
        right: viewLeft + viewWidth - box.right,
      };
      const needed = requested === 'top' || requested === 'bottom' ? height : width;
      const opposite = OPPOSITE[requested];

      const fits = room[requested] >= needed + OFFSET;
      setPlacement(fits || room[opposite] <= room[requested] ? requested : opposite);
    };

    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
    };
  }, [open, requested, ref]);

  return placement;
}
