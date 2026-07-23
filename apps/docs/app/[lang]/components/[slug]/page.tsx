import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ComponentPage } from '@/components/component-page';
import { componentSlugs, getComponent } from '@/lib/components';
import { isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.flatMap((lang) => componentSlugs.map((slug) => ({ lang, slug })));
}

export const dynamicParams = false;

export default async function ComponentDocPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (!isLocale(lang) || !getComponent(slug)) notFound();
  setRequestLocale(lang);

  return <ComponentPage locale={lang} slug={slug} />;
}
