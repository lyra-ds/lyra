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
      <p style={{ color: 'var(--text-muted)' }}>{t('componentsIntro')}</p>
      {groupOrder.map((group) => {
        const items = components.filter((entry) => entry.group === group);
        if (items.length === 0) return null;

        return (
          <section key={group} style={{ marginTop: 'var(--space-6)' }}>
            <h2>{t(groupLabelKey[group])}</h2>
            <ul
              style={{
                display: 'grid',
                gap: 'var(--space-2)',
                gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {items.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    className="lyra-card lyra-card--padded"
                    href={`/${lang}/components/${entry.slug}`}
                    style={{ color: 'var(--text-primary)', display: 'block' }}
                  >
                    {entry.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
