'use client';

import { CommandPalette } from '@lyra-ds/react';
import { useState } from 'react';

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

  return (
    <>
      <CommandPalette.Trigger label="Search commands" shortcut="⌘K" onClick={() => setOpen(true)} />
      <CommandPalette open={open} onClose={() => setOpen(false)} groups={groups} />
    </>
  );
}
