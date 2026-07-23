'use client';

import { Button } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations();

  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="lyra-card">
      <div className="lyra-card__header">
        <span className="lyra-badge lyra-badge--neutral">TSX</span>
        <Button size="sm" variant="ghost" onClick={copy}>
          {copied ? t('copied') : t('copy')}
        </Button>
      </div>
      <pre className="lyra-card__body" style={{ margin: 0, overflowX: 'auto' }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}
