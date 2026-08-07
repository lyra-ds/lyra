/**
 * Run `callback` once `element` is actually rendered.
 *
 * Alpine's x-show applies its reveal through a DEFERRED `requestAnimationFrame`/`setTimeout`
 * (`clickAwayCompatibleShow`), while `$nextTick` callbacks release on a plain `setTimeout` —
 * the ordering between the two is nondeterministic under load. Anything that needs the
 * revealed element (focus() silently no-ops on `display: none`; measurement reads 0) must
 * therefore poll for real layout instead of trusting a single tick.
 *
 * The retry loop uses `setTimeout` (never `requestAnimationFrame`, which throttles or stalls
 * in hidden pages) and stops as soon as `isCancelled` reports the owner no longer wants the
 * callback (e.g. the component closed while waiting).
 */
export function whenVisible(
  element: HTMLElement,
  isCancelled: () => boolean,
  callback: () => void,
): void {
  const attempt = (): void => {
    if (isCancelled()) return;
    if (element.getClientRects().length > 0) {
      callback();
      return;
    }
    setTimeout(attempt, 0);
  };
  attempt();
}
