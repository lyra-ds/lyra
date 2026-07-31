'use client';

import { useTranslations } from 'next-intl';
import { Footer } from '@lyra-ds/react';

export function SiteFooter() {
  const t = useTranslations();

  return (
    <Footer
      brand={
        <span className="lw-brand lw-brand--static">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lyra-mark.svg"
            alt=""
            className="lw-mark ld-mark-light"
            width={24}
            height={24}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lyra-mark-light.svg"
            alt=""
            className="lw-mark ld-mark-dark"
            width={24}
            height={24}
          />
          <span className="lw-brand__word">Lyra</span>
        </span>
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
