import { Accordion } from '@lyra-ds/react';

const items = [
  { id: 'email', title: 'Email notifications', content: 'Receive weekly summaries by email.' },
  { id: 'desktop', title: 'Desktop notifications', content: 'Receive alerts in your browser.' },
  { id: 'mobile', title: 'Mobile notifications', content: 'Receive alerts in the mobile app.' },
];

export function AccordionMultiple() {
  return <Accordion items={items} defaultOpen="email" multiple />;
}
