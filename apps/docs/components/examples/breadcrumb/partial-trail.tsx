import { Breadcrumb } from '@lyra-ds/react';

const items = [
  { label: 'Settings', href: '/settings' },
  { label: 'Members' },
  { label: 'Invite member' },
];

export function BreadcrumbPartialTrail() {
  return <Breadcrumb aria-label="Invite flow" items={items} />;
}
