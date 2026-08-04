import { DateRangePicker } from '@lyra-ds/react';

export function DateRangePickerBasic() {
  return (
    <DateRangePicker
      label="Travel dates"
      defaultValue={{ start: new Date(2026, 7, 11), end: new Date(2026, 7, 15) }}
    />
  );
}
