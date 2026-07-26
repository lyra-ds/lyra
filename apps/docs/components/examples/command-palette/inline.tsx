'use client';

import { CommandPalette, Icon } from '@lyra-ds/react';

const groups = [
  {
    label: 'Navigate',
    items: [
      { id: 'home', label: 'Go to home', icon: <Icon name="house" size={16} />, shortcut: 'G H' },
      {
        id: 'projects',
        label: 'Open projects',
        icon: <Icon name="folder" size={16} />,
        hint: 'Recent work',
      },
    ],
  },
  {
    label: 'Create',
    items: [
      {
        id: 'project',
        label: 'New project',
        icon: <Icon name="plus" size={16} />,
        shortcut: 'C P',
      },
    ],
  },
];

export function CommandPaletteInline() {
  return <CommandPalette inline groups={groups} />;
}
