import { Select } from '@lyra-ds/react';

export function SelectBasic() {
  return (
    <Select label="Team size" hint="Used to tailor your workspace." defaultValue="">
      <option value="" disabled>
        Choose a range
      </option>
      <option value="1-10">1–10 people</option>
      <option value="11-50">11–50 people</option>
      <option value="51+">51 or more people</option>
    </Select>
  );
}
