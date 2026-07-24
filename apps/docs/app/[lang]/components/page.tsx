import { Card } from '@lyra-ds/react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { components, type ComponentGroup } from '@/lib/components';
import { isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

const groupOrder: ComponentGroup[] = [
  'display',
  'form',
  'navigation',
  'feedback',
  'overlay',
  'layout',
];

const groupLabelKey: Record<ComponentGroup, string> = {
  display: 'groupDisplay',
  form: 'groupForm',
  navigation: 'groupNavigation',
  feedback: 'groupFeedback',
  overlay: 'groupOverlay',
  layout: 'groupLayout',
};

export default async function ComponentsIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();
  setRequestLocale(lang);
  const t = await getTranslations();

  return (
    <div>
      <h1>{t('components')}</h1>
      <p className="lw-index__intro">{t('componentsIntro')}</p>
      {groupOrder.map((group) => {
        const items = components.filter((entry) => entry.group === group);
        if (items.length === 0) return null;

        return (
          <section key={group} className="lw-index__group">
            <h2>{t(groupLabelKey[group])}</h2>
            <ul className="lw-index__grid">
              {items.map((entry) => (
                <li key={entry.slug}>
                  <Card asChild interactive>
                    <Link className="lw-index__card" href={`/${lang}/components/${entry.slug}`}>
                      {entry.name}
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
