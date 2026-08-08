/** Returns a local-midnight copy of a valid Date or ISO `YYYY-MM-DD` date. */
export function dateFrom(value: Date | string | null | undefined): Date | null {
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

/** Normalizes a date-like model value, including JSON datetime strings, to local midnight. */
export function normalizeDay(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const direct = dateFrom(value);
    if (direct) return direct;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : dateFrom(parsed);
  }
  return value instanceof Date ? dateFrom(value) : null;
}

/** Whether two local dates name the same calendar day. */
export function sameDay(left: Date | null, right: Date | null): boolean {
  return Boolean(
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate(),
  );
}

/** A React-compatible local-date key; months are zero-indexed and unpadded. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Adds months while retaining the day where possible and clamping it otherwise. */
export function addMonths(date: Date, amount: number): Date {
  const targetMonth = date.getMonth() + amount;
  const lastDay = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
  return new Date(date.getFullYear(), targetMonth, Math.min(date.getDate(), lastDay));
}

/** Formats a local date as a zero-padded ISO calendar date. */
export function isoFrom(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}
