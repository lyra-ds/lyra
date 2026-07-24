'use client';

import { Badge, Card } from '@lyra-ds/react';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const;

export function BadgePreview() {
  return (
    <Card className="lw-preview__row">
      {tones.map((tone) => (
        <Badge key={tone} tone={tone} dot>
          {tone}
        </Badge>
      ))}
    </Card>
  );
}
