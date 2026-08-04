'use client';

import { AppSidebar, Icon } from '@lyra-ds/react';
import { useState } from 'react';

export function AppSidebarGroups() {
  const [selected, setSelected] = useState('Overview');

  return (
    <>
      <AppSidebar
        aria-label="Workspace"
        brand={<strong>Acme</strong>}
        groups={[
          {
            heading: 'Workspace',
            items: [
              {
                id: 'overview',
                label: 'Overview',
                icon: <Icon name="house" size={16} />,
                active: true,
              },
              { id: 'activity', label: 'Activity', icon: <Icon name="chart-line" size={16} /> },
            ],
          },
        ]}
        onSelect={(_, item) => setSelected(item.label)}
      />
      <span>Selected: {selected}</span>
    </>
  );
}
