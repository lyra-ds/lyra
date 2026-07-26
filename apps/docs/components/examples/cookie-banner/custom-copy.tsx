'use client';

import { Button, CookieBanner } from '@lyra-ds/react';
import { useState } from 'react';

const STORAGE_KEY = 'lyra-docs-cookie-custom-demo';

export function CookieBannerCustomCopy() {
  const [round, setRound] = useState(0);

  const show = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRound((current) => current + 1);
  };

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Show the banner with your own copy
      </Button>
      {round > 0 && (
        <CookieBanner key={round} storageKey={STORAGE_KEY}>
          We keep one cookie to remember your theme, and nothing else. Analytics stay off unless you
          turn them on.
        </CookieBanner>
      )}
    </>
  );
}
