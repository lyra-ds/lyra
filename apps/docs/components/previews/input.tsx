'use client';

import { Icon, Input } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function InputPreview() {
  const t = useTranslations();
  const [value, setValue] = useState('');

  return (
    <div
      className="lyra-card lyra-card--padded"
      style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: '24rem' }}
    >
      <Input
        label={t('demoEmail')}
        placeholder="you@example.dev"
        hint={t('demoEmailHint')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Input
        label={t('demoSearch')}
        placeholder={t('demoSearchPlaceholder')}
        iconLeft={<Icon name="search" size={16} />}
      />
    </div>
  );
}
