import { Progress } from '@lyra-ds/react';

export function ProgressLabelled() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span id="import-label">Importing records</span>
        <span>62%</span>
      </div>
      <Progress value={62} aria-labelledby="import-label" />
    </div>
  );
}
