import { Stat } from '@lyra-ds/react';

export function StatDirections() {
  return (
    <>
      <Stat label="Growing" value="1,204" delta="12%" direction="up" />
      <Stat label="Falling" value="68" delta="4%" direction="down" />
      <Stat label="Unchanged" value="94%" delta="0%" direction="flat" />
    </>
  );
}
