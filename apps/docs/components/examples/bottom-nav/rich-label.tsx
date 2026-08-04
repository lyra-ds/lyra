'use client';

import { BottomNav, Icon } from '@lyra-ds/react';
import { useState } from 'react';

export function BottomNavRichLabel() {
  const [selected, setSelected] = useState('Inbox');

  return (
    <>
      <BottomNav
        aria-label="Primary"
        items={[
          { id: 'home', label: 'Home', icon: <Icon name="house" size={18} /> },
          {
            id: 'inbox',
            label: (
              <span>
                Inbox <strong>3</strong>
              </span>
            ),
            icon: <Icon name="bell" size={18} />,
            active: selected === 'Inbox',
          },
          { id: 'settings', label: 'Settings', icon: <Icon name="settings" size={18} /> },
        ]}
        onSelect={(id) => setSelected(id === 'inbox' ? 'Inbox' : id)}
      />
      <span>Selected: {selected}</span>
    </>
  );
}
