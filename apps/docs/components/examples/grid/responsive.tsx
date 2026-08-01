import { Card, Grid } from '@lyra-ds/react';

export function GridResponsive() {
  return (
    <Grid minItem={180} gap={4}>
      <Card padded>Design</Card>
      <Card padded>Engineering</Card>
      <Card padded>Research</Card>
      <Card padded>Operations</Card>
    </Grid>
  );
}
