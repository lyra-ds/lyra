import { useEffect, useLayoutEffect, useState } from 'react';
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
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Prefer the requested side, then flip when the tooltip would be clipped.
 *
 * The default bubble is a `::after` pseudo-element, measured through its computed style.
 * Clipping escape measures a real top-layer descendant, tries perpendicular sides when needed,
 * and bounds scrolling to the available space so the target remains reachable.
 *
 * Space is measured against `visualViewport`, never `window.innerHeight`: on iOS the layout viewport
 * extends behind the dynamic toolbar and ignores pinch zoom, so a bubble can "fit" on paper while
 * sitting off-screen. That mistake cost a round on the popovers; the same rule applies here.
 *
 * A fitting requested side takes precedence on each measurement.
 */
export function useTooltipPlacement(
  open: boolean,
  requested: TooltipPlacement,
  ref: RefObject<HTMLElement | null>,
  surfaceRef?: RefObject<HTMLElement | null>,
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
    if (!open || surfaceRef) return;

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
  }, [open, requested, ref, surfaceRef]);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    const surface = surfaceRef?.current;
    const window = node?.ownerDocument.defaultView;
    if (!open || !node || !surface || !window) return;

    // A manual top-layer descendant escapes clipping without losing CSS inheritance or adding
    // focus, light-dismiss, or Escape ownership to the existing Tooltip coordinator.
    surface.showPopover();
    let frame = 0;
    const measure = (): void => {
      if (!node.isConnected || !surface.isConnected) return;
      const view = window.visualViewport;
      const left = (view?.offsetLeft ?? 0) + 8;
      const top = (view?.offsetTop ?? 0) + 8;
      const width = Math.max(0, (view?.width ?? window.innerWidth) - 16);
      const height = Math.max(0, (view?.height ?? window.innerHeight) - 16);
      const setLength = (
        property: 'maxWidth' | 'maxHeight' | 'left' | 'top',
        value: number,
      ): void => {
        const next = `${value}px`;
        if (surface.style[property] !== next) surface.style[property] = next;
      };
      const box = node.getBoundingClientRect();
      const room = {
        top: box.top - top,
        bottom: top + height - box.bottom,
        left: box.left - left,
        right: left + width - box.right,
      };
      const opposite = OPPOSITE[requested];
      // Wrap beside a rail before falling back over its adjacent controls. A column narrower
      // than the trigger is better served by another side, especially in tiny viewports.
      const horizontal =
        requested === 'left' || requested === 'right'
          ? [requested, opposite].find(
              (candidate) => room[candidate] - OFFSET >= Math.min(box.width, width),
            )
          : undefined;
      setLength('maxWidth', horizontal ? Math.min(width, room[horizontal] - OFFSET) : width);
      let bubble = surface.getBoundingClientRect();
      const naturalHeight = surface.scrollHeight + surface.offsetHeight - surface.clientHeight;
      const alternatives: TooltipPlacement[] =
        requested === 'top' || requested === 'bottom' ? ['right', 'left'] : ['bottom', 'top'];
      const side =
        [requested, opposite, ...alternatives].find(
          (candidate) =>
            room[candidate] >=
            (candidate === 'top' || candidate === 'bottom' ? naturalHeight : bubble.width) + OFFSET,
        ) ?? (room.top > room.bottom ? 'top' : 'bottom');
      // Keep the trigger reachable even when long content must scroll on the available side.
      setLength(
        'maxHeight',
        Math.max(
          0,
          Math.min(height, side === 'top' || side === 'bottom' ? room[side] - OFFSET : height),
        ),
      );
      bubble = surface.getBoundingClientRect();
      const x =
        side === 'left'
          ? box.left - bubble.width - OFFSET
          : side === 'right'
            ? box.right + OFFSET
            : box.left + (box.width - bubble.width) / 2;
      const y =
        side === 'top'
          ? box.top - bubble.height - OFFSET
          : side === 'bottom'
            ? box.bottom + OFFSET
            : box.top + (box.height - bubble.height) / 2;
      setLength('left', Math.max(left, Math.min(x, left + width - bubble.width)));
      setLength('top', Math.max(top, Math.min(y, top + height - bubble.height)));
      setPlacement((current) => (current === side ? current : side));
      // While open, CSS/font changes and moving or transformed ancestors can alter geometry
      // without a resize or DOM mutation. Read the actual layout each frame; write only changes.
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    return () => {
      window.cancelAnimationFrame(frame);
      if (surface.matches(':popover-open')) surface.hidePopover();
    };
  }, [open, requested, ref, surfaceRef]);

  return placement;
}
