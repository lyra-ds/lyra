import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/**
 * Props for {@link Button}. Extends the native `<button>` attributes, so every DOM
 * prop (`type`, `onClick`, `form`, `aria-*`, …) passes straight through onto the root.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant. Default `"primary"`. Use `primary` for the single main action per view. */
  variant?: 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';
  /** Control height. Default `"md"` (sm 32px · md 40px · lg 48px). */
  size?: 'sm' | 'md' | 'lg';
  /** Icon rendered before the label (usually `<Icon size={16} />`). */
  iconLeft?: ReactNode;
  /** Icon rendered after the label. */
  iconRight?: ReactNode;
  /** Show the spinner and block interaction. The label stays visible (no layout shift). */
  loading?: boolean;
  /** Stretch to 100% of the container width. */
  full?: boolean;
}

/**
 * Lyra DS button. A thin wrapper over the `.lyra-btn` classes — all appearance comes
 * from `@lyra-ds/styles`; this component only emits class strings and DOM.
 *
 * Icon-only buttons (`className="lyra-btn--icon"` with no `children`) REQUIRE an
 * `aria-label` for an accessible name — enforced by the axe suite, not the type system.
 *
 * @example
 * <Button>Create project</Button>
 * <Button variant="secondary">Cancel</Button>
 * <Button variant="soft" iconLeft={<Icon name="plus" size={16} />}>Add</Button>
 * <Button variant="danger" loading>Deleting…</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    iconLeft,
    iconRight,
    loading = false,
    disabled = false,
    full = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const cls = cx(
    'lyra-btn',
    `lyra-btn--${variant}`,
    `lyra-btn--${size}`,
    loading && 'lyra-btn--loading',
    full && 'lyra-btn--full',
    className,
  );
  return (
    <button
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="lyra-btn__spinner" aria-hidden="true" />}
      {iconLeft}
      {children != null && <span className="lyra-btn__label">{children}</span>}
      {iconRight}
    </button>
  );
});
