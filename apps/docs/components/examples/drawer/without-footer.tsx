'use client';

import { Button, Drawer } from '@lyra-ds/react';
import { useRef, useState } from 'react';

export function DrawerWithoutFooter() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button ref={triggerRef} variant="secondary" onClick={() => setOpen(true)}>
        View activity
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        returnFocusTo={() => triggerRef.current}
        title="Recent activity"
      >
        This read-only detail needs no fixed action area. Use Escape or Close when you are finished.
      </Drawer>
    </>
  );
}
