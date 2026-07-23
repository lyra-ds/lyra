import type { ComponentType } from 'react';
import EnIndex from '@/content/docs/en/index.mdx';
import PtBrIndex from '@/content/docs/pt-BR/index.mdx';
import type { Locale } from '@/lib/i18n';
import { Pre } from './pre';
import { PropTable } from './prop-table';

const content: Record<
  Locale,
  ComponentType<{ components?: Record<string, ComponentType<any>> }>
> = {
  en: EnIndex,
  'pt-BR': PtBrIndex,
};

/** Renders the localized landing (index) MDX. Component pages use `ComponentPage`. */
export function DocumentContent({ locale }: { locale: Locale }) {
  const Content = content[locale];

  return <Content components={{ PropTable, pre: Pre }} />;
}
