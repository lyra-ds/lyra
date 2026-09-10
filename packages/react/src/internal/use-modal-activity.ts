import { useCallback, type RefObject } from 'react';

interface UseModalActivityOptions {
  open: boolean;
  overlayRef: RefObject<HTMLElement | null>;
  revokeGesture: () => void;
}

interface ModalActivityOwner {
  attachOverlay: (node: HTMLElement | null) => void;
}

/**
 * Owns the DOM activity state for a modal overlay that remains mounted through its exit motion.
 * The callback ref commits the inert attribute with the controlled `open` transition, before
 * passive focus effects run, without rendering React's boolean `inert` attribute.
 */
export function useModalActivity({
  open,
  overlayRef,
  revokeGesture,
}: UseModalActivityOptions): ModalActivityOwner {
  const attachOverlay = useCallback(
    (node: HTMLElement | null) => {
      overlayRef.current = node;
      if (!node) return;

      node.toggleAttribute('inert', !open);
      if (!open) revokeGesture();
    },
    [open, overlayRef, revokeGesture],
  );

  return { attachOverlay };
}
