import { TimeInput } from '@lyra-ds/react';

export function TimeInputBasic() {
  return (
    <TimeInput
      label="Start time"
      hint="Enter a 24-hour time, such as 09:30."
      defaultValue="09:30"
    />
  );
}
