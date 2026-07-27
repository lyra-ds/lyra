'use client';

import { Button, Dialog } from '@lyra-ds/react';
import { useState } from 'react';

// A dialog the user must resolve deliberately: Escape and backdrop clicks are off,
// and omitting `onClose` would also drop the × — so the footer is the only way out.
export function DialogDismissal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Review terms
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Accept the updated terms"
        closeOnEsc={false}
        closeOnOverlayClick={false}
        footer={<Button onClick={() => setOpen(false)}>I agree</Button>}
      >
        Escape and backdrop clicks are disabled here, so this choice cannot be dismissed by
        accident.
      </Dialog>
    </>
  );
}
