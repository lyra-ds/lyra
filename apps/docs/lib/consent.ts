export const consentStorageKey = 'lyra-docs-consent';

export type Consent = 'all' | 'essentials';

/** Reads the visitor's persisted choice without assuming browser storage is available. */
export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;

  try {
    const consent = window.localStorage.getItem(consentStorageKey);
    return consent === 'all' || consent === 'essentials' ? consent : null;
  } catch {
    return null;
  }
}

/** Future analytics must call this immediately before initializing. */
export function mayLoadAnalytics(): boolean {
  return readConsent() === 'all';
}
