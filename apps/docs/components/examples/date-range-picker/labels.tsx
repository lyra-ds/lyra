'use client';

import { DateRangePicker } from '@lyra-ds/react';
import type { DateRange } from '@lyra-ds/react';
import { useState } from 'react';

export function DateRangePickerLabels() {
  const [value, setValue] = useState<DateRange>({ start: new Date(2026, 7, 11), end: null });

  return (
    <DateRangePicker
      label="Travel dates"
      value={value}
      onChange={setValue}
      labels={{ rangeSeparator: ' through ', incompleteRange: 'end date' }}
    />
  );
}
