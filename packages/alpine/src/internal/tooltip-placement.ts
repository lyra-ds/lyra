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
 * Measure immediately, then keep a tooltip on its requested side unless it would be clipped.
 * Returns the cleanup function required when the tooltip closes or its Alpine scope is destroyed.
 */
export function observeTooltipPlacement(
  node: HTMLElement,
  requested: TooltipPlacement,
  onPlacement: (placement: TooltipPlacement) => void,
): () => void {
  const measure = (): void => {
    // The bubble is a ::after pseudo-element, so its real used size comes from this computed
    // style rather than a DOM node. visualViewport accounts for dynamic browser chrome and zoom.
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
    // Preserve a requested side that fits; otherwise flip only when its opposite offers more room.
    onPlacement(fits || room[opposite] <= room[requested] ? requested : opposite);
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
}
