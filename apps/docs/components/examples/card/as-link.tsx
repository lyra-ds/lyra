'use client';

import { Card, Icon } from '@lyra-ds/react';

export function CardAsLink() {
  return (
    <Card asChild interactive>
      <a
        href="/en/components/card"
        style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
          <Icon name="book-open" size={20} />
          <span>Read the Card documentation</span>
          <Icon name="arrow-right" size={16} />
        </div>
      </a>
    </Card>
  );
}
