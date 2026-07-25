'use client';

import { Combobox } from '@lyra-ds/react';
import { useState } from 'react';

const assignees = [
  { value: 'ana', label: 'Ana Martins', hint: 'Design' },
  { value: 'diego', label: 'Diego Costa', hint: 'Engineering' },
  { value: 'maya', label: 'Maya Singh', hint: 'Support' },
];

export function ComboboxControlled() {
  const [assignee, setAssignee] = useState('');

  return (
    <Combobox
      label="Assignee"
      options={assignees}
      value={assignee}
      placeholder="Choose an assignee"
      onChange={(value) => setAssignee(value)}
    />
  );
}
