'use client';

import { Button, Dialog } from '@lyra-ds/react';
import { useRef, useState } from 'react';

export function DialogBasic() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button ref={triggerRef} variant="danger" onClick={() => setOpen(true)}>
        Delete project
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        initialFocusTo={() => cancelRef.current}
        returnFocusTo={() => triggerRef.current}
        title="Delete project"
        footer={
          <>
            <Button ref={cancelRef} variant="ghost" onClick={() => setOpen(false)}>
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
