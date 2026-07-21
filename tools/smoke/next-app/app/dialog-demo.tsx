'use client';

// Client-boundary component (its OWN "use client" directive) exercising Dialog — the
// overlay pilot uses hooks (useState here + Dialog's internal focus-trap/scroll-lock/
// presence hooks), so it must live on a client boundary. The server page imports and
// renders this without error, proving the client-boundary composition works end to end.
import { useState } from 'react';
import { Button, Dialog } from '@lyra-ds/react';

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Confirm action">
        Rendered from a Next.js client boundary via the packed @lyra-ds/react tarball.
      </Dialog>
    </>
  );
}
