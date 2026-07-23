'use client';

import { Button, Dialog } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function DialogPreview() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <div className="lyra-card lyra-card--padded">
      <Button onClick={() => setOpen(true)}>{t('openDialog')}</Button>
      <Dialog
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('close')}
          </Button>
        }
        onClose={() => setOpen(false)}
        open={open}
        title="Delete project"
      >
        This interactive preview uses the production Lyra Dialog component.
      </Dialog>
    </div>
  );
}
