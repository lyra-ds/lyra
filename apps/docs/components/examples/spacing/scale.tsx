import { Stack } from '@lyra-ds/react';

const spacingScale = [
  ['1', '4px'],
  ['2', '8px'],
  ['3', '12px'],
  ['4', '16px'],
  ['5', '20px'],
  ['6', '24px'],
  ['8', '32px'],
  ['10', '40px'],
  ['12', '48px'],
  ['16', '64px'],
  ['20', '80px'],
  ['24', '96px'],
] as const;

export function SpacingScale() {
  return (
    <Stack gap={1} aria-label="Spacing scale">
      {spacingScale.map(([step, value]) => (
        <Stack direction="row" align="center" gap={3} key={step}>
          <code>{`--space-${step}`}</code>
          <span>{value}</span>
          <span
            aria-hidden="true"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderLeft: 'var(--space-1) solid var(--accent)',
              borderRadius: 'var(--radius-xs)',
              height: 'var(--space-3)',
              width: `var(--space-${step})`,
            }}
          />
        </Stack>
      ))}
    </Stack>
  );
}
