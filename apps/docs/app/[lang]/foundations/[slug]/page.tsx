import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FoundationPage } from '@/components/foundation-page';
import { foundationSlugs, getFoundation } from '@/lib/foundations';
import { isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.flatMap((lang) => foundationSlugs.map((slug) => ({ lang, slug })));
}

export const dynamicParams = false;

export default async function FoundationDocPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (!isLocale(lang) || !getFoundation(slug)) notFound();
  setRequestLocale(lang);

  return <FoundationPage locale={lang} slug={slug} />;
}
