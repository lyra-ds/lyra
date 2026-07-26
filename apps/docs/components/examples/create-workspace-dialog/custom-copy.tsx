'use client';

import { Button, CreateWorkspaceDialog } from '@lyra-ds/react';
import { useState } from 'react';

export function CreateWorkspaceDialogCustomCopy() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Add a team space
      </Button>
      <CreateWorkspaceDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create a team space"
        slugPrefix="teams.example/"
      />
    </>
  );
}
