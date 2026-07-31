'use client';

import { useTranslations } from 'next-intl';
import { Container } from '@lyra-ds/react';

export function SiteFooter() {
  const t = useTranslations();

  return (
    <footer className="lw-footer">
      <Container className="lw-footer__inner">
        <span className="lw-brand" style={{ cursor: 'default' }}>
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
        <span className="lw-footer__note">{t('footerNote')}</span>
        <div className="lw-footer__links">
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
        </div>
      </Container>
    </footer>
  );
}
