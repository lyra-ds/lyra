import { Button, Popover } from '@lyra-ds/react';

export function PopoverBasic() {
  return (
    <Popover
      trigger={<Button variant="secondary">View details</Button>}
      ariaLabel="Project details"
    >
      Atlas is on track for its June release.
    </Popover>
  );
}
