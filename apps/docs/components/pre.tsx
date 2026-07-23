'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, type ComponentPropsWithoutRef } from 'react';

/**
 * Code panel: the old card chrome (language badge + copy button in a header bar)
 * wrapping Shiki-highlighted output. Token colors come from Shiki's dual theme
 * (light/dark) via CSS variables, so the panel follows the active [data-theme].
 */
export function Pre({ children, className, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const t = useTranslations();

  async function copy() {
    const text = ref.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="lw-code">
      <div className="lw-code__bar">
        <button type="button" className="lw-code__copy" onClick={copy}>
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
      <pre ref={ref} className={['lw-code__pre', className].filter(Boolean).join(' ')} {...props}>
        {children}
      </pre>
    </div>
  );
}
