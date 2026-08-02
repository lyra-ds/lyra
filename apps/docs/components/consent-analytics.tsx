'use client';

import { CookieBanner } from '@lyra-ds/react';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { mayLoadAnalytics, readConsent, type Consent } from '@/lib/consent';

const openPanelUrl = process.env.NEXT_PUBLIC_OPENPANEL_URL;
const openPanelClientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
const openPanelOrigin = openPanelUrl && openPanelClientId ? new URL(openPanelUrl).origin : null;

declare global {
  interface Window {
    op?: (command: 'init', options: Record<string, unknown>) => void;
  }
}

interface ConsentAnalyticsProps {
  acceptLabel: string;
  'aria-label': string;
  children: ReactNode;
  essentialsLabel: string;
  policyHref: string;
  storageKey: string;
}

/** Keeps the consent decision reactive, so accepting starts analytics without a navigation. */
export function ConsentAnalytics({
  acceptLabel,
  'aria-label': ariaLabel,
  children,
  essentialsLabel,
  policyHref,
  storageKey,
}: ConsentAnalyticsProps) {
  const [consent, setConsent] = useState<Consent | null>(() => readConsent());
  const initialized = useRef(false);
  const canLoad = consent === 'all' && mayLoadAnalytics();

  return (
    <>
      {canLoad && openPanelOrigin && (
        <Script
          id="openpanel"
          src={`${openPanelOrigin}/op1.js`}
          strategy="afterInteractive"
          onLoad={() => {
            if (initialized.current || !window.op) return;

            initialized.current = true;
            window.op('init', {
              apiUrl: `${openPanelOrigin}/api`,
              clientId: openPanelClientId,
              sessionReplay: { enabled: false },
              trackScreenViews: true,
            });
          }}
        />
      )}
      <CookieBanner
        aria-label={ariaLabel}
        storageKey={storageKey}
        policyHref={policyHref}
        essentialsLabel={essentialsLabel}
        acceptLabel={acceptLabel}
        onAccept={() => setConsent('all')}
        onEssentials={() => setConsent('essentials')}
      >
        {children}
      </CookieBanner>
    </>
  );
}
