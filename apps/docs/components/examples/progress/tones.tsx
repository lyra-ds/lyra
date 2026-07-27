import { Progress } from '@lyra-ds/react';

export function ProgressTones() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Progress value={45} aria-label="Upload progress" />
      <Progress value={100} tone="success" aria-label="Backup complete" />
      <Progress value={88} tone="danger" aria-label="Storage used" />
    </div>
  );
}
