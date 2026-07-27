import { Accordion } from '@lyra-ds/react';

const items = [
  {
    id: 'billing',
    title: 'When will I be charged?',
    content: 'You are charged on the first day of each billing cycle.',
  },
  {
    id: 'cancel',
    title: 'Can I cancel at any time?',
    content: 'Yes. Your plan stays active until the end of the current billing cycle.',
  },
];

export function AccordionBasic() {
  return <Accordion items={items} defaultOpen="billing" />;
}
