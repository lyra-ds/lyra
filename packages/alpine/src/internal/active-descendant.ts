/**
 * Return the next clamped active-descendant index for a navigation key.
 *
 * `null` means that the key has no active-descendant effect, including when
 * there are no options. Callers use that distinction to preserve native key
 * behavior unless navigation actually occurred.
 */
export function moveActiveIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  if (key === 'ArrowDown') return Math.min(current + 1, count - 1);
  if (key === 'ArrowUp') return Math.max(current - 1, 0);
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return null;
}

/** Keep an active option within its list's visible scroll band without unnecessary scrolling. */
export function scrollActiveIntoView(list: HTMLElement, option: HTMLElement | null): void {
  if (!option) return;
  const listRect = list.getBoundingClientRect();
  const optionRect = option.getBoundingClientRect();
  if (optionRect.top < listRect.top) list.scrollTop += optionRect.top - listRect.top;
  else if (optionRect.bottom > listRect.bottom) list.scrollTop += optionRect.bottom - listRect.bottom;
}
