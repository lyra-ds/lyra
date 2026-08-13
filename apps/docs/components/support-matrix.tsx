'use client';

import { Table } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { getSupportMatrixRows, type SupportCell } from '@/lib/support-matrix';

function EvidenceStatus({
  evidence,
  locale,
}: {
  evidence: Exclude<SupportCell, { level: 'unsupported' }>['evidence'];
  locale: Locale;
}) {
  const t = useTranslations();

  return (
    <small>
      {' — '}
      <a href={`/${locale}/guides/support${evidence.href}`}>{t(evidence.statusKey)}</a>
      {'; '}
      {t(evidence.reevaluationOwnerKey)}
    </small>
  );
}

function SupportStatus({ cell, locale }: { cell: SupportCell; locale: Locale }) {
  const t = useTranslations();

  if (cell.level !== 'unsupported') {
    return (
      <span>
        {t(`supportLevel${cell.level}`)}
        <EvidenceStatus evidence={cell.evidence} locale={locale} />
      </span>
    );
  }

  return (
    <details>
      <summary>{t('supportLevelUnsupported')}</summary>
      <dl>
        <dt>{t('supportMissingCapability')}</dt>
        <dd>{t(cell.gap.missingCapabilityKey)}</dd>
        <dt>{t('supportReason')}</dt>
        <dd>{t(cell.gap.reasonKey)}</dd>
        <dt>{t('supportUserImpact')}</dt>
        <dd>{t(cell.gap.userImpactKey)}</dd>
        <dt>{t('supportFallback')}</dt>
        <dd>{t(cell.gap.fallbackKey)}</dd>
        <dt>{t('supportEvidence')}</dt>
        <dd>
          <a href={`/${locale}/guides/support${cell.gap.evidenceHref}`}>
            {t(cell.gap.evidenceStatusKey)}
          </a>
        </dd>
        <dt>{t('supportReevaluationOwner')}</dt>
        <dd>{t(cell.gap.reevaluationOwnerKey)}</dd>
      </dl>
    </details>
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
        react: <SupportStatus cell={row.stacks.react} locale={locale} />,
        htmlAlpine: (
          <SupportStatus
            cell={row.stacks.alpine.level === 'unsupported' ? row.stacks.html : row.stacks.alpine}
            locale={locale}
          />
        ),
        blade: <SupportStatus cell={row.stacks.blade} locale={locale} />,
      }))}
    />
  );
}
