'use client';

import { Brand, Footer } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n';

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = useTranslations();

  return (
    <Footer
      brand={
        <Brand mark="/lyra-mark.svg" markDark="/lyra-mark-light.svg">
          {t('brandName')}
        </Brand>
      }
      note={t('footerNote')}
      linksLabel={t('siteName')}
      links={
        <>
          <a href="https://github.com/lyra-ds" target="_blank" rel="noreferrer">
            {t('githubLabel')}
          </a>
          <a href="https://www.npmjs.com/org/lyra-ds" target="_blank" rel="noreferrer">
            {t('npm')}
          </a>
          <a
            href="https://github.com/lyra-ds/lyra-ds/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noreferrer"
          >
            {t('contributing')}
          </a>
          <a href={`/${locale}/privacy`}>{t('privacyTitle')}</a>
        </>
      }
    />
  );
}
