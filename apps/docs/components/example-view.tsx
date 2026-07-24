'use client';

import { Card } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

/**
 * One documented example: the live component on a Lyra Card, with its own source
 * behind a toggle. The source node is highlighted on the server from the example's
 * file, so what you read is exactly what renders above it.
 */
export function ExampleView({
  children,
  preview,
  source,
  title,
}: {
  children?: ReactNode;
  preview: ReactNode;
  source: ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <section className="lw-example">
      {title ? <h3 className="lw-example__title">{title}</h3> : null}
      {children}
      <Card className="lw-example__stage">{preview}</Card>
      <button
        type="button"
        className="lw-example__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? t('hideCode') : t('showCode')}
      </button>
      {open ? <div className="lw-example__code">{source}</div> : null}
    </section>
  );
}
