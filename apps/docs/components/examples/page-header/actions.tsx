import { Button, PageHeader } from '@lyra-ds/react';

export function PageHeaderActions() {
  return (
    <PageHeader
      title="Deployments"
      description="Review what will reach production next."
      actions={<Button>New deployment</Button>}
    >
      <a href="/en/components/page-header">All deployments</a>
    </PageHeader>
  );
}
