'use client';

import { Button, Drawer } from '@lyra-ds/react';
import { useState } from 'react';

export function DrawerWithoutFooter() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        View activity
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Recent activity">
        This read-only detail needs no fixed action area. Use Escape or Close when you are finished.
      </Drawer>
    </>
  );
}
