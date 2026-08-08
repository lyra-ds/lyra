import { Accordion, Badge, Button, Icon } from '@lyra-ds/react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ComponentShowcase } from '@/components/sections/component-showcase';
import { Community } from '@/components/sections/community';
import { Frameworks } from '@/components/sections/frameworks';
import { Sponsors } from '@/components/sections/sponsors';
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
      <Sponsors />
      <section id="faq" className="lw-section lw-section--alt">
        <div className="lw-container lw-faq">
          <div>
            <span className="lw-overline">{t('faqOverline')}</span>
            <h2 className="lw-h2">{t('faqTitle')}</h2>
            <p className="lw-section__sub">{t('faqLead')}</p>
          </div>
          <Accordion
            defaultOpen="commercial"
            items={[
              {
                id: 'commercial',
                title: t('faqCommercialTitle'),
                content: t('faqCommercialContent'),
              },
              {
                id: 'frameworks',
                title: t('faqFrameworksTitle'),
                content: t('faqFrameworksContent'),
              },
              {
                id: 'theming',
                title: t('faqThemingTitle'),
                content: t('faqThemingContent'),
              },
              {
                id: 'a11y',
                title: t('faqA11yTitle'),
                content: t('faqA11yContent'),
              },
              {
                id: 'maturity',
                title: t('faqMaturityTitle'),
                content: t('faqMaturityContent'),
              },
            ]}
          />
        </div>
      </section>
      <section className="lw-cta">
        <div className="lw-container lw-cta__inner">
          <img src="/lyra-mark-light.svg" alt="" className="lw-cta__mark" />
          <h2 className="lw-cta__title">{t('ctaTitle')}</h2>
          <div className="lw-hero__cta">
            <Button asChild size="lg" iconRight={<Icon name="arrow-right" size={18} />}>
              <a href={DOCS_ORIGIN}>{t('ctaDocumentation')}</a>
            </Button>
            <Button
              asChild
              className="lw-cta__ghost"
              size="lg"
              variant="secondary"
              iconLeft={<Icon name="github" size={18} />}
            >
              <a href="https://github.com/lyra-ds/lyra" target="_blank" rel="noreferrer">
                {t('ctaGithub')}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
