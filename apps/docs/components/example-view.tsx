'use client';

import { Card } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

/**
 * One documented example: the live component on a Lyra Card, with its own source
 * behind a toggle. The source node is highlighted on the server from the example's
 * file, so what you read is exactly what renders above it.
 */
/**
 * How the stage arranges an example.
 *
 * - `row` (default): a wrapping flex row — right for chips and controls sitting side by side.
 * - `block`: full-width rows — right for container components that would otherwise shrink to their
 *   content and leave the stage half empty.
 * - `plain`: full-width rows without the Card chrome — for components that are themselves a
 *   surface, so the example is not a card inside a card.
 */
export type ExampleLayout = 'row' | 'block' | 'plain';

export function ExampleView({
  children,
  layout = 'row',
  preview,
  source,
  title,
}: {
  children?: ReactNode;
  layout?: ExampleLayout;
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
      {layout === 'plain' ? (
        <div className="lw-example__stage--plain">{preview}</div>
      ) : (
        <Card
          className={
            layout === 'block' ? 'lw-example__stage lw-example__stage--block' : 'lw-example__stage'
          }
        >
          {preview}
        </Card>
      )}
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
