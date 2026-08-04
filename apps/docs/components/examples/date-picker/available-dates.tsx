import { DatePicker } from '@lyra-ds/react';

export function DatePickerAvailableDates() {
  return (
    <DatePicker
      label="Delivery date"
      min="2026-08-03"
      max="2026-08-21"
      hint="Dates outside this delivery window are unavailable."
    />
  );
}
