'use client';

import { BottomSheet, Button } from '@lyra-ds/react';
import { useState } from 'react';

export function BottomSheetLabelledWithoutTitle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open project actions
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        aria-label="Project actions"
        closeLabel="Close project actions"
      >
        Choose the next action for Atlas.
      </BottomSheet>
    </>
  );
}
