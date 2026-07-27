import { Button, Icon } from '@lyra-ds/react';

export function ButtonIconsAndStates() {
  return (
    <>
      <Button iconLeft={<Icon name="plus" size={16} />}>New project</Button>
      <Button variant="secondary" iconRight={<Icon name="arrow-right" size={16} />}>
        Continue
      </Button>
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
    </>
  );
}
