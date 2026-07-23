'use client';

import { Badge } from '@lyra-ds/react';

const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const;

export function BadgePreview() {
  return (
    <div
      className="lyra-card lyra-card--padded"
      style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}
    >
      {tones.map((tone) => (
        <Badge key={tone} tone={tone} dot>
          {tone}
        </Badge>
      ))}
    </div>
  );
}
