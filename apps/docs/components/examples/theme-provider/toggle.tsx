'use client';

import { Button, ThemeProvider, useTheme } from '@lyra-ds/react';

function ThemeControls() {
  const { setTheme } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Button size="sm" variant="secondary" onClick={() => setTheme('light')}>
        Light
      </Button>
      <Button size="sm" variant="secondary" onClick={() => setTheme('dark')}>
        Dark
      </Button>
    </div>
  );
}

export function ThemeProviderToggle() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="lyra-docs-theme-provider-toggle">
      <ThemeControls />
    </ThemeProvider>
  );
}
