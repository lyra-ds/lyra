'use client';

import { Button, Icon } from '@lyra-ds/react';
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
    <header className="lw-header">
      <div className="lw-container lw-header__inner">
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
        <nav className="lw-nav">
          <Link
            href={`/${locale}`}
            className={['lw-nav__link', !onComponents && 'lw-nav__link--active']
              .filter(Boolean)
              .join(' ')}
          >
            {t('navDocs')}
          </Link>
          <Link
            href={`/${locale}/components`}
            className={['lw-nav__link', onComponents && 'lw-nav__link--active']
              .filter(Boolean)
              .join(' ')}
          >
            {t('components')}
          </Link>
        </nav>
        <div className="lw-header__actions">
          <CommandMenu locale={locale} />
          <ThemeToggle label={t('theme')} />
          <LocaleSwitcher locale={locale} label={t('languageLabel')} />
          <a
            className="lw-nav__link"
            href="https://github.com/lyra-ds"
            target="_blank"
            rel="noreferrer"
            aria-label={t('github')}
            title={t('github')}
          >
            <Icon name="github" size={18} />
          </a>
          <Button
            size="sm"
            iconRight={<Icon name="arrow-right" size={16} />}
            onClick={() => router.push(`/${locale}/components`)}
          >
            {t('getStarted')}
          </Button>
        </div>
      </div>
    </header>
  );
}
