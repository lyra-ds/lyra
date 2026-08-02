import { Card, Icon } from '@lyra-ds/react';
import { getTranslations } from 'next-intl/server';

const communityLinks = [
  {
    icon: 'users' as const,
    href: 'https://github.com/lyra-ds/lyra/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22',
    titleKey: 'communityContributeTitle',
    descriptionKey: 'communityContributeDescription',
  },
  {
    icon: 'mail' as const,
    href: 'https://github.com/lyra-ds/lyra/discussions',
    titleKey: 'communityDiscussTitle',
    descriptionKey: 'communityDiscussDescription',
  },
  {
    icon: 'book-open' as const,
    href: 'https://github.com/lyra-ds/lyra/blob/main/CONTRIBUTING.md',
    titleKey: 'communityDocsTitle',
    descriptionKey: 'communityDocsDescription',
  },
];

export async function Community() {
  const t = await getTranslations();

  return (
    <section id="community" className="lw-section">
      <div className="lw-container">
        <h2 className="lw-h2">{t('communityTitle')}</h2>
        <p className="lw-section__sub">{t('communitySubtitle')}</p>
        <div className="lw-comm-grid">
          {communityLinks.map((link) => (
            <Card key={link.href} asChild interactive className="lw-comm">
              <a href={link.href} target="_blank" rel="noreferrer">
                <span className="lw-comm__icon" aria-hidden="true">
                  <Icon name={link.icon} size={20} />
                </span>
                <h3 className="lw-comm__title">{t(link.titleKey)}</h3>
                <p className="lw-comm__desc">{t(link.descriptionKey)}</p>
              </a>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
