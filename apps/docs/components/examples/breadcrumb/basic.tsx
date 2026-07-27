import { Breadcrumb } from '@lyra-ds/react';

const items = [
  { label: 'Workspace', href: '/workspace' },
  { label: 'Projects', href: '/workspace/projects' },
  { label: 'Brand refresh' },
];

export function BreadcrumbBasic() {
  return <Breadcrumb items={items} />;
}
