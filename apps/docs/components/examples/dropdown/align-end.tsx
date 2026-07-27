'use client';

import { Button, Dropdown, Icon } from '@lyra-ds/react';
import { useState } from 'react';

export function DropdownAlignEnd() {
  const [message, setMessage] = useState('');

  return (
    <>
      <Dropdown
        align="end"
        trigger={<Button iconRight={<Icon name="chevron-down" size={16} />}>Share</Button>}
        items={[
          { id: 'link', label: 'Copy link', onSelect: () => setMessage('Link copied') },
          { id: 'invite', label: 'Invite people', onSelect: () => setMessage('Invite selected') },
        ]}
      />
      {message && <span>{message}</span>}
    </>
  );
}
