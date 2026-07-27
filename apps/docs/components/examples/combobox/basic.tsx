'use client';

import { Combobox } from '@lyra-ds/react';

const countries = [
  { value: 'br', label: 'Brazil', hint: 'South America' },
  { value: 'pt', label: 'Portugal', hint: 'Europe' },
  { value: 'jp', label: 'Japan', hint: 'Asia' },
];

export function ComboboxBasic() {
  return (
    <Combobox
      label="Country"
      hint="Type to narrow a longer list."
      options={countries}
      placeholder="Choose a country"
    />
  );
}
