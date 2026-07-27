'use client';

import { FileManager } from '@lyra-ds/react';
import { useState } from 'react';

const files = [
  { id: 'launch', name: 'Launch checklist.md', size: 18_200, updated: 'Today' },
  {
    id: 'screens',
    name: 'Product screens',
    type: 'folder' as const,
    items: 8,
    updated: 'Yesterday',
  },
];

export function FileManagerControlledView() {
  const [view, setView] = useState<'list' | 'grid'>('grid');

  return <FileManager files={files} view={view} onViewChange={setView} />;
}
