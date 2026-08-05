import { Stack } from '@lyra-ds/react';

const textScale = [
  ['xs', '12px'],
  ['sm', '13px'],
  ['base', '14px'],
  ['md', '16px'],
  ['lg', '18px'],
  ['xl', '20px'],
  ['2xl', '24px'],
  ['3xl', '30px'],
  ['4xl', '38px'],
  ['5xl', '48px'],
  ['6xl', '60px'],
] as const;

export function TypographyScale() {
  return (
    <Stack gap={1} aria-label="Typography scale">
      {textScale.map(([step, value]) => (
        <Stack direction="row" align="baseline" gap={3} key={step}>
          <code>{`--text-${step}`}</code>
          <span>{value}</span>
          <span
            style={{
              color: 'var(--text-primary)',
              fontSize: `var(--text-${step})`,
              fontWeight: 'var(--weight-semibold)',
            }}
          >
            Lyra Design System
          </span>
        </Stack>
      ))}
    </Stack>
  );
}
