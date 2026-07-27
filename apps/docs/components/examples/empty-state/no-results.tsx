import { EmptyState, Icon } from '@lyra-ds/react';

export function EmptyStateNoResults() {
  return (
    <EmptyState
      icon={<Icon name="search" size={24} />}
      title="No matching projects"
      description="Try a different name or clear one of the filters."
    />
  );
}
