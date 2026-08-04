import { SlotPicker } from '@lyra-ds/react';

export function SlotPickerBasic() {
  return (
    <div className="lw-example-scroll">
      <SlotPicker
        timezone="America/New_York"
        defaultDate="2026-08-03"
        slots={[
          { start: '2026-08-03T13:00:00Z', end: '2026-08-03T13:30:00Z' },
          { start: '2026-08-03T14:00:00Z', end: '2026-08-03T14:30:00Z' },
          { start: '2026-08-03T15:00:00Z', end: '2026-08-03T15:30:00Z' },
        ]}
      />
    </div>
  );
}
