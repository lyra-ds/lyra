'use client';

import { ThemeProvider, useTheme } from '@lyra-ds/react';

function ThemeStatus() {
  const { resolvedTheme, theme } = useTheme();

  return (
    <p style={{ margin: 0 }}>
      Preference: <strong>{theme}</strong>; applied theme: <strong>{resolvedTheme}</strong>.
    </p>
  );
}

export function ThemeProviderSystem() {
  return (
    <ThemeProvider storageKey="lyra-docs-theme-provider-system">
      <ThemeStatus />
    </ThemeProvider>
  );
}
