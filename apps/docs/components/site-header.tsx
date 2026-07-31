'use client';

import { Button, Icon, Navbar, NavLink } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { CommandMenu } from './command-menu';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const onComponents = pathname.includes('/components');

  return (
    <Navbar
      brand={
        <Link href={`/${locale}`} className="lw-brand">
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
        </Link>
      }
      navLabel={t('siteNavigation')}
      nav={
        <>
          <NavLink asChild active={!onComponents}>
            <Link href={`/${locale}`}>{t('navDocs')}</Link>
          </NavLink>
          <NavLink asChild active={onComponents}>
            <Link href={`/${locale}/components`}>{t('components')}</Link>
          </NavLink>
        </>
      }
      actions={
        <>
          <CommandMenu locale={locale} />
          <ThemeToggle label={t('theme')} />
          <LocaleSwitcher locale={locale} label={t('languageLabel')} />
          <NavLink
            href="https://github.com/lyra-ds"
            target="_blank"
            rel="noreferrer"
            aria-label={t('github')}
            title={t('github')}
          >
            <Icon name="github" size={18} />
          </NavLink>
          <Button
            className="lw-header__cta"
            size="sm"
            iconRight={<Icon name="arrow-right" size={16} />}
            onClick={() => router.push(`/${locale}/components`)}
          >
            {t('getStarted')}
          </Button>
        </>
      }
    />
  );
}
