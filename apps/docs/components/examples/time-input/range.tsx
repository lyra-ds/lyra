import { TimeInput } from '@lyra-ds/react';

export function TimeInputRange() {
  return (
    <TimeInput label="Appointment time" defaultValue="09:00" min="09:00" max="17:30" step={30} />
  );
}
