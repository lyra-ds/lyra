import { Brand, Card, Grid, Stack } from '@lyra-ds/react';

const wordmarkStyle = {
  fontSize: 'var(--text-3xl)',
  letterSpacing: 'var(--tracking-display)',
};

export function BrandingLogo() {
  return (
    <Grid columns={2} gap={4} aria-label="Lyra logo on light and dark surfaces">
      <Card padded>
        <Stack align="center" justify="center" gap={4}>
          <Brand mark="/lyra-mark.svg" size={40} style={wordmarkStyle}>
            Lyra
          </Brand>
        </Stack>
      </Card>
      <Card padded data-theme="dark">
        <Stack align="center" justify="center" gap={4}>
          <Brand
            mark="/lyra-mark.svg"
            markDark="/lyra-mark-light.svg"
            size={40}
            style={wordmarkStyle}
          >
            Lyra
          </Brand>
        </Stack>
      </Card>
    </Grid>
  );
}
