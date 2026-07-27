'use client';

import { Button } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n';

/**
 * Home hero CTAs, in TSX (not MDX) so `Button asChild` reliably receives a
 * single element child — MDX leaves whitespace text nodes between tags, which
 * trips `Children.only`.
 */
export function HeroActions({ locale }: { locale: Locale }) {
  const t = useTranslations();

  return (
    <div className="lw-hero__cta">
      <Button asChild variant="primary" size="lg">
        <a href={`/${locale}/components`}>{t('heroBrowse')}</a>
      </Button>
      <Button asChild variant="secondary" size="lg">
        <a href={`/${locale}/components/button`}>{t('getStarted')}</a>
      </Button>
    </div>
  );
}
