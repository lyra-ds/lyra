'use client';

import { CookieBanner } from '@lyra-ds/react';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { mayLoadAnalytics, readConsent, type Consent } from '@/lib/consent';

const openPanelUrl = process.env.NEXT_PUBLIC_OPENPANEL_URL;
const openPanelClientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;
const openPanelOrigin = openPanelUrl && openPanelClientId ? new URL(openPanelUrl).origin : null;

type OpenPanelCommand = [
  command: 'init',
  options: {
    apiUrl: string;
    clientId: string | undefined;
    sessionReplay: { enabled: false };
    trackScreenViews: true;
  },
];

type OpenPanelStub = {
  (...args: OpenPanelCommand): void;
  q?: OpenPanelCommand[];
};

declare global {
  interface Window {
    op?: OpenPanelStub;
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
  const [shouldLoadOpenPanel, setShouldLoadOpenPanel] = useState(false);
  const canLoad = consent === 'all' && mayLoadAnalytics();

  useEffect(() => {
    if (!canLoad || !openPanelOrigin || initialized.current) return;

    initialized.current = true;
    const op: OpenPanelStub =
      window.op ||
      function (...args: OpenPanelCommand) {
        (op.q = op.q || []).push(args);
      };
    window.op = op;
    op('init', {
      apiUrl: `${openPanelOrigin}/api`,
      clientId: openPanelClientId,
      sessionReplay: { enabled: false },
      trackScreenViews: true,
    });
    setShouldLoadOpenPanel(true);
  }, [canLoad]);

  return (
    <>
      {canLoad && openPanelOrigin && shouldLoadOpenPanel && (
        <Script id="openpanel" src={`${openPanelOrigin}/op1.js`} strategy="afterInteractive" />
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
