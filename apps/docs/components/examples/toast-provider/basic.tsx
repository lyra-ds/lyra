'use client';

import { Button, ToastProvider, useToast } from '@lyra-ds/react';

function ToastButton() {
  const { success } = useToast();

  return <Button onClick={() => success('Project published')}>Publish project</Button>;
}

export function ToastProviderBasic() {
  return (
    <ToastProvider>
      <ToastButton />
    </ToastProvider>
  );
}
