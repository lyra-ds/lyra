import { Icon, Input } from '@lyra-ds/react';

export function InputSizesAndIcon() {
  return (
    <>
      <Input size="sm" label="Small" placeholder="sm" />
      <Input size="md" label="Medium" placeholder="md" />
      <Input
        size="lg"
        label="Search"
        placeholder="Search projects…"
        iconLeft={<Icon name="search" size={16} />}
      />
    </>
  );
}
