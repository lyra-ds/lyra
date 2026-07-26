'use client';

import { Button, Drawer } from '@lyra-ds/react';
import { useState } from 'react';

export function DrawerBasic() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open project details
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Project details"
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        Review the latest deployment, owners and activity without leaving this page.
      </Drawer>
    </>
  );
}
