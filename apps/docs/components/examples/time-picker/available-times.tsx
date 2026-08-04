import { TimePicker } from '@lyra-ds/react';

export function TimePickerAvailableTimes() {
  return <TimePicker label="Appointment time" min="09:00" max="12:00" step={15} locale="en-GB" />;
}
