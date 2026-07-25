import { Checkbox } from '@lyra-ds/react';

export function CheckboxBasic() {
  return (
    <>
      <Checkbox label="Send me release notes" defaultChecked />
      <Checkbox label="I agree to the data processing terms" />
    </>
  );
}
