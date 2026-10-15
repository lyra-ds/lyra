'use client';

import { Button, ToastProvider, useToast } from '@lyra-ds/react';

function PersistentToastButton() {
  const { toast, dismiss } = useToast();

  return (
    <Button
      variant="secondary"
      onClick={() => {
        const id = toast(
          <>
            Review this reminder when ready.{' '}
            <Button variant="secondary" onClick={() => dismiss(id)}>
              Done
            </Button>
          </>,
          { duration: 0 },
        );
      }}
    >
      Add reminder
    </Button>
  );
}

export function ToastProviderDuration() {
  return (
    <ToastProvider duration={6000} aria-label="Persistent reminders">
      <PersistentToastButton />
    </ToastProvider>
  );
}
