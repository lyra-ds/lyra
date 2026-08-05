import { Card, Grid, Stack } from '@lyra-ds/react';

const slate = [
  ['50', '#F8FAFC'],
  ['100', '#F1F5F9'],
  ['200', '#E2E8F0'],
  ['300', '#CBD5E1'],
  ['400', '#94A3B8'],
  ['500', '#64748B'],
  ['600', '#475569'],
  ['700', '#334155'],
  ['800', '#1E293B'],
  ['900', '#0F172A'],
] as const;

export function ColorsNeutrals() {
  return (
    <Grid columns="repeat(auto-fit, minmax(var(--space-12), 1fr))" gap={2} aria-label="Slate scale">
      {slate.map(([step, hex]) => (
        <Stack gap={1} key={step}>
          <Card
            padded
            aria-label={`Slate ${step}`}
            style={{ backgroundColor: `var(--slate-${step})` }}
          />
          <code>{`--slate-${step}`}</code>
          <span>{hex}</span>
        </Stack>
      ))}
    </Grid>
  );
}
