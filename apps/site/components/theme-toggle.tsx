'use client';

import { Icon, IconButton, useTheme } from '@lyra-ds/react';

export function ThemeToggle({ label }: { label: string }) {
  const { dark, toggle } = useTheme();

  return (
    <IconButton
      type="button"
      className="lw-theme-toggle"
      variant="ghost"
      onClick={toggle}
      label={label}
    >
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </IconButton>
  );
}
