import { Card, Grid, Stack } from '@lyra-ds/react';

const surfaces = [
  ['sunken', '#0B0D1D'],
  ['page', '#0E1023'],
  ['card', '#121430'],
  ['raised', '#1C1F42'],
] as const;

export function ColorsDark() {
  return (
    <Stack gap={4} data-theme="dark">
      <Grid
        columns="repeat(auto-fit, minmax(var(--space-16), 1fr))"
        gap={3}
        aria-label="Dark surfaces"
      >
        {surfaces.map(([surface, hex]) => (
          <Card padded key={surface} style={{ backgroundColor: `var(--surface-${surface})` }}>
            <Stack gap={1}>
              <strong>{surface}</strong>
              <code>{hex}</code>
            </Stack>
          </Card>
        ))}
      </Grid>
      <Grid columns={3} gap={2} aria-label="Dark mode accent scale">
        {['500', '400', '300'].map((step) => (
          <Card
            padded
            aria-label={`Indigo ${step}`}
            key={step}
            style={{ backgroundColor: `var(--indigo-${step})` }}
          />
        ))}
      </Grid>
    </Stack>
  );
}
