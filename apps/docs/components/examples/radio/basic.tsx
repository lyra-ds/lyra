import { Radio } from '@lyra-ds/react';

export function RadioBasic() {
  return (
    <>
      <Radio name="plan" value="starter" label="Starter" defaultChecked />
      <Radio name="plan" value="team" label="Team" />
      <Radio name="plan" value="enterprise" label="Enterprise" />
    </>
  );
}
