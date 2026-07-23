import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { DocsSidebar } from '@/components/docs-sidebar';
import { HtmlLang } from '@/components/html-lang';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { TableOfContents } from '@/components/toc';
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
      <SiteHeader locale={lang} />
      <div className="lw-container lw-docs">
        <DocsSidebar locale={lang} />
        <article className="lw-docs__content">{children}</article>
        <TableOfContents />
      </div>
      <SiteFooter />
    </NextIntlClientProvider>
  );
}
