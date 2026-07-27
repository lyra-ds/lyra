'use client';

import { Tabs } from '@lyra-ds/react';
import { useState } from 'react';

const items = [
  { id: 'all', label: 'All', count: 24 },
  { id: 'open', label: 'Open', count: 8 },
  { id: 'closed', label: 'Closed', count: 16 },
];

export function TabsPillsAndCounts() {
  const [active, setActive] = useState('all');

  return <Tabs items={items} active={active} onChange={setActive} variant="pills" />;
}
