import { useEffect } from 'react';

// Module-level reference count so nested overlays (Dialog over Drawer over CommandPalette)
// share one body lock: only the 0→1 transition applies styles and captures the prior inline
// values, only the 1→0 transition restores them. A per-hook counter would let an inner overlay
// unlock the body while an outer one is still open (review fix).
let lockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

/**
 * Lock body scroll while `active`, compensating for the removed scrollbar so the page behind a
 * modal never shifts horizontally (D-22).
 *
 * The scrollbar-width delta (`window.innerWidth - documentElement.clientWidth`) is ADDED to the
 * body's existing computed `padding-right` — never replacing it — so pages that already pad the
 * body keep their layout (review fix). Reference-counted across every mounted lock; the exact
 * prior inline `overflow`/`paddingRight` values are restored only when the last lock releases.
 *
 * All DOM access happens inside the effect, so there is no module-scope DOM reference.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    lockCount += 1;
    if (lockCount === 1) {
      const body = document.body;
      savedOverflow = body.style.overflow;
      savedPaddingRight = body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const existingPadding = parseFloat(getComputedStyle(body).paddingRight) || 0;

      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${existingPadding + scrollbarWidth}px`;
      }
    }

    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        const body = document.body;
        body.style.overflow = savedOverflow;
        body.style.paddingRight = savedPaddingRight;
      }
    };
  }, [active]);
}
