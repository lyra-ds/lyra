import { Button, Spinner } from '@lyra-ds/react';

export function SpinnerInContext() {
  return (
    <>
      <Button loading>Saving</Button>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <Spinner size="sm" />
        Checking the domain…
      </span>
    </>
  );
}
