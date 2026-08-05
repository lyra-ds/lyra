import { Card, Grid, Stack } from '@lyra-ds/react';

const intents = ['success', 'warning', 'danger', 'info'] as const;

export function ColorsSemantic() {
  return (
    <Grid
      columns="repeat(auto-fit, minmax(var(--space-16), 1fr))"
      gap={3}
      aria-label="Semantic colors"
    >
      {intents.map((intent) => (
        <Stack gap={2} key={intent}>
          <Card
            padded
            aria-label={`Strong ${intent}`}
            style={{ backgroundColor: `var(--${intent})` }}
          />
          <Card
            padded
            style={{ backgroundColor: `var(--${intent}-soft)`, color: `var(--${intent}-text)` }}
          >
            soft / text
          </Card>
          <code>{`--${intent}`}</code>
        </Stack>
      ))}
    </Grid>
  );
}
