'use client';

import { SegmentedControl } from '@lyra-ds/react';
import { useState } from 'react';

const options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export function SegmentedControlBasic() {
  const [value, setValue] = useState('week');

  return (
    <SegmentedControl options={options} value={value} onChange={setValue} label="Time range" />
  );
}
