import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

export async function SiteChrome({ locale }: { locale: Locale }) {
  const t = await getTranslations();

  return (
    <header
      className="lyra-card"
      style={{
        alignItems: 'center',
        borderRadius: 0,
        borderLeft: 0,
        borderRight: 0,
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-6)',
      }}
    >
      <Link
        href={`/${locale}`}
        style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-bold)' }}
      >
        {t('siteName')}
      </Link>
      <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--space-1)' }}>
        <LocaleSwitcher locale={locale} label={t('language')} />
        <ThemeToggle label={t('theme')} />
      </div>
    </header>
  );
}
