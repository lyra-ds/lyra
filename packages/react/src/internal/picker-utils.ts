import { useEffect, useState } from 'react';

/** Convert a Date or ISO date-only string into a valid local midnight Date. */
export function toLocalDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
    ? date
    : null;
}

/** Resolve the mobile picker layout after hydration, keeping the server default desktop-safe. */
export function useMobilePicker(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(max-width: 640px)');
    const update = (event: MediaQueryListEvent): void => setMobile(event.matches);
    const timer = window.setTimeout(() => setMobile(media.matches), 0);
    media.addEventListener('change', update);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener('change', update);
    };
  }, []);

  return mobile;
}
