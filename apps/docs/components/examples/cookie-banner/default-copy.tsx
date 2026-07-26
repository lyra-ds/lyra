'use client';

import { Button, CookieBanner } from '@lyra-ds/react';
import { useState } from 'react';

const STORAGE_KEY = 'lyra-docs-cookie-demo';

export function CookieBannerDefaultCopy() {
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState('');

  const show = () => {
    // The banner remembers the visitor's answer, so a demo has to forget it to be repeatable.
    localStorage.removeItem(STORAGE_KEY);
    setChoice('');
    setRound((current) => current + 1);
  };

  return (
    <>
      <Button variant="secondary" onClick={show}>
        Show the cookie banner
      </Button>
      {choice && <span>Chose: {choice}</span>}
      {/*
        The callbacks do not unmount the banner: it hides itself, and unmounting it here would cut
        its exit animation short. A changing `key` is what brings it back for the next round.
      */}
      {round > 0 && (
        <CookieBanner
          key={round}
          storageKey={STORAGE_KEY}
          policyHref="/privacy"
          onAccept={() => setChoice('all cookies')}
          onEssentials={() => setChoice('essentials only')}
        />
      )}
    </>
  );
}
