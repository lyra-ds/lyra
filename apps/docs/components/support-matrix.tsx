'use client';

import { Icon, Table } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { getSupportMatrixRows, type SupportCell } from '@/lib/support-matrix';

function SupportStatus({ cell }: { cell: SupportCell }) {
  const t = useTranslations();

  if (cell.supported) {
    return (
      <span>
        <Icon name="check" size={16} /> {t('supported')}
      </span>
    );
  }

  return (
    <span>
      <Icon name="x" size={16} /> {t('notSupported')}
      {cell.reasonKey ? <span> — {t(cell.reasonKey)}</span> : null}
    </span>
  );
}

export function SupportMatrix({ locale }: { locale: Locale }) {
  const t = useTranslations();

  return (
    <Table
      columns={[
        { key: 'component', label: t('components') },
        { key: 'react', label: t('stackReact') },
        { key: 'htmlAlpine', label: t('stackAlpine') },
        { key: 'blade', label: t('stackBlade') },
      ]}
      rows={getSupportMatrixRows().map((row) => ({
        component: <Link href={`/${locale}/components/${row.slug}`}>{row.name}</Link>,
        id: row.slug,
        react: <SupportStatus cell={row.stacks.react} />,
        htmlAlpine: <SupportStatus cell={row.stacks.html} />,
        blade: <SupportStatus cell={row.stacks.blade} />,
      }))}
    />
  );
}
