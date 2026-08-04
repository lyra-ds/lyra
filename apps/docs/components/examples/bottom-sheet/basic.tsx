'use client';

import { BottomSheet, Button } from '@lyra-ds/react';
import { useState } from 'react';

export function BottomSheetBasic() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open project details
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Project details"
        closeLabel="Close project details"
      >
        Review the latest milestone, owners and activity before you continue.
      </BottomSheet>
    </>
  );
}
