import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link ActionBar}. */
export interface ActionBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the bar may render. Default: `true`. */
  open?: boolean;
  /** Number of selected items. A value of `0` hides the bar. */
  count?: number;
  /** Content displayed after the selection count. Default: `"selected"`. */
  label?: ReactNode;
  /** Action controls rendered at the end of the bar. */
  actions?: ReactNode;
  /** Called when the clear-selection button is pressed. Its presence renders that button. */
  onClear?: () => void;
  /** Accessible name for the clear-selection button. Default: `"Clear selection"`. */
  clearLabel?: string;
}

/** A fixed bulk-action bar that appears while items are selected. */
export const ActionBar = /*#__PURE__*/ forwardRef<HTMLDivElement, ActionBarProps>(
  function ActionBar(
    {
      open = true,
      count,
      label = 'selected',
      actions,
      onClear,
      clearLabel = 'Clear selection',
      className,
      children,
      ...rest
    },
    ref,
  ) {
    if (!open || count === 0) return null;
    return (
      <div {...rest} ref={ref} className={cx('lyra-actionbar', className)} role="toolbar">
        {count != null && (
          <span className="lyra-actionbar__count" role="status" aria-live="polite">
            <strong>{count}</strong> {label}
          </span>
        )}
        {children}
        <span className="lyra-actionbar__actions">
          {actions}
          {onClear && (
            <button
              type="button"
              className="lyra-actionbar__clear"
              aria-label={clearLabel}
              onClick={onClear}
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </span>
      </div>
    );
  },
);
