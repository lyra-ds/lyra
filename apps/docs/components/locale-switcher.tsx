'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

/** Swaps the first path segment to the other locale, keeping the current page. */
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale() {
    const nextLocale: Locale = locale === 'en' ? 'pt-BR' : 'en';
    const parts = pathname.split('/');
    parts[1] = nextLocale;
    router.push(parts.join('/') || `/${nextLocale}`);
  }

  return (
    <button type="button" className="lw-nav__link" onClick={switchLocale}>
      {label}
    </button>
  );
}
