'use client';

import { Button, Dialog } from '@lyra-ds/react';
import { useState } from 'react';

export function DialogBasic() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete project
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete project"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        This permanently removes the project and every deployment attached to it.
      </Dialog>
    </>
  );
}
