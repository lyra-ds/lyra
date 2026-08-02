'use client';

import { SegmentedControl } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const shortLabel: Record<Locale, string> = {
    en: t('localeEnglish'),
    'pt-BR': t('localePortuguese'),
  };

  function go(next: Locale) {
    if (next === locale) return;
    const parts = pathname.split('/');
    parts[1] = next;
    router.push(parts.join('/') || `/${next}`);
  }

  return (
    <SegmentedControl
      className="lw-locale-switcher"
      options={locales.map((option) => ({ value: option, label: shortLabel[option] }))}
      value={locale}
      onChange={(option) => go(option as Locale)}
      label={label}
    />
  );
}
