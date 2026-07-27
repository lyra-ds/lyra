'use client';

import { FileManager } from '@lyra-ds/react';
import { useState } from 'react';

const files = [
  { id: 'assets', name: 'Brand assets', type: 'folder' as const, items: 12, updated: 'Today' },
  { id: 'brief', name: 'Project brief.pdf', size: 845_000, updated: 'Yesterday', shared: true },
  { id: 'notes', name: 'Research notes.md', size: 12_400, updated: 'Jul 20' },
];

export function FileManagerBrowse() {
  const [opened, setOpened] = useState<string>();

  return (
    <>
      <FileManager
        files={files}
        path={['Workspace', 'Design']}
        onOpen={(file) => setOpened(file.name)}
        onNavigate={(index) => setOpened(`Navigate to ${index === 0 ? 'Workspace' : 'Design'}`)}
        searchPlaceholder="Search design files…"
        emptyMessage="No design files match that search."
      />
      {opened && <span>Selected: {opened}</span>}
    </>
  );
}
