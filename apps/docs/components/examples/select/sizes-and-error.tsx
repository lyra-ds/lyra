import { Select } from '@lyra-ds/react';

export function SelectSizesAndError() {
  return (
    <>
      <Select label="Compact status" size="sm" defaultValue="todo">
        <option value="todo">To do</option>
        <option value="done">Done</option>
      </Select>
      <Select label="Billing country" size="lg" defaultValue="" error="Choose the billing country.">
        <option value="" disabled>
          Select a country
        </option>
        <option value="br">Brazil</option>
        <option value="pt">Portugal</option>
      </Select>
    </>
  );
}
