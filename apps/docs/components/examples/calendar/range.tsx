import { Calendar } from '@lyra-ds/react';

export function CalendarRange() {
  return (
    <Calendar range defaultValue={{ start: new Date(2026, 7, 11), end: new Date(2026, 7, 15) }} />
  );
}
