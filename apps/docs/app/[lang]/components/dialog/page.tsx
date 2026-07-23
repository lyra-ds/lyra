import { setRequestLocale } from 'next-intl/server';
import { DocumentContent } from '@/components/document-content';
import { isLocale } from '@/lib/i18n';

export default async function DialogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  if (!isLocale(lang)) return null;
  setRequestLocale(lang);

  return <DocumentContent locale={lang} page="dialog" />;
}
