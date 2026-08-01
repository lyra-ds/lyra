'use client';

import { Icon, IconButton, useTheme } from '@lyra-ds/react';

/**
 * Theme switch for the site chrome. All the state lives in the DS `ThemeProvider` — this is only
 * the button, which is the point: the docs site consumes the same API a reader would.
 */
export function ThemeToggle({ label }: { label: string }) {
  const { dark, toggle } = useTheme();

  return (
    <IconButton type="button" variant="ghost" onClick={toggle} label={label}>
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </IconButton>
  );
}
