import { useEffect, type RefObject } from 'react';
import { acquireModalScrollLock } from './use-modal-layer';

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
export function useScrollLock(active: boolean, ownerRef?: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!active) return;
    const ownerDocument = ownerRef ? ownerRef.current?.ownerDocument : document;
    if (!ownerDocument) return;
    return acquireModalScrollLock(ownerDocument);
  }, [active, ownerRef]);
}
