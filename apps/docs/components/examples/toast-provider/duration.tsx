'use client';

import { Button, ToastProvider, useToast } from '@lyra-ds/react';

function PersistentToastButton() {
  const { toast } = useToast();

  return (
    <Button
      variant="secondary"
      onClick={() => toast('This reminder stays until dismissed', { duration: 0 })}
    >
      Add reminder
    </Button>
  );
}

export function ToastProviderDuration() {
  return (
    <ToastProvider duration={6000}>
      <PersistentToastButton />
    </ToastProvider>
  );
}
