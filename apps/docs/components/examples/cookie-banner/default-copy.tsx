'use client';

import { Button, CookieBanner } from '@lyra-ds/react';
import { useState } from 'react';

const STORAGE_KEY = 'lyra-docs-cookie-demo';

export function CookieBannerDefaultCopy() {
  const [shown, setShown] = useState(false);
  const [choice, setChoice] = useState('');

  const show = () => {
    // The banner remembers the visitor's answer, so a demo has to forget it to be repeatable.
    localStorage.removeItem(STORAGE_KEY);
    setChoice('');
    setShown(true);
  };

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Show the cookie banner
      </Button>
      {choice && <span>Chose: {choice}</span>}
      {shown && (
        <CookieBanner
          storageKey={STORAGE_KEY}
          policyHref="/privacy"
          onAccept={() => {
            setChoice('all cookies');
            setShown(false);
          }}
          onEssentials={() => {
            setChoice('essentials only');
            setShown(false);
          }}
        />
      )}
    </>
  );
}
