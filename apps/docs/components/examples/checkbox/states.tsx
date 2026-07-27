import { Checkbox } from '@lyra-ds/react';

export function CheckboxStates() {
  return (
    <>
      <Checkbox label="Selected permission" defaultChecked />
      <Checkbox label="Unavailable permission" disabled />
      <Checkbox label="Selected but unavailable" defaultChecked disabled />
    </>
  );
}
