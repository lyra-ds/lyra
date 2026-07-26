'use client';

import { CommandPalette, Icon } from '@lyra-ds/react';

const groups = [
  {
    label: 'Files',
    items: [
      {
        id: 'find',
        label: 'Find a file',
        icon: <Icon name="search" size={16} />,
        hint: 'Search uploads',
      },
      { id: 'upload', label: 'Upload file', icon: <Icon name="upload" size={16} />, shortcut: 'U' },
    ],
  },
];

export function CommandPaletteHints() {
  return (
    <CommandPalette
      inline
      groups={groups}
      placeholder="Find a file or command…"
      hints={{ navigate: 'move', select: 'run' }}
    />
  );
}
