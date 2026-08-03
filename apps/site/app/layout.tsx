import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@lyra-ds/styles/styles.css';
import './site.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Fallback metadata for every route OUTSIDE app/[lang]/ — in practice the
// bare-domain redirect page at "/", which is exactly the URL people share.
// The localized layouts override all of this per locale; without this block
// the root page ships with no <title> and no Open Graph tags at all, and
// WhatsApp refuses to render a preview that lacks a title.
const title = 'Lyra DS — CSS-first design system for SaaS products';
const description =
  'An open source, CSS-first design system for SaaS products. Semantic tokens, white-label theming in four tokens, and thin React wrappers over a CSS core that works in any framework.';
const image = {
  alt: title,
  height: 630,
  type: 'image/png',
  url: '/og.png',
  width: 1200,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://lyra-ds.dev'),
  icons: { icon: '/favicon.svg' },
  title,
  description,
  openGraph: {
    description,
    images: [image],
    siteName: 'Lyra DS',
    title,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    description,
    images: [image],
    title,
  },
};

const THEME_STORAGE_KEY = 'lyra-site-theme';
const themeScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=(s==='light'||s==='dark')?s:(d?'dark':'light');}catch(e){}})();`;

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
