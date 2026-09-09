'use client';

import { CommandPalette } from '@lyra-ds/react';
import { useRef, useState } from 'react';

const groups = [
  {
    label: 'Navigate',
    items: [
      { id: 'projects', label: 'Projects' },
      { id: 'settings', label: 'Settings' },
    ],
  },
];

export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <CommandPalette.Trigger
        ref={triggerRef}
        label="Search commands"
        shortcut="⌘K"
        onClick={() => setOpen(true)}
      />
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        returnFocusTo={() => triggerRef.current}
        groups={groups}
      />
    </>
  );
}
