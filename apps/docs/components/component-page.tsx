import type { ComponentType } from 'react';
import type { Locale } from '@/lib/i18n';
import { Pre } from './pre';
import { previews } from './previews';
import { PropTable } from './prop-table';

type MdxModule = {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

/**
 * Renders a single component's MDX page for the given locale. The MDX module is
 * loaded by slug via a webpack context (static-export safe — every slug is
 * enumerated by `generateStaticParams`), so no per-component import is hardcoded.
 */
export async function ComponentPage({ locale, slug }: { locale: Locale; slug: string }) {
  const mod = (await import(`../content/docs/${locale}/components/${slug}.mdx`)) as MdxModule;
  const MDX = mod.default;
  const Preview = previews[slug];

  return <MDX components={{ Preview, PropTable, pre: Pre }} />;
}
