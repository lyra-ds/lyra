'use client';

import { TimeInput } from '@lyra-ds/react';

export function TimeInputLabels() {
  return (
    <TimeInput
      label="Reminder time"
      defaultValue="14:15"
      labels={{
        later: 'Choose a later time',
        earlier: 'Choose an earlier time',
        valueText: (hours, minutes) => `${hours} hours and ${minutes} minutes`,
      }}
    />
  );
}
