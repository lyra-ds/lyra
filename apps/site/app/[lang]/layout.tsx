import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '@lyra-ds/react';
import type { ReactNode } from 'react';
import { HtmlLang } from '@/components/html-lang';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

const themeStorageKey = 'lyra-site-theme';

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
    <ThemeProvider storageKey={themeStorageKey}>
      <NextIntlClientProvider locale={lang} messages={messages}>
        <HtmlLang locale={lang} />
        <SiteHeader locale={lang} />
        {children}
        <SiteFooter />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
