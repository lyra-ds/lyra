'use client';

import { Icon } from '@lyra-ds/react';
import { useEffect, useState } from 'react';

/** Reads the theme applied by the pre-paint script, then toggles + persists it. */
export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('lyra-docs-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
    setDark(next);
  }

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
