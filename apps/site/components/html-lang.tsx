'use client';

import { useEffect } from 'react';
import type { Locale } from '@/lib/i18n';

/** Keeps the document `<html lang>` in sync with the active locale. */
export function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
