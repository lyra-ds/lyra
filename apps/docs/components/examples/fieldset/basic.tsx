import { Fieldset, FormRow, Input } from '@lyra-ds/react';

export function FieldsetBasic() {
  return (
    <Fieldset legend="Contact details" description="How we can reach you about this order.">
      <FormRow>
        <Input label="First name" autoComplete="given-name" />
        <Input label="Last name" autoComplete="family-name" />
      </FormRow>
      <Input label="Work email" type="email" autoComplete="email" />
    </Fieldset>
  );
}
