import { Switch } from '@lyra-ds/react';

export function SwitchBasic() {
  return (
    <>
      <Switch label="Enable desktop notifications" defaultChecked />
      <Switch label="Pause notifications" />
    </>
  );
}
