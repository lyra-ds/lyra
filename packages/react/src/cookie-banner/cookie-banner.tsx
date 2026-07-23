import { forwardRef, useEffect, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '../button';
import { cx } from '../internal/cx';

const DEFAULT_STORAGE_KEY = 'lyra-cookie-consent';

/** Props for {@link CookieBanner}. */
export interface CookieBannerProps extends HTMLAttributes<HTMLDivElement> {
  /** Browser storage key used to persist the visitor's choice. */
  storageKey?: string;
  /** Optional URL for the privacy policy linked from the default copy. */
  policyHref?: string;
  /** Called after the visitor accepts all cookies. */
  onAccept?: () => void;
  /** Called after the visitor keeps only essential cookies. */
  onEssentials?: () => void;
  /** Custom banner copy that replaces the default LGPD notice. */
  children?: ReactNode;
}

/** An SSR-safe LGPD cookie consent banner that hides after a persisted choice. */
export const CookieBanner = /*#__PURE__*/ forwardRef<HTMLDivElement, CookieBannerProps>(
  function CookieBanner(
    {
      storageKey = DEFAULT_STORAGE_KEY,
      policyHref,
      onAccept,
      onEssentials,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const [visible, setVisible] = useState<boolean | null>(null);

    useEffect(() => {
      try {
        setVisible(localStorage.getItem(storageKey) === null);
      } catch {
        setVisible(true);
      }
    }, [storageKey]);

    const decide = (choice: 'all' | 'essentials', callback?: () => void): void => {
      try {
        localStorage.setItem(storageKey, choice);
      } catch {
        // Storage can be unavailable (for example, private browsing); the selection still applies.
      }
      setVisible(false);
      callback?.();
    };

    if (visible !== true) return null;

    return (
      <div
        {...rest}
        ref={ref}
        className={cx('lyra-cookies', className)}
        role="region"
        aria-label="Cookie notice"
      >
        <p className="lyra-cookies__text">
          {children ?? (
            <>
              We use cookies to improve your experience in accordance with LGPD. You can accept all
              cookies or keep only essential ones.
              {policyHref && (
                <>
                  {' '}
                  <a href={policyHref}>Privacy policy</a>
                </>
              )}
            </>
          )}
        </p>
        <div className="lyra-cookies__actions">
          <Button variant="secondary" size="sm" onClick={() => decide('essentials', onEssentials)}>
            Only essentials
          </Button>
          <Button size="sm" onClick={() => decide('all', onAccept)}>
            Accept all
          </Button>
        </div>
      </div>
    );
  },
);
