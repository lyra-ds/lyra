'use client';

import { Brand, Button, Icon, Navbar, NavLink } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { DOCS_ORIGIN } from '@/lib/links';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations();

  return (
    <Navbar
      brand={
        <Brand asChild mark="/lyra-mark.svg" markDark="/lyra-mark-light.svg">
          <Link href={`/${locale}`}>{t('brandName')}</Link>
        </Brand>
      }
      navLabel={t('siteNavigation')}
      nav={
        <>
          <NavLink href="#components">{t('components')}</NavLink>
          <NavLink href="#frameworks">{t('frameworks')}</NavLink>
          <NavLink href="#theming">{t('theming')}</NavLink>
          <NavLink href="#faq">{t('faq')}</NavLink>
        </>
      }
      actions={
        <>
          <LocaleSwitcher locale={locale} label={t('languageLabel')} />
          <ThemeToggle label={t('theme')} />
          <NavLink
            href="https://github.com/lyra-ds"
            target="_blank"
            rel="noreferrer"
            aria-label={t('github')}
            title={t('github')}
          >
            <Icon name="github" size={18} />
          </NavLink>
          <Button asChild size="sm" iconRight={<Icon name="arrow-right" size={16} />}>
            <a href={`${DOCS_ORIGIN}/${locale}`}>{t('documentation')}</a>
          </Button>
        </>
      }
    />
  );
}
