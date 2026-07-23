'use client';

import { usePathname, useRouter } from 'next/navigation';
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
    <div className="lw-locale" role="group" aria-label={label}>
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          className={['lw-locale__opt', option === locale && 'lw-locale__opt--active']
            .filter(Boolean)
            .join(' ')}
          aria-current={option === locale ? 'true' : undefined}
          onClick={() => go(option)}
        >
          {shortLabel[option]}
        </button>
      ))}
    </div>
  );
}
