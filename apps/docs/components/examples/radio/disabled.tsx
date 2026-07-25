import { Radio } from '@lyra-ds/react';

export function RadioDisabled() {
  return (
    <>
      <Radio name="archive" value="keep" label="Keep active" defaultChecked />
      <Radio name="archive" value="archive" label="Archive after 30 days" disabled />
    </>
  );
}
