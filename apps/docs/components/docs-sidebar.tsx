'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { components, groupLabelKey, groupOrder } from '@/lib/components';
import type { Locale } from '@/lib/i18n';

function itemClass(active: boolean) {
  return ['lw-docs__item', active && 'lw-docs__item--active'].filter(Boolean).join(' ');
}

export function DocsSidebar({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const pathname = usePathname();
  const home = `/${locale}`;
  const componentsHref = `/${locale}/components`;

  return (
    <aside className="lw-docs__side">
      <div className="lw-docs__group">
        <span className="lw-docs__group-title">{t('introduction')}</span>
        <Link href={home} className={itemClass(pathname === home)}>
          {t('gettingStarted')}
        </Link>
        <Link href={componentsHref} className={itemClass(pathname === componentsHref)}>
          {t('components')}
        </Link>
      </div>
      {groupOrder.map((group) => {
        const items = components.filter((entry) => entry.group === group);
        if (items.length === 0) return null;

        return (
          <div className="lw-docs__group" key={group}>
            <span className="lw-docs__group-title">{t(groupLabelKey[group])}</span>
            {items.map((entry) => {
              const href = `${componentsHref}/${entry.slug}`;
              return (
                <Link key={entry.slug} href={href} className={itemClass(pathname === href)}>
                  {entry.name}
                </Link>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}
