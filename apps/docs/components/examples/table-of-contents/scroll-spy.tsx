'use client';

import { TableOfContents, useScrollSpy } from '@lyra-ds/react';

const items = [
  { id: 'scroll-spy-introduction', text: 'Introduction', level: 2 },
  { id: 'scroll-spy-api', text: 'API', level: 2 },
  { id: 'scroll-spy-notes', text: 'Notes', level: 2 },
];

export function TableOfContentsScrollSpy() {
  const activeId = useScrollSpy(items.map((item) => item.id));

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <TableOfContents label="Example sections" items={items} activeId={activeId} />
      {items.map((item) => (
        <section id={item.id} key={item.id} style={{ minHeight: '8rem' }}>
          <h4>{item.text}</h4>
          <p>Scroll this page to see the active link follow the nearest heading.</p>
        </section>
      ))}
    </div>
  );
}
