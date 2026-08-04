import { forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

const COPIED_RESET_DELAY = 1500;

/** Props for {@link CodeBlock}. */
export interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional language badge shown in the code panel bar. */
  language?: string;
  /** Draw line numbers beside descendants whose class list includes `line`. */
  lineNumbers?: boolean;
  /** Soft-wrap code lines and break long tokens instead of allowing horizontal overflow. */
  wrap?: boolean;
  /** Translated visible label for the copy button. Omit with `copiedLabel` to hide copying. */
  copyLabel?: ReactNode;
  /** Translated visible label and polite announcement shown after a successful copy. */
  copiedLabel?: ReactNode;
  /** Text copied instead of the rendered text content of this code block's `<pre>`. */
  copyText?: string;
}

/**
 * A highlighter-agnostic code panel for already-highlighted markup.
 *
 * To render line numbers, each highlighted line must be wrapped in an element with the `line`
 * class. Syntax token classes and colors remain the highlighter's responsibility.
 */
export const CodeBlock = /*#__PURE__*/ forwardRef<HTMLDivElement, CodeBlockProps>(
  function CodeBlock(
    { language, lineNumbers, wrap, copyLabel, copiedLabel, copyText, className, children, ...rest },
    ref,
  ) {
    const preRef = useRef<HTMLPreElement>(null);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [copied, setCopied] = useState(false);
    const canCopy = copyLabel !== undefined && copiedLabel !== undefined;

    useEffect(
      () => () => {
        if (resetTimer.current !== undefined) clearTimeout(resetTimer.current);
      },
      [],
    );

    async function handleCopy(): Promise<void> {
      const text = copyText ?? preRef.current?.textContent ?? '';
      if (!navigator.clipboard) return;

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (resetTimer.current !== undefined) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY);
      } catch {
        setCopied(false);
      }
    }

    return (
      <div
        {...rest}
        ref={ref}
        className={cx(
          'lyra-code',
          lineNumbers && 'lyra-code--line-numbers',
          wrap && 'lyra-code--wrap',
          className,
        )}
      >
        <div className="lyra-code__bar">
          {language === undefined ? (
            <span aria-hidden="true" />
          ) : (
            <span className="lyra-code__lang">{language}</span>
          )}
          {canCopy && (
            <button type="button" className="lyra-code__copy" onClick={handleCopy}>
              {copied ? copiedLabel : copyLabel}
            </button>
          )}
        </div>
        {/* A scrolling native pre needs a keyboard tab stop; wrapped panels never scroll, so they skip it. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- overflow is keyboard-scrollable once focused. */}
        <pre ref={preRef} className="lyra-code__pre" tabIndex={wrap ? undefined : 0}>
          {children}
        </pre>
        {canCopy && (
          <span className="lyra-code__status" role="status" aria-live="polite" aria-atomic="true">
            {copied ? copiedLabel : null}
          </span>
        )}
      </div>
    );
  },
);
