'use client';

import { Icon, useTheme } from '@lyra-ds/react';

/**
 * Theme switch for the site chrome. All the state lives in the DS `ThemeProvider` — this is only
 * the button, which is the point: the docs site consumes the same API a reader would.
 */
export function ThemeToggle({ label }: { label: string }) {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      className="lw-nav__link"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
