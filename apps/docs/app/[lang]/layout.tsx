import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Container, Shell } from '@lyra-ds/react';
import type { CSSProperties, ReactNode } from 'react';
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

const proseStyle: CSSProperties & { '--prose-scroll-offset'?: string } = {
  '--prose-scroll-offset': '80px',
};

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
  const [messages, t] = await Promise.all([getMessages(), getTranslations()]);

  return (
    <NextIntlClientProvider locale={lang} messages={messages}>
      <HtmlLang locale={lang} />
      <SiteHeader locale={lang} />
      <Container>
        <Shell
          sidebar={<DocsSidebar locale={lang} />}
          sidebarAs="nav"
          sidebarLabel={t('documentationNavigation')}
          aside={<TableOfContents />}
          asideLabel={t('onThisPage')}
          top={84}
        >
          <div className="lyra-prose" style={proseStyle}>
            {children}
          </div>
        </Shell>
      </Container>
      <SiteFooter />
    </NextIntlClientProvider>
  );
}
