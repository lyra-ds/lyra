'use client';

import { BottomSheet, Button } from '@lyra-ds/react';
import { useRef, useState } from 'react';

export function BottomSheetLabelledWithoutTitle() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button ref={triggerRef} variant="secondary" onClick={() => setOpen(true)}>
        Open project actions
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        returnFocusTo={() => triggerRef.current}
        aria-label="Project actions"
        closeLabel="Close project actions"
      >
        Choose the next action for Atlas.
      </BottomSheet>
    </>
  );
}
