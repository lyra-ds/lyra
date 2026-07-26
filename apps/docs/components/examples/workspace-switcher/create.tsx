'use client';

import { WorkspaceSwitcher } from '@lyra-ds/react';
import { useState } from 'react';

const workspaces = [
  { id: 'atlas', name: 'Atlas', plan: 'Pro', members: 12 },
  { id: 'studio', name: 'Northstar Studio', plan: 'Team', members: 6 },
];

export function WorkspaceSwitcherCreate() {
  const [created, setCreated] = useState(false);

  return (
    <>
      <WorkspaceSwitcher
        workspaces={workspaces}
        onCreate={() => setCreated(true)}
        createLabel="Create another workspace"
      />
      {created && <span>Create workspace selected</span>}
    </>
  );
}
