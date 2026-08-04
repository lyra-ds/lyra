'use client';

import { AppSidebar, Icon, SidebarGroup } from '@lyra-ds/react';

export function AppSidebarComposition() {
  return (
    <AppSidebar
      aria-label="Workspace"
      brand={<strong>Acme</strong>}
      width={280}
      collapsible
      labels={{ collapse: 'Collapse workspace navigation', expand: 'Expand workspace navigation' }}
    >
      <SidebarGroup label="Workspace">
        <a className="lyra-sbgroup__item lyra-sbgroup__item--active" href="/overview">
          <span className="lyra-sbgroup__item-icon">
            <Icon name="house" size={16} />
          </span>
          <span className="lyra-sbgroup__item-label">Overview</span>
        </a>
        <a className="lyra-sbgroup__item" href="/activity">
          <span className="lyra-sbgroup__item-icon">
            <Icon name="chart-line" size={16} />
          </span>
          <span className="lyra-sbgroup__item-label">Activity</span>
        </a>
      </SidebarGroup>
    </AppSidebar>
  );
}
