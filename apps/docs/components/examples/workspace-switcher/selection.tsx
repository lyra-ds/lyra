'use client';

import { WorkspaceSwitcher } from '@lyra-ds/react';
import { useState } from 'react';

const workspaces = [
  { id: 'atlas', name: 'Atlas', plan: 'Pro', members: 12 },
  { id: 'studio', name: 'Northstar Studio', plan: 'Team', members: 6 },
  { id: 'personal', name: 'Personal', plan: 'Free', members: 1 },
];

export function WorkspaceSwitcherSelection() {
  const [current, setCurrent] = useState('atlas');

  return (
    <WorkspaceSwitcher
      workspaces={workspaces}
      current={current}
      onChange={(id) => setCurrent(id)}
    />
  );
}
