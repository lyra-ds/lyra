import { RadioGroup } from '@lyra-ds/react';

export function RadioGroupBasic() {
  return (
    <RadioGroup
      label="Contact preference"
      hint="Choose the best way to reach you."
      defaultValue="email"
      options={[
        { value: 'email', label: 'Email', hint: 'Written updates and receipts' },
        { value: 'phone', label: 'Phone' },
        { value: 'none', label: 'Do not contact me' },
      ]}
    />
  );
}
