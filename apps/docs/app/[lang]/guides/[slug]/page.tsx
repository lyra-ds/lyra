import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { GuidePage } from '@/components/guide-page';
import { guideSlugs, getGuide } from '@/lib/guides';
import { isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.flatMap((lang) => guideSlugs.map((slug) => ({ lang, slug })));
}

export const dynamicParams = false;

export default async function GuideDocPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  if (!isLocale(lang) || !getGuide(slug)) notFound();
  setRequestLocale(lang);

  return <GuidePage locale={lang} slug={slug} />;
}
