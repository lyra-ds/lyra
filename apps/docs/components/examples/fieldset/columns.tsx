import { Fieldset, FormRow, Input } from '@lyra-ds/react';

export function FieldsetColumns() {
  return (
    <Fieldset legend="Address">
      <FormRow columns={3}>
        <Input label="City" autoComplete="address-level2" />
        <Input label="State" autoComplete="address-level1" />
        <Input label="Postal code" autoComplete="postal-code" />
      </FormRow>
    </Fieldset>
  );
}
