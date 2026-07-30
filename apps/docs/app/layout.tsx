import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@lyra-ds/styles/styles.css';
import './site.css';
import { ThemeProvider } from '@lyra-ds/react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lyra DS',
  icons: { icon: '/favicon.svg' },
};

// One constant for both halves of the theme wiring: the pre-paint script below and the
// ThemeProvider that takes over after hydration must read the same key, or the site would boot
// with one theme and switch to another.
const THEME_STORAGE_KEY = 'lyra-docs-theme';

// Applies the theme before first paint (no flash): saved preference if any, otherwise the
// device's prefers-color-scheme. It has to be inline and blocking — anything deferred runs after
// the first paint, which is the flash it exists to prevent. The DS cannot ship this as a helper:
// every module in @lyra-ds/react carries "use client", so a server component could not call it.
const themeScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=(s==='light'||s==='dark')?s:(d?'dark':'light');}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider storageKey={THEME_STORAGE_KEY}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
