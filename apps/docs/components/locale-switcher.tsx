'use client';

import { Button } from '@lyra-ds/react';
import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale() {
    const nextLocale: Locale = locale === 'en' ? 'pt-BR' : 'en';
    const parts = pathname.split('/');
    parts[1] = nextLocale;
    router.push(parts.join('/'));
  }

  return (
    <Button variant="ghost" size="sm" onClick={switchLocale}>
      {label}
    </Button>
  );
}
