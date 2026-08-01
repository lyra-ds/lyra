import { Card, Grid } from '@lyra-ds/react';

export function GridColumns() {
  return (
    <Grid columns={3} gap={4}>
      <Card padded>Overview</Card>
      <Card padded>Activity</Card>
      <Card padded>Settings</Card>
    </Grid>
  );
}
