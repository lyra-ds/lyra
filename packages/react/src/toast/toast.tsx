import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Toast}. */
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon color tone. Default `"info"`. */
  tone?: 'info' | 'success' | 'danger';
  /** Optional icon displayed before the message. */
  icon?: ReactNode;
  /** Called when the optional close button is activated. */
  onClose?: () => void;
  /** Toast message content. */
  children: ReactNode;
}

/** Props for {@link ToastStack}. */
export interface ToastStackProps extends HTMLAttributes<HTMLDivElement> {
  /** Toasts or other feedback content to stack. */
  children: ReactNode;
}

/** A polite, non-focus-moving status notification. */
export const Toast = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { tone = 'info', icon, onClose, className, children, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx('lyra-toast', className)} role="status">
      {icon && <span className={cx('lyra-toast__icon', `lyra-toast__icon--${tone}`)}>{icon}</span>}
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          className="lyra-toast__close"
          aria-label="Close notification"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
});

/** A fixed container that visually stacks status notifications. */
export const ToastStack = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastStackProps>(
  function ToastStack({ className, children, ...rest }, ref) {
    return (
      <div {...rest} ref={ref} className={cx('lyra-toast-stack', className)}>
        {children}
      </div>
    );
  },
);
