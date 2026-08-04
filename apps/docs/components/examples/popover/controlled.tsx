'use client';

import { Button, Popover } from '@lyra-ds/react';
import { useState } from 'react';

export function PopoverControlled() {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      trigger={<Button variant="secondary">Filter projects</Button>}
      open={open}
      onOpenChange={setOpen}
      align="end"
      ariaLabel="Project filters"
    >
      Show active projects only.
    </Popover>
  );
}
