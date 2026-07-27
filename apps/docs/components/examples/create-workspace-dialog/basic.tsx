'use client';

import { Button, CreateWorkspaceDialog } from '@lyra-ds/react';
import { useState } from 'react';

export function CreateWorkspaceDialogBasic() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create workspace</Button>
      <CreateWorkspaceDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
