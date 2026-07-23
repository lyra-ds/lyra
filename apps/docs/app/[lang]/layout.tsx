import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@lyra-ds/styles/styles.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { SiteChrome } from '@/components/site-chrome';
import { isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  setRequestLocale(lang);
  const messages = await getMessages();

  return (
    <html lang={lang} data-theme="light">
      <body>
        <NextIntlClientProvider locale={lang} messages={messages}>
          <SiteChrome locale={lang} />
          <main
            style={{
              margin: '0 auto',
              maxWidth: '72rem',
              padding: 'var(--space-8) var(--space-6)',
            }}
          >
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
