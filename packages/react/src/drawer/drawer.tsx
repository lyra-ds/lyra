import { forwardRef, useCallback, useEffect, useId, useRef } from 'react';
import type {
  AnimationEventHandler,
  ForwardedRef,
  HTMLAttributes,
  KeyboardEventHandler,
  ReactNode,
  RefObject,
} from 'react';
import { cx } from '../internal/cx';
import { Portal } from '../internal/portal';
import { useFocusTrap } from '../internal/use-focus-trap';
import { useScrollLock } from '../internal/use-scroll-lock';
import { usePresence } from '../internal/use-presence';

const INITIAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Props for {@link Drawer}. */
export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Controls visibility. `true` mounts the portaled overlay and drawer panel. */
  open: boolean;
  /** Called when the user dismisses the drawer with Escape, the backdrop, or the close button. */
  onClose?: () => void;
  /** Heading rendered in the drawer header and used as its accessible name. */
  title: ReactNode;
  /** Fixed actions rendered in the footer. Omit to remove the footer chrome. */
  footer?: ReactNode;
  /** Portal host. Defaults to `document.body`. */
  container?: HTMLElement;
  /** Drawer body content. */
  children: ReactNode;
}

interface DrawerPanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  attachPanel: (node: HTMLDivElement | null) => void;
  titleId: string;
  title: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  captureOpener: (element: Element | null) => void;
  className?: string;
  children: ReactNode;
  rest: HTMLAttributes<HTMLDivElement>;
  closing: boolean;
  onAnimationEnd: AnimationEventHandler;
}

/** Portal child: DOM-dependent effects intentionally live with the portaled panel. */
function DrawerPanel({
  panelRef,
  attachPanel,
  titleId,
  title,
  footer,
  onClose,
  captureOpener,
  className,
  children,
  rest,
  closing,
  onAnimationEnd,
}: DrawerPanelProps): ReactNode {
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    captureOpener(document.activeElement);
    const firstFocusable = panel.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR);
    (firstFocusable ?? panel).focus();
  }, [panelRef, captureOpener]);

  useFocusTrap(panelRef, true);
  // Keyed on the close REQUEST, not on `mounted`: the page is scrollable again immediately while
  // the exit animation still plays, exactly as Dialog does it.
  useScrollLock(!closing);

  const { onKeyDown: restOnKeyDown, ...restProps } = rest;
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    restOnKeyDown?.(event);
    if (event.key === 'Escape') onClose?.();
  };

  return (
    // The backdrop is a pointer-only close convenience; Escape and the close button provide keyboard access.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className={cx('lyra-drawer-overlay', closing && 'lyra-drawer-overlay--closing')}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        {...restProps}
        ref={attachPanel}
        className={cx('lyra-drawer', closing && 'lyra-drawer--closing', className)}
        onAnimationEnd={onAnimationEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="lyra-drawer__header">
          <h2 id={titleId} className="lyra-drawer__title">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              className="lyra-drawer__close"
              aria-label="Close"
              onClick={onClose}
            >
              <svg
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
        </div>
        <div className="lyra-drawer__body">{children}</div>
        {footer && <div className="lyra-drawer__footer">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * A modal slide-over panel for details and short forms. It is portaled, traps focus, locks
 * background scroll, and restores focus to its opener after the controlled `open` prop closes.
 */
export const Drawer = /*#__PURE__*/ forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  { open, onClose, title, footer, container, className, children, ...rest },
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<Element | null>(null);

  const { mounted, closing, onAnimationEnd } = usePresence(open);

  useEffect(() => {
    if (open) return;
    if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    openerRef.current = null;
  }, [open]);

  const captureOpener = useCallback((element: Element | null) => {
    openerRef.current = element;
  }, []);

  const attachPanel = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  if (!mounted) return null;

  return (
    <Portal container={container}>
      <DrawerPanel
        panelRef={panelRef}
        attachPanel={attachPanel}
        titleId={titleId}
        title={title}
        footer={footer}
        onClose={onClose}
        captureOpener={captureOpener}
        className={className}
        rest={rest}
        closing={closing}
        onAnimationEnd={onAnimationEnd}
      >
        {children}
      </DrawerPanel>
    </Portal>
  );
});
