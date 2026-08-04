import { SegmentedRing } from '@lyra-ds/react';

export function SegmentedRingCompact() {
  return (
    <SegmentedRing
      size="md"
      stacked
      showLegend={false}
      centerValue="72%"
      centerLabel="Storage used"
      segments={[
        { value: 72, label: 'Used', tone: 'warning' },
        { value: 28, label: 'Free', tone: 'neutral' },
      ]}
    />
  );
}
