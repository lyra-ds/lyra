import { Alert } from '@lyra-ds/react';

export function AlertTones() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Alert tone="info">Billing moves to the new invoice format on 1 September.</Alert>
      <Alert tone="success">Your workspace is now on the Team plan.</Alert>
      <Alert tone="warning">
        Two seats are unassigned and will expire at the end of the cycle.
      </Alert>
      <Alert tone="danger">We could not reach the payment provider. Nothing was charged.</Alert>
    </div>
  );
}
