'use client';

import { IconButton } from '@lyra-ds/react';
import { useEffect, useState } from 'react';

export function ThemeToggle({ label }: { label: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('lyra-docs-theme');
    const dark = savedTheme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    setIsDark(dark);
  }, []);

  function toggleTheme() {
    const dark = !isDark;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    window.localStorage.setItem('lyra-docs-theme', dark ? 'dark' : 'light');
    setIsDark(dark);
  }

  return (
    <IconButton label={label} onClick={toggleTheme} variant="ghost">
      <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
    </IconButton>
  );
}
