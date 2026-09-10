import { useCallback, useRef, useState, type RefObject } from 'react';
import { claimInactiveModalOverlay } from './use-modal-layer';

interface UseModalActivityOptions {
  open: boolean;
  overlayRef: RefObject<HTMLElement | null>;
  revokeGesture: () => void;
}

interface ModalActivityOwner {
  attachOverlay: (node: HTMLElement | null) => void;
  overlay: HTMLElement | null;
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
  const [claimKey] = useState(() => Symbol('lyra-modal-exit'));
  const attachedOverlayRef = useRef<HTMLElement | null>(null);
  const [overlay, setOverlay] = useState<HTMLElement | null>(null);

  const attachOverlay = useCallback(
    (node: HTMLElement | null) => {
      const previousNode = attachedOverlayRef.current;
      if (previousNode && previousNode !== node) {
        claimInactiveModalOverlay(previousNode, claimKey, false);
      }
      attachedOverlayRef.current = node;
      overlayRef.current = node;
      setOverlay(node);
      if (!node) return;

      claimInactiveModalOverlay(node, claimKey, !open);
      if (!open) revokeGesture();
    },
    [claimKey, open, overlayRef, revokeGesture],
  );

  return { attachOverlay, overlay };
}
