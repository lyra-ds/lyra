'use client';

import { ActionBar, Button } from '@lyra-ds/react';
import { useState } from 'react';

export function ActionBarCustomActions() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Show selection actions
      </Button>
      <ActionBar
        open={open}
        count={2}
        actions={
          <>
            <Button size="sm" variant="secondary">
              Export
            </Button>
            <Button size="sm">Assign</Button>
          </>
        }
        onClear={() => setOpen(false)}
      />
    </>
  );
}
