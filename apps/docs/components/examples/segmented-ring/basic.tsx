import { SegmentedRing } from '@lyra-ds/react';

export function SegmentedRingBasic() {
  return (
    <SegmentedRing
      centerValue="5 of 8"
      centerLabel="Sessions"
      segments={[
        { value: 3, label: 'Completed', tone: 'success' },
        { value: 2, label: 'Scheduled', tone: 'accent' },
        { value: 3, label: 'Available', tone: 'neutral' },
      ]}
    />
  );
}
