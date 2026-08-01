import { Button, Inline } from '@lyra-ds/react';

export function StackInline() {
  return (
    <Inline>
      <Button size="sm">Save</Button>
      <Button size="sm" variant="ghost">
        Cancel
      </Button>
    </Inline>
  );
}
