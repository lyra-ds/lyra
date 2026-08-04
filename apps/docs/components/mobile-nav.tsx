'use client';

import { Drawer, Icon } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DocsSidebar } from '@/components/docs-sidebar';
import type { Locale } from '@/lib/i18n';

/** Mobile documentation navigation, kept separate from the desktop Shell rail. */
export function MobileNav({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="lw-mobile-nav__trigger"
        aria-label={t('documentationNavigation')}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t('documentationNavigation')}
        onClick={() => setOpen(true)}
      >
        <Icon name="list" size={20} />
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('documentationNavigation')}
        closeLabel={t('close')}
      >
        <DocsSidebar locale={locale} />
      </Drawer>
    </>
  );
}
