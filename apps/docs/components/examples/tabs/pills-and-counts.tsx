'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lyra-ds/react';
import { useState } from 'react';

export function TabsPillsAndCounts() {
  const [active, setActive] = useState('all');

  return (
    <Tabs active={active} onChange={setActive} variant="pills">
      <TabsList aria-label="Issue status">
        <TabsTrigger value="all" count={24}>
          All
        </TabsTrigger>
        <TabsTrigger value="open" count={8}>
          Open
        </TabsTrigger>
        <TabsTrigger value="closed" count={16}>
          Closed
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <p>All issues</p>
      </TabsContent>
      <TabsContent value="open">
        <p>Open issues</p>
      </TabsContent>
      <TabsContent value="closed">
        <p>Closed issues</p>
      </TabsContent>
    </Tabs>
  );
}
