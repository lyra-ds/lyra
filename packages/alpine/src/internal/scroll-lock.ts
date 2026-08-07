let lockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

/** Lock document body scrolling, reference-counted across every Lyra overlay. */
export function lockScroll(): void {
  lockCount += 1;
  if (lockCount !== 1) return;

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

/** Release one body-scroll lock and restore the saved inline styles after the final release. */
export function unlockScroll(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount !== 0) return;

  const body = document.body;
  body.style.overflow = savedOverflow;
  body.style.paddingRight = savedPaddingRight;
}
