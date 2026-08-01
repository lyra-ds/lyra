'use client';

import { usePathname, useRouter } from 'next/navigation';
import { SegmentedControl } from '@lyra-ds/react';
import { locales, type Locale } from '@/lib/i18n';

const shortLabel: Record<Locale, string> = { en: 'EN', 'pt-BR': 'PT' };

/**
 * Segmented language toggle (EN | PT). The current locale is highlighted, so
 * there is no current-vs-target ambiguity; clicking the other one navigates,
 * keeping the current page.
 */
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function go(next: Locale) {
    if (next === locale) return;
    const parts = pathname.split('/');
    parts[1] = next;
    router.push(parts.join('/') || `/${next}`);
  }

  return (
    <SegmentedControl
      options={locales.map((option) => ({ value: option, label: shortLabel[option] }))}
      value={locale}
      onChange={(option) => go(option as Locale)}
      label={label}
    />
  );
}
