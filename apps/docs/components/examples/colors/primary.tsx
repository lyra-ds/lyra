import { Card, Grid, Stack } from '@lyra-ds/react';

const indigo = [
  ['50', '#F1F1FC'],
  ['100', '#E0E1FB'],
  ['200', '#C6C8F5'],
  ['300', '#A5A7EE'],
  ['400', '#8285E4'],
  ['500', '#6E6ADE'],
  ['600', '#5B5BD6'],
  ['700', '#4A48B8'],
  ['800', '#3D3C94'],
  ['900', '#343475'],
  ['950', '#121430'],
] as const;

export function ColorsPrimary() {
  return (
    <Grid
      columns="repeat(auto-fit, minmax(var(--space-12), 1fr))"
      gap={2}
      aria-label="Indigo scale"
    >
      {indigo.map(([step, hex]) => (
        <Stack gap={1} key={step}>
          <Card
            padded
            aria-label={`Indigo ${step}`}
            style={{ backgroundColor: `var(--indigo-${step})` }}
          />
          <code>{`--indigo-${step}`}</code>
          <span>{hex}</span>
        </Stack>
      ))}
    </Grid>
  );
}
