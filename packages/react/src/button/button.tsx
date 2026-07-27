import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ForwardedRef, ReactElement, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';

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
  /** Render the single child element instead of a `<button>`, keeping Lyra button styling — use for links: `<Button asChild><a href>…</a></Button>`. */
  asChild?: boolean;
}

function buttonContents(
  children: ReactNode,
  iconLeft: ReactNode,
  iconRight: ReactNode,
  loading: boolean,
): ReactNode {
  return (
    <>
      {loading && <span className="lyra-btn__spinner" aria-hidden="true" />}
      {iconLeft}
      {children != null && <span className="lyra-btn__label">{children}</span>}
      {iconRight}
    </>
  );
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
export const Button = /*#__PURE__*/ forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    iconLeft,
    iconRight,
    loading = false,
    disabled = false,
    full = false,
    asChild = false,
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

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) {
      throw new Error('Button with asChild expects exactly one React element child.');
    }

    const childProps = child.props as Record<string, unknown>;
    const childWithButtonContents = cloneElement(
      child as ReactElement<Record<string, unknown>>,
      {
        ...(loading && { 'aria-busy': true }),
        ...(disabled || loading ? { 'aria-disabled': 'true' } : {}),
      },
      buttonContents(childProps.children as ReactNode, iconLeft, iconRight, loading),
    );

    return (
      <Slot
        {...rest}
        ref={ref as ForwardedRef<HTMLElement>}
        className={cls}
        aria-busy={loading || undefined}
      >
        {childWithButtonContents}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {buttonContents(children, iconLeft, iconRight, loading)}
    </button>
  );
});
