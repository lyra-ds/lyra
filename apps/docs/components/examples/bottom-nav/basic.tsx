'use client';

import { BottomNav, Icon } from '@lyra-ds/react';
import { useState } from 'react';

export function BottomNavBasic() {
  const [selected, setSelected] = useState('Home');
  const items = [
    { id: 'home', label: 'Home', icon: <Icon name="house" size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Icon name="chart-line" size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Icon name="settings" size={18} /> },
  ];

  return (
    <>
      <BottomNav
        aria-label="Primary"
        items={items.map((item) => ({ ...item, active: item.label === selected }))}
        onSelect={(_, item) => setSelected(String(item.label))}
      />
      <span>Current view: {selected}</span>
    </>
  );
}
