'use client';

import { SegmentedControl } from '@lyra-ds/react';
import { useState } from 'react';

const options = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board', disabled: true },
  { value: 'calendar', label: 'Calendar' },
];

export function SegmentedControlDisabled() {
  const [value, setValue] = useState('list');

  return (
    <SegmentedControl options={options} value={value} onChange={setValue} label="Project view" />
  );
}
