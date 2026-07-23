'use client';

import { Button, Icon } from '@lyra-ds/react';

const variants = ['primary', 'secondary', 'soft', 'ghost', 'danger'] as const;

export function ButtonPreview() {
  return (
    <div
      className="lyra-card lyra-card--padded"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div
        style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}
      >
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
        <Button iconLeft={<Icon name="plus" size={16} />}>With icon</Button>
        <Button loading>Loading</Button>
      </div>
    </div>
  );
}
