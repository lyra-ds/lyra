import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { isLocale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) return {};

  const t = await getTranslations({ locale: lang });
  const url = `/${lang}/privacy`;
  const languages = {
    en: '/en/privacy',
    'pt-BR': '/pt-BR/privacy',
    'x-default': '/en/privacy',
  };
  const image = '/opengraph-image';

  return {
    title: t('privacyMetadataTitle'),
    description: t('privacyMetadataDescription'),
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      title: t('privacyMetadataTitle'),
      description: t('privacyMetadataDescription'),
      url,
      locale: lang === 'en' ? 'en_US' : 'pt_BR',
      images: [{ url: image, width: 1200, height: 630, alt: t('privacyMetadataTitle') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('privacyMetadataTitle'),
      description: t('privacyMetadataDescription'),
      images: [image],
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations();

  return (
    <main>
      <div className="lw-container lw-section">
        <article className="lyra-prose">
          <h1>{t('privacyTitle')}</h1>
          <p>{t('privacyLastUpdated')}</p>
          <h2>{t('privacyWhoResponsibleTitle')}</h2>
          <p>{t('privacyWhoResponsible')}</p>
          <h2>{t('privacyStorageTitle')}</h2>
          <p>{t('privacyStorage')}</p>
          <h2>{t('privacyNoTrackingTitle')}</h2>
          <p>{t('privacyNoTracking')}</p>
          <h2>{t('privacyHostTitle')}</h2>
          <p>{t('privacyHost')}</p>
          <h2>{t('privacyAnalyticsTitle')}</h2>
          <p>{t('privacyAnalytics')}</p>
          <h2>{t('privacyChangeMindTitle')}</h2>
          <p>{t('privacyChangeMind')}</p>
          <h2>{t('privacyRightsTitle')}</h2>
          <p>{t('privacyRights')}</p>
        </article>
      </div>
    </main>
  );
}
