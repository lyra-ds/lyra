import { Skeleton } from '@lyra-ds/react';

export function SkeletonContentShape() {
  return (
    <div className="lw-skeleton-row">
      <Skeleton circle height={40} />
      <div className="lw-skeleton-row__lines">
        <Skeleton height={14} width="55%" />
        <Skeleton height={12} width="85%" />
      </div>
    </div>
  );
}
