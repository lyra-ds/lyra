'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lyra-ds/react';
import { useState } from 'react';

export function TabsLine() {
  const [active, setActive] = useState('overview');

  return (
    <Tabs id="project-tabs" active={active} onChange={setActive}>
      <TabsList aria-label="Project sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p>Project summary</p>
      </TabsContent>
      <TabsContent value="activity">
        <p>Showing activity</p>
      </TabsContent>
      <TabsContent value="settings">
        <p>Showing settings</p>
      </TabsContent>
    </Tabs>
  );
}
