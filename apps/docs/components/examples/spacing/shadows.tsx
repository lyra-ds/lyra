import { Card, Grid, Stack } from '@lyra-ds/react';

const shadows = ['xs', 'sm', 'md', 'lg'] as const;

export function SpacingShadows() {
  return (
    <Grid
      columns="repeat(auto-fit, minmax(var(--space-20), 1fr))"
      gap={4}
      aria-label="Elevation shadows"
    >
      {shadows.map((step) => (
        <Card key={step} style={{ boxShadow: `var(--shadow-${step})` }}>
          <Stack gap={1}>
            <strong>{`--shadow-${step}`}</strong>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
