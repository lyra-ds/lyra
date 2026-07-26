'use client';

import { Tabs } from '@lyra-ds/react';
import { useState } from 'react';

const items = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];

export function TabsLine() {
  const [active, setActive] = useState('overview');

  return (
    <>
      <Tabs id="project-tabs" items={items} active={active} onChange={setActive} />
      <p>{active === 'overview' ? 'Project summary' : `Showing ${active}`}</p>
    </>
  );
}
