'use client';

import { Icon, SidebarGroup } from '@lyra-ds/react';
import { useState } from 'react';

export function SidebarGroupProjects() {
  const [selected, setSelected] = useState('Overview');

  return (
    <>
      <SidebarGroup
        label="Project"
        items={[
          {
            id: 'overview',
            label: 'Overview',
            icon: <Icon name="house" size={16} />,
            active: true,
          },
          {
            id: 'activity',
            label: 'Activity',
            icon: <Icon name="chart-line" size={16} />,
            badge: 8,
          },
          { id: 'settings', label: 'Settings', icon: <Icon name="settings" size={16} /> },
        ]}
        onSelect={(_, item) => setSelected(item.label)}
      />
      <span>Selected: {selected}</span>
    </>
  );
}
