'use client';

import { Button, Card, Icon } from '@lyra-ds/react';

const variants = ['primary', 'secondary', 'soft', 'ghost', 'danger'] as const;

export function ButtonPreview() {
  return (
    <Card className="lw-preview__stack">
      <div className="lw-preview__row">
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div className="lw-preview__row">
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
        <Button iconLeft={<Icon name="plus" size={16} />}>With icon</Button>
        <Button loading>Loading</Button>
      </div>
    </Card>
  );
}
