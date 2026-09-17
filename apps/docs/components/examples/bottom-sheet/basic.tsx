'use client';

import { BottomSheet, Button } from '@lyra-ds/react';
import { useRef, useState } from 'react';

export function BottomSheetBasic() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button ref={triggerRef} variant="secondary" onClick={() => setOpen(true)}>
        Open project details
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        returnFocusTo={() => triggerRef.current}
        title="Project details"
        closeLabel="Close project details"
      >
        Review the latest milestone, owners and activity before you continue.
      </BottomSheet>
    </>
  );
}
