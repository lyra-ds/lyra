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

// Applies the persisted theme before first paint (no flash, survives reload).
const themeScript = `(function(){try{var t=localStorage.getItem('lyra-docs-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light';}catch(e){}})();`;

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
