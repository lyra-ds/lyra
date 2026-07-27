'use client';

import { CommandPalette, Icon, type CommandGroup } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { components, groupLabelKey, groupOrder } from '@/lib/components';
import type { Locale } from '@/lib/i18n';

/**
 * ⌘K command palette + a visible header search trigger, both driving the Lyra
 * CommandPalette. The index is built statically from the component manifest, so
 * it grows with the docs and needs no server or search service.
 */
export function CommandMenu({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const componentGroups: CommandGroup[] = groupOrder
    .map((group) => ({ group, items: components.filter((entry) => entry.group === group) }))
    .filter((entry) => entry.items.length > 0)
    .map((entry) => ({
      label: t(groupLabelKey[entry.group]),
      items: entry.items.map((component) => ({
        id: component.slug,
        label: component.name,
        onSelect: () => go(`/${locale}/components/${component.slug}`),
      })),
    }));

  const groups: CommandGroup[] = [
    {
      label: t('introduction'),
      items: [
        { id: 'home', label: t('gettingStarted'), onSelect: () => go(`/${locale}`) },
        { id: 'components', label: t('components'), onSelect: () => go(`/${locale}/components`) },
      ],
    },
    ...componentGroups,
  ];

  return (
    <>
      <button type="button" className="lw-search" onClick={() => setOpen(true)}>
        <Icon name="search" size={16} />
        <span className="lw-search__label">{t('search')}</span>
        <kbd className="lw-search__kbd">⌘K</kbd>
      </button>
      <CommandPalette
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        groups={groups}
        placeholder={t('search')}
        emptyMessage={t('searchEmpty')}
        aria-label={t('searchLandmark')}
        hints={{
          navigate: t('searchHintNavigate'),
          select: t('searchHintSelect'),
          close: t('searchHintClose'),
        }}
      />
    </>
  );
}
