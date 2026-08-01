import { Stack } from '@lyra-ds/react';

export function StackDistribution() {
  return (
    <Stack direction="row" justify="space-between" align="center" gap={4}>
      <span>Production</span>
      <span>Healthy</span>
    </Stack>
  );
}
