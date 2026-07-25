import { Skeleton } from '@lyra-ds/react';

export function SkeletonCard() {
  return (
    <div style={{ display: 'grid', gap: '0.75rem', width: '22rem' }}>
      <Skeleton height={160} />
      <Skeleton height={18} width="60%" />
      <Skeleton height={14} />
      <Skeleton height={14} width="75%" />
    </div>
  );
}
