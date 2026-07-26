'use client';

import { Button, Dropdown, Icon } from '@lyra-ds/react';
import { useState } from 'react';

export function DropdownActions() {
  const [message, setMessage] = useState('');

  return (
    <>
      <Dropdown
        trigger={<Button variant="secondary">Project actions</Button>}
        items={[
          { type: 'label', label: 'Project' },
          {
            id: 'rename',
            label: 'Rename project',
            icon: <Icon name="pencil" size={16} />,
            onSelect: () => setMessage('Rename selected'),
          },
          {
            id: 'duplicate',
            label: 'Duplicate project',
            icon: <Icon name="copy" size={16} />,
            onSelect: () => setMessage('Duplicate selected'),
          },
          { type: 'separator' },
          {
            id: 'archive',
            label: 'Archive project',
            danger: true,
            icon: <Icon name="archive" size={16} />,
            onSelect: () => setMessage('Archive selected'),
          },
        ]}
      />
      {message && <span>{message}</span>}
    </>
  );
}
