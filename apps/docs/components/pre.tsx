'use client';

import { useTranslations } from 'next-intl';
import { CodeBlock } from '@lyra-ds/react';
import type { ComponentPropsWithoutRef } from 'react';

type PreProps = Pick<ComponentPropsWithoutRef<'pre'>, 'children' | 'className' | 'style'> & {
  'data-language'?: string;
};

/**
 * Code panel: the design system's CodeBlock wrapping Shiki-highlighted output.
 * Token colors come from Shiki's dual theme (light/dark) via CSS variables, so
 * the panel follows the active [data-theme].
 *
 * `lineNumbers` is opt-in on the component but always on here: the docs numbered
 * every panel before the migration, and dropping it would be a silent regression.
 */
export function Pre({ children, className, style, 'data-language': language }: PreProps) {
  const t = useTranslations();

  return (
    <CodeBlock
      className={className}
      style={style}
      language={language}
      lineNumbers
      copyLabel={t('copy')}
      copiedLabel={t('copied')}
    >
      {children}
    </CodeBlock>
  );
}
