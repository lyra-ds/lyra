import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@lyra-ds/styles/styles.css';
import './site.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Lyra DS',
  icons: { icon: '/favicon.svg' },
};

// Applies the theme before first paint (no flash): saved preference if any,
// otherwise the device's prefers-color-scheme.
const themeScript = `(function(){try{var s=localStorage.getItem('lyra-docs-theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=(s||(d?'dark':'light'));}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
