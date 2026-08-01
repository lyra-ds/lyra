import { Badge, Button, Icon } from '@lyra-ds/react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ComponentShowcase } from '@/components/sections/component-showcase';
import { Community } from '@/components/sections/community';
import { Frameworks } from '@/components/sections/frameworks';
import { Theming } from '@/components/sections/theming';
import { DOCS_ORIGIN } from '@/lib/links';

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  setRequestLocale(lang);
  const t = await getTranslations();

  return (
    <main>
      <section className="lw-hero">
        <div className="lw-container lw-hero__inner">
          <Badge tone="accent" dot>
            {t('heroBadge')}
          </Badge>
          <h1 className="lw-hero__title">
            {t('heroTitleFirstLine')}
            <br />
            {t('heroTitleSecondLine')}
          </h1>
          <p className="lw-hero__sub">{t('heroSubtitle')}</p>
          <div className="lw-hero__cta">
            <Button asChild size="lg" iconRight={<Icon name="arrow-right" size={18} />}>
              <a href={`${DOCS_ORIGIN}/${lang}`}>{t('documentation')}</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              iconLeft={<Icon name="terminal" size={18} />}
            >
              <a
                href="https://www.npmjs.com/package/@lyra-ds/react"
                target="_blank"
                rel="noreferrer"
              >
                {t('installReact')}
              </a>
            </Button>
          </div>
          <div className="lw-hero__meta">
            <span>
              <Icon name="scale" size={14} />
              {t('mitLicense')}
            </span>
          </div>
        </div>
      </section>
      <ComponentShowcase />
      <Frameworks />
      <Theming />
      <Community />
    </main>
  );
}
