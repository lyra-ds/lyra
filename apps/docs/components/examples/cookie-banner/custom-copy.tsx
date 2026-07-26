'use client';

import { Button, CookieBanner } from '@lyra-ds/react';
import { useState } from 'react';

const STORAGE_KEY = 'lyra-docs-cookie-custom-demo';

export function CookieBannerCustomCopy() {
  const [shown, setShown] = useState(false);

  const show = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShown(true);
  };

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Show the banner with your own copy
      </Button>
      {shown && (
        <CookieBanner
          storageKey={STORAGE_KEY}
          onAccept={() => setShown(false)}
          onEssentials={() => setShown(false)}
        >
          We keep one cookie to remember your theme, and nothing else. Analytics stay off unless you
          turn them on.
        </CookieBanner>
      )}
    </>
  );
}
