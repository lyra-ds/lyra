'use client';

import { Button, Card, Dialog } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function DialogPreview() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <Card>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t('demoDelete')}
      </Button>
      <Dialog
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              {t('demoDelete')}
            </Button>
          </>
        }
        onClose={() => setOpen(false)}
        open={open}
        title={t('demoDeleteTitle')}
      >
        {t('demoDeleteBody')}
      </Dialog>
    </Card>
  );
}
