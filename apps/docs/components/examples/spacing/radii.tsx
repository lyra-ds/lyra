import { Card, Grid, Stack } from '@lyra-ds/react';

const radii = [
  ['xs', '4px'],
  ['sm', '6px'],
  ['md', '10px'],
  ['lg', '14px'],
  ['xl', '20px'],
  ['full', '999px'],
] as const;

export function SpacingRadii() {
  return (
    <Grid columns={2} gap={3} aria-label="Border radii">
      {radii.map(([step, value]) => {
        const isDefault = step === 'md';

        return (
          <Stack gap={1} key={step}>
            <Card
              aria-label={`--radius-${step}`}
              style={{
                backgroundColor: isDefault ? 'var(--accent)' : 'var(--accent-soft)',
                borderColor: 'var(--accent)',
                borderRadius: `var(--radius-${step})`,
              }}
            />
            <strong>{`--radius-${step}`}</strong>
            <code>{`${value}${isDefault ? ' · default' : ''}`}</code>
          </Stack>
        );
      })}
    </Grid>
  );
}
