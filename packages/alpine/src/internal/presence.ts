const EXIT_FALLBACK_MS = 250;

export interface PresenceController {
  update(open: boolean): void;
  onAnimationEnd(event: AnimationEvent): void;
  destroy(): void;
}

/**
 * Plain open → closing → unmounted controller. Its owner renders while `open || closing` and
 * receives every closing-state change through `setClosing`.
 */
export function createPresence(
  initialOpen: boolean,
  setClosing: (closing: boolean) => void,
): PresenceController {
  let open = initialOpen;
  let fallback: ReturnType<typeof setTimeout> | null = null;

  const cancelFallback = (): void => {
    if (fallback === null) return;
    clearTimeout(fallback);
    fallback = null;
  };

  const finalize = (): void => {
    cancelFallback();
    setClosing(false);
  };

  return {
    update(nextOpen) {
      if (open === nextOpen) return;
      open = nextOpen;
      if (open) {
        finalize();
        return;
      }

      setClosing(true);
      cancelFallback();
      fallback = setTimeout(finalize, EXIT_FALLBACK_MS);
    },

    onAnimationEnd(event) {
      if (event.target === event.currentTarget && !open) finalize();
    },

    destroy() {
      cancelFallback();
    },
  };
}
