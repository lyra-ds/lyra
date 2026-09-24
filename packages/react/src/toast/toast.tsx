import { createContext, forwardRef, useContext } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

// Toasts inside a ToastStack are announced by the stack's persistent live region, so they must not
// carry their own role: a role="status" node inserted together with its text is often not spoken.
const InsideStack = createContext(false);

/** Props for {@link Toast}. */
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon color tone. Default `"info"`. */
  tone?: 'info' | 'success' | 'danger';
  /** Optional icon displayed before the message. */
  icon?: ReactNode;
  /** Called when the optional close button is activated. */
  onClose?: () => void;
  /** Accessible name for the close button. Default: `"Close notification"`. */
  closeLabel?: string;
  /** Toast message content. */
  children: ReactNode;
}

/** Props for {@link ToastStack}. */
export interface ToastStackProps extends HTMLAttributes<HTMLDivElement> {
  /** Toasts or other feedback content to stack. */
  children: ReactNode;
}

/**
 * A non-focus-moving status notification. Inside a {@link ToastStack} it is announced by the
 * stack's live region; standalone it falls back to `role="status"`.
 */
export const Toast = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { tone = 'info', icon, onClose, closeLabel = 'Close notification', className, children, ...rest },
  ref,
) {
  const insideStack = useContext(InsideStack);
  return (
    <div
      role={insideStack ? undefined : 'status'}
      {...rest}
      ref={ref}
      className={cx('lyra-toast', className)}
    >
      {icon && <span className={cx('lyra-toast__icon', `lyra-toast__icon--${tone}`)}>{icon}</span>}
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          className="lyra-toast__close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
});

/**
 * A fixed container that visually stacks status notifications. It is a persistent polite live
 * region (`aria-live="polite"`), so mount it before adding toasts; override `aria-live` via props.
 */
export const ToastStack = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastStackProps>(
  function ToastStack({ className, children, ...rest }, ref) {
    return (
      <div
        aria-live="polite"
        aria-relevant="additions"
        {...rest}
        ref={ref}
        className={cx('lyra-toast-stack', className)}
      >
        <InsideStack.Provider value={true}>{children}</InsideStack.Provider>
      </div>
    );
  },
);
