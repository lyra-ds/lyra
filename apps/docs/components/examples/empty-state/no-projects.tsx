'use client';

import { Button, EmptyState, Icon } from '@lyra-ds/react';

export function EmptyStateNoProjects() {
  return (
    <EmptyState
      icon={<Icon name="folder" size={24} />}
      title="No projects yet"
      description="Create a project to give your team one place to plan and track work."
      action={
        <Button asChild>
          <a href="/projects/new">Create project</a>
        </Button>
      }
    />
  );
}
