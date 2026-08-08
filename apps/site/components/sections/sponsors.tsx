import { Button, Icon } from '@lyra-ds/react';
import { getTranslations } from 'next-intl/server';
import sponsors from '@/data/sponsors.json';

const SPONSORS_URL = 'https://github.com/sponsors/lyra-ds';

export async function Sponsors() {
  const t = await getTranslations();
  const hasSponsors = sponsors.length > 0;

  return (
    <section id="sponsors" className="lw-section lw-section--alt lw-sponsors">
      <div className="lw-container lw-sponsors__inner">
        <span className="lw-overline">{t('sponsorsOverline')}</span>
        <h2 className="lw-h2">{t('sponsorsTitle')}</h2>
        <p className="lw-section__sub">{t('sponsorsSubtitle')}</p>
        {hasSponsors ? (
          <img src="/sponsors.svg" alt={t('sponsorsImageAlt')} className="lw-sponsors__image" />
        ) : (
          <p className="lw-sponsors__empty">{t('sponsorsEmpty')}</p>
        )}
        <Button asChild iconLeft={<Icon name="heart" size={18} />}>
          <a href={SPONSORS_URL} target="_blank" rel="noreferrer">
            {t('sponsorsCta')}
          </a>
        </Button>
      </div>
    </section>
  );
}
