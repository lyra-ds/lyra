import { RadioGroup } from '@lyra-ds/react';

export function RadioGroupRow() {
  return (
    <RadioGroup
      label="Billing cycle"
      direction="row"
      defaultValue="monthly"
      options={[
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
      ]}
    />
  );
}
