import { CheckboxGroup } from '@lyra-ds/react';

export function CheckboxGroupRowAndError() {
  return (
    <CheckboxGroup
      label="Data exports"
      direction="row"
      error="Choose at least one export format."
      options={[
        { value: 'csv', label: 'CSV' },
        { value: 'json', label: 'JSON' },
        { value: 'xlsx', label: 'XLSX', disabled: true },
      ]}
    />
  );
}
