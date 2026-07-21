import { useCallback, useEffect, useState, type AnimationEventHandler } from 'react';

/**
 * Fallback timeout for finalizing the exit unmount. Kept above `--duration-base` (180ms, the
 * `.lyra-dialog--closing` animation length) so the normal path is the animation, but a
 * reduced-motion / `display:none` / animation-disabled environment can never wedge the closing
 * state (Pitfall 7).
 */
const EXIT_FALLBACK_MS = 250;

export interface PresenceState {
  /** Whether the animated element should be in the tree at all. */
  mounted: boolean;
  /** True during the exit animation — the caller applies its `--closing` class while this holds. */
  closing: boolean;
  /**
   * Attach to the SAME animated element that carries the `--closing` class. Finalizes the
   * unmount when that element's own exit animation ends.
   */
  onAnimationEnd: AnimationEventHandler;
}

/**
 * Keep-mounted-while-closing presence state machine (D-17): `open → closing → unmounted`.
 * Lets a caller run a CSS exit animation before its element leaves the DOM.
 *
 * Usage: when `open` flips false the hook keeps `mounted` true and sets `closing` true; the
 * caller applies its `.lyra-dialog--closing` class (plan 03-02) and attaches the returned
 * `onAnimationEnd` to that same element. The unmount is finalized by whichever fires first —
 * the element's own `animationend` or the {@link EXIT_FALLBACK_MS} timeout — and the other is
 * cancelled. Re-opening during the close cancels the unmount and clears the timeout.
 *
 * `onAnimationEnd` only acts when `event.target === event.currentTarget`, so a bubbled child
 * animation ending never triggers the unmount. The hook uses no refs to DOM nodes and adds no
 * `addEventListener` — the caller-attached React handler is the only event path.
 *
 * `mounted` is derived (`open || closing`) and the open→closing transition is applied with the
 * React "adjust state while rendering" pattern, so no state is set synchronously inside an effect.
 */
export function usePresence(open: boolean): PresenceState {
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Detect the open transition during render (React re-renders immediately, before commit).
  if (prevOpen !== open) {
    setPrevOpen(open);
    // Closing when we just went open→false; a reopen clears any in-flight close.
    setClosing(!open);
  }

  const mounted = open || closing;

  // Timer-only effect: the wedge-proof fallback lives here so its setState is in a callback
  // (allowed), not synchronously in the effect body. Cleanup clears it on reopen / unmount /
  // animation-driven finalize (all of which flip `closing`).
  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(() => setClosing(false), EXIT_FALLBACK_MS);
    return () => clearTimeout(id);
  }, [closing]);

  const onAnimationEnd = useCallback<AnimationEventHandler>(
    (event) => {
      // Ignore bubbled child animations — only the panel's own exit finalizes the unmount.
      if (event.target !== event.currentTarget) return;
      if (!open) {
        setClosing(false);
      }
    },
    [open],
  );

  return { mounted, closing, onAnimationEnd };
}
