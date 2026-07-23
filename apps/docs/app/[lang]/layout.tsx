import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { HtmlLang } from '@/components/html-lang';
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
    <NextIntlClientProvider locale={lang} messages={messages}>
      <HtmlLang locale={lang} />
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
  );
}
