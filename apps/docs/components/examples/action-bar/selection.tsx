'use client';

import { ActionBar, Button } from '@lyra-ds/react';
import { useState } from 'react';

export function ActionBarSelection() {
  const [count, setCount] = useState(3);

  return (
    <>
      <Button variant="secondary" onClick={() => setCount(3)}>
        Select three projects
      </Button>
      <ActionBar
        count={count}
        label="projects selected"
        actions={<Button size="sm">Archive</Button>}
        clearLabel="Clear selected projects"
        onClear={() => setCount(0)}
      />
    </>
  );
}
