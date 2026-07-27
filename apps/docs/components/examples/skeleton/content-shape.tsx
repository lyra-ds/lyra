import { Skeleton } from '@lyra-ds/react';

export function SkeletonContentShape() {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem', width: '20rem' }}>
      <Skeleton circle height={40} />
      <div style={{ display: 'grid', flex: 1, gap: '0.5rem' }}>
        <Skeleton height={14} width="55%" />
        <Skeleton height={12} width="85%" />
      </div>
    </div>
  );
}
