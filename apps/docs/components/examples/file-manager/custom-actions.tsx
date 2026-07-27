'use client';

import { FileManager, Icon } from '@lyra-ds/react';
import { useState } from 'react';

const files = [
  { id: 'proposal', name: 'Client proposal.pdf', size: 245_000, updated: 'Jul 22' },
  { id: 'contracts', name: 'Contracts', type: 'folder' as const, items: 4, updated: 'Jul 18' },
];

export function FileManagerCustomActions() {
  const [message, setMessage] = useState('');

  return (
    <>
      <FileManager
        files={files}
        actions={(file) => [
          {
            id: 'share',
            label: 'Share',
            icon: <Icon name="users" size={15} />,
            onSelect: () => setMessage(`Sharing ${file.name}`),
          },
          {
            id: 'archive',
            label: 'Archive',
            icon: <Icon name="file-archive" size={15} />,
            onSelect: () => setMessage(`Archived ${file.name}`),
          },
        ]}
      />
      {message && <span>{message}</span>}
    </>
  );
}
