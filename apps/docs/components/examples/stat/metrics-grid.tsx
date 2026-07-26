import { Stat } from '@lyra-ds/react';

export function StatMetricsGrid() {
  return (
    <div
      style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
    >
      <Stat label="Monthly revenue" value="$48,240" delta="12%" direction="up" />
      <Stat label="New customers" value="328" delta="8%" direction="up" />
      <Stat label="Support tickets" value="24" delta="3%" direction="down" />
    </div>
  );
}
