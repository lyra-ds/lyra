import { getTranslations, setRequestLocale } from 'next-intl/server';

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
