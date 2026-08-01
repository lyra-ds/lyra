import { Button, Stack } from '@lyra-ds/react';

export function StackDefault() {
  return (
    <Stack gap={4}>
      <strong>Production deployment</strong>
      <span>Version 2.4.0 is waiting for approval.</span>
      <Button>Review deployment</Button>
    </Stack>
  );
}
