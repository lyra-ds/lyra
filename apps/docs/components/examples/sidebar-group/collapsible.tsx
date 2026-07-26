'use client';

import { Icon, SidebarGroup } from '@lyra-ds/react';
import { useState } from 'react';

export function SidebarGroupCollapsible() {
  const [selected, setSelected] = useState('');

  return (
    <>
      <SidebarGroup
        label="Workspaces"
        collapsible
        items={[
          { id: 'design', label: 'Design system', icon: <Icon name="folder-open" size={16} /> },
          {
            id: 'marketing',
            label: 'Marketing site',
            icon: <Icon name="layout-dashboard" size={16} />,
          },
        ]}
        onSelect={(_, item) => setSelected(item.label)}
      />
      {selected && <span>Opened: {selected}</span>}
    </>
  );
}
