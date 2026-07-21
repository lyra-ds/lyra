import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link IconButton}. */
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible label, used for both `aria-label` and the native tooltip. */
  label: string;
  /** Visual variant. Default `"secondary"`. */
  variant?: 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';
  /** Control size. Default `"md"` (40 × 40px). */
  size?: 'sm' | 'md' | 'lg';
  /** Icon content, normally an `<Icon />`. */
  children: ReactNode;
}

/** A square icon-only button. `label` supplies its accessible name. */
export const IconButton = /*#__PURE__*/ forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = 'secondary', size = 'md', label, className, children, ...rest },
    ref,
  ) {
    return (
      <button
        {...rest}
        ref={ref}
        className={cx(
          'lyra-btn',
          'lyra-btn--icon',
          `lyra-btn--${variant}`,
          `lyra-btn--${size}`,
          className,
        )}
        aria-label={label}
        title={label}
      >
        {children}
      </button>
    );
  },
);
