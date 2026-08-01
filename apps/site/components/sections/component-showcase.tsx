'use client';

import { Badge, Button, Card, CodeBlock, Input, Tabs, Tag } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function ComponentShowcase() {
  const t = useTranslations();
  const [tab, setTab] = useState('preview');

  const preview = {
    primaryAction: t('showcasePrimaryAction'),
    secondaryAction: t('showcaseSecondaryAction'),
    status: t('showcaseStatus'),
    tag: t('showcaseTag'),
    inputPlaceholder: t('showcaseInputPlaceholder'),
    packageName: t('frameworkReactPackage'),
  };

  const code = `import { Badge, Button, Input, Tag } from '${preview.packageName}';

export function ComponentPreview() {
  return (
    <>
      <Button>${preview.primaryAction}</Button>
      <Button variant="secondary">${preview.secondaryAction}</Button>
      <Badge tone="success" dot>${preview.status}</Badge>
      <Tag>${preview.tag}</Tag>
      <Input placeholder="${preview.inputPlaceholder}" size="sm" />
    </>
  );
}`;

  return (
    <section id="components" className="lw-section lw-section--alt">
      <div className="lw-container">
        <span className="lw-overline">{t('showcaseOverline')}</span>
        <h2 className="lw-h2">{t('showcaseTitle')}</h2>
        <p className="lw-section__sub">{t('showcaseSubtitle')}</p>
        <Card padded={false}>
          <div className="lw-show__tabs">
            <Tabs
              items={[
                { id: 'preview', label: t('showcasePreviewTab') },
                { id: 'code', label: t('showcaseCodeTab') },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>
          {tab === 'preview' ? (
            <div className="lw-show__stage">
              <Button>{preview.primaryAction}</Button>
              <Button variant="secondary">{preview.secondaryAction}</Button>
              <Badge tone="success" dot>
                {preview.status}
              </Badge>
              <Tag>{preview.tag}</Tag>
              <Input placeholder={preview.inputPlaceholder} size="sm" />
            </div>
          ) : (
            <CodeBlock
              language="tsx"
              lineNumbers
              copyLabel={t('showcaseCopy')}
              copiedLabel={t('showcaseCopied')}
              copyText={code}
            >
              <code>
                {code.split('\n').map((line, index) => (
                  <span className="line" key={`${line}-${index}`}>
                    {line}
                    {'\n'}
                  </span>
                ))}
              </code>
            </CodeBlock>
          )}
        </Card>
      </div>
    </section>
  );
}
