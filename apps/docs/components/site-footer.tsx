'use client';

import { useTranslations } from 'next-intl';
import { Brand, Footer } from '@lyra-ds/react';

export function SiteFooter() {
  const t = useTranslations();

  return (
    <Footer
      brand={
        <Brand mark="/lyra-mark.svg" markDark="/lyra-mark-light.svg">
          Lyra
        </Brand>
      }
      note={t('footerNote')}
      linksLabel={t('siteName')}
      links={
        <>
          <a href="https://github.com/lyra-ds" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://www.npmjs.com/org/lyra-ds" target="_blank" rel="noreferrer">
            npm
          </a>
          <a
            href="https://github.com/lyra-ds/lyra-ds/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noreferrer"
          >
            Contributing
          </a>
          <a href="/llms.txt">llms.txt</a>
        </>
      }
    />
  );
}
