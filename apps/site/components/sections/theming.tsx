import { CodeBlock, Icon } from '@lyra-ds/react';
import { getTranslations } from 'next-intl/server';
import stats from '@/lib/generated/stats.json';

const whiteLabelCss = `html[data-brand='harbor'] {
  --brand: #0d9488;
  --brand-contrast: #ffffff;
  --brand-radius: 12px;
  --brand-font: 'Plus Jakarta Sans', system-ui, sans-serif;
}`;

export async function Theming() {
  const t = await getTranslations();

  return (
    <section id="theming" className="lw-section lw-section--alt">
      <div className="lw-container lw-theming">
        <div>
          <span className="lw-overline">{t('themingOverline')}</span>
          <h2 className="lw-h2">{t('themingTitle')}</h2>
          <p className="lw-section__sub">
            {t('themingSubtitle', {
              semanticTokens: stats.semanticTokens,
              whiteLabelInputs: stats.whiteLabelInputs,
            })}
          </p>
          <ul className="lw-checks">
            <li className="lw-check">
              <Icon name="check" size={16} />
              {t('themingThemeCheck')}
            </li>
            <li className="lw-check">
              <Icon name="check" size={16} />
              {t('themingBrandCheck', { whiteLabelInputs: stats.whiteLabelInputs })}
            </li>
            <li className="lw-check">
              <Icon name="check" size={16} />
              {t('themingCompatCheck')}
            </li>
          </ul>
        </div>
        <CodeBlock
          language="css"
          lineNumbers
          copyLabel={t('themingCopy')}
          copiedLabel={t('themingCopied')}
          copyText={whiteLabelCss}
        >
          <code>
            {whiteLabelCss.split('\n').map((line, index) => (
              <span className="line" key={`${line}-${index}`}>
                {line}
                {'\n'}
              </span>
            ))}
          </code>
        </CodeBlock>
      </div>
    </section>
  );
}
