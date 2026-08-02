import { Badge, Card } from '@lyra-ds/react';
import { getTranslations } from 'next-intl/server';

export async function Frameworks() {
  const t = await getTranslations();

  const frameworks = [
    {
      name: t('frameworkReact'),
      packageName: t('frameworkReactPackage'),
      status: t('frameworkReady'),
      tone: 'success' as const,
    },
    {
      name: t('frameworkVue'),
      status: t('frameworkComingSoon'),
      tone: 'neutral' as const,
    },
    {
      name: t('frameworkLaravel'),
      status: t('frameworkComingSoon'),
      tone: 'neutral' as const,
    },
    {
      name: t('frameworkPhoenix'),
      status: t('frameworkComingSoon'),
      tone: 'neutral' as const,
    },
  ];

  return (
    <section id="frameworks" className="lw-section">
      <div className="lw-container">
        <span className="lw-overline">{t('frameworksOverline')}</span>
        <h2 className="lw-h2">{t('frameworksTitle')}</h2>
        <p className="lw-section__sub">{t('frameworksSubtitle')}</p>
        <div className="lw-fw-grid">
          {frameworks.map((framework) => (
            <Card key={framework.name} interactive padded>
              <div className="lw-fw">
                <div className="lw-fw__head">
                  <span className="lw-fw__name">{framework.name}</span>
                  <Badge tone={framework.tone} dot>
                    {framework.status}
                  </Badge>
                </div>
                {framework.packageName ? (
                  <code className="lw-fw__pkg">{framework.packageName}</code>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
