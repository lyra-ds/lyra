'use client';

import { SidebarGroup } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { components, groupLabelKey, groupOrder } from '@/lib/components';
import { guides } from '@/lib/guides';
import type { Locale } from '@/lib/i18n';

function itemClass(active: boolean) {
  return ['lyra-sbgroup__item', active && 'lyra-sbgroup__item--active'].filter(Boolean).join(' ');
}

/**
 * Bring the current page's entry into view inside the rail's own scroll, once, on mount.
 *
 * The rail scrolls independently of the document, so on a fresh load the active entry can sit far
 * below the fold — on this site the list is long enough that the last components are two screens
 * down. This runs only on mount: during client-side navigation the reader clicked the entry, so it
 * is already where they were looking, and moving the rail under their cursor would be hostile.
 *
 * `scrollIntoView` is deliberately avoided — it also scrolls the document, which would drop the
 * reader past the page heading. Setting `scrollTop` moves the rail and nothing else.
 */
function useRevealActiveEntry() {
  useEffect(() => {
    // Both the hidden Shell rail and the mobile Drawer can hold a copy of this list; reveal the
    // visible one (offsetParent is null inside display: none).
    const active = [...document.querySelectorAll<HTMLElement>('.lyra-sbgroup__item--active')].find(
      (entry) => entry.offsetParent !== null,
    );
    const node = active?.closest<HTMLElement>('.lyra-shell__sidebar, .lyra-drawer__body');
    if (!node || !active) return;

    const visible = node.clientHeight;
    const target = active.offsetTop - visible / 2 + active.offsetHeight / 2;
    node.scrollTop = Math.max(0, Math.min(target, node.scrollHeight - visible));
    // Mount only: see the note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function DocsSidebar({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const pathname = usePathname();
  const home = `/${locale}`;
  const componentsHref = `/${locale}/components`;

  useRevealActiveEntry();

  return (
    <>
      <SidebarGroup label={t('introduction')} collapsible>
        <Link href={home} className={itemClass(pathname === home)}>
          {t('overview')}
        </Link>
        {guides.map((guide) => {
          const href = `/${locale}/guides/${guide.slug}`;
          return (
            <Link key={guide.slug} href={href} className={itemClass(pathname === href)}>
              {t(guide.titleKey)}
            </Link>
          );
        })}
        <Link href={componentsHref} className={itemClass(pathname === componentsHref)}>
          {t('components')}
        </Link>
      </SidebarGroup>
      {groupOrder.map((group) => {
        const items = components.filter((entry) => entry.group === group);
        if (items.length === 0) return null;

        return (
          <SidebarGroup label={t(groupLabelKey[group])} collapsible key={group}>
            {items.map((entry) => {
              const href = `${componentsHref}/${entry.slug}`;
              return (
                <Link key={entry.slug} href={href} className={itemClass(pathname === href)}>
                  {entry.name}
                </Link>
              );
            })}
          </SidebarGroup>
        );
      })}
    </>
  );
}
