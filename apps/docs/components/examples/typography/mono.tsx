import { Card, Stack } from '@lyra-ds/react';

export function TypographyMono() {
  return (
    <Stack gap={3} aria-label="Monospace typography">
      <Card
        style={{
          backgroundColor: 'var(--indigo-950)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--night-100)',
        }}
      >
        <code style={{ font: 'var(--code-font)' }}>
          import {'{ Button }'} from '@lyra-ds/react';
        </code>
      </Card>
      <span style={{ color: 'var(--text-secondary)' }}>
        Inline code: install{' '}
        <code
          style={{
            backgroundColor: 'var(--surface-sunken)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--accent-soft-text)',
            font: 'var(--code-font)',
          }}
        >
          pnpm add @lyra-ds/react
        </code>{' '}
        and import <code style={{ font: 'var(--code-font)' }}>styles.css</code>.
      </span>
      <code>--font-mono · JetBrains Mono · --code-font · 13px / 1.5</code>
    </Stack>
  );
}
