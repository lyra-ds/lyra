import { Switch } from '@lyra-ds/react';

export function SwitchDisabled() {
  return (
    <>
      <Switch label="Managed by your organisation" defaultChecked disabled />
      <Switch label="Unavailable while billing is paused" disabled />
    </>
  );
}
