'use client';

import { Card, Icon, Input } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function InputPreview() {
  const t = useTranslations();
  const [value, setValue] = useState('');

  return (
    <Card className="lw-preview__form">
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
    </Card>
  );
}
