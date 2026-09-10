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
import { useInitialFocus } from '../internal/use-initial-focus';
import { useModalActivity } from '../internal/use-modal-activity';
import {
  ModalLayerProvider,
  useModalLayer,
  useModalLayerRegistration,
  type ModalLayerValue,
} from '../internal/use-modal-layer';
import { useReturnFocus } from '../internal/use-return-focus';
import { useScrollLock } from '../internal/use-scroll-lock';
import { usePresence } from '../internal/use-presence';

/** Props for {@link Drawer}. */
export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Controls visibility. `true` mounts the portaled overlay and drawer panel. */
  open: boolean;
  /** Called when the user dismisses the drawer with Escape, the backdrop, or the close button. */
  onClose?: () => void;
  /** Accessible name for the close button. Default: `"Close"`. */
  closeLabel?: string;
  /** Heading rendered in the drawer header and used as its accessible name. */
  title: ReactNode;
  /** Fixed actions rendered in the footer. Omit to remove the footer chrome. */
  footer?: ReactNode;
  /** Portal host. Defaults to `document.body`. */
  container?: HTMLElement;
  /** Resolves the current logical destination for focus after an accepted close. */
  returnFocusTo?: () => HTMLElement | null;
  /** Resolves the initial focus destination inside the modal on each accepted opening. */
  initialFocusTo?: () => HTMLElement | null;
  /** Drawer body content. */
  children: ReactNode;
}

interface DrawerPanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  attachPanel: (node: HTMLDivElement | null) => void;
  titleId: string;
  title: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  closeLabel: string;
  captureOpener: (element: Element | null) => void;
  initialFocusTo?: () => HTMLElement | null;
  open: boolean;
  className?: string;
  children: ReactNode;
  rest: HTMLAttributes<HTMLDivElement>;
  closing: boolean;
  onAnimationEnd: AnimationEventHandler;
  layer: ModalLayerValue;
}

/** Portal child: DOM-dependent effects intentionally live with the portaled panel. */
function DrawerPanel({
  panelRef,
  overlayRef,
  attachPanel,
  titleId,
  title,
  footer,
  onClose,
  closeLabel,
  captureOpener,
  initialFocusTo,
  open,
  className,
  children,
  rest,
  closing,
  onAnimationEnd,
  layer,
}: DrawerPanelProps): ReactNode {
  const downOnOverlay = useRef(false);
  const revokeGesture = useCallback(() => {
    downOnOverlay.current = false;
  }, []);
  const { attachOverlay, overlay } = useModalActivity({ open, overlayRef, revokeGesture });
  const { topmost, isTopmost } = useModalLayerRegistration(
    layer,
    overlay,
    captureOpener,
    revokeGesture,
  );
  const { focusInitial, resetInitialFocus } = useInitialFocus({
    initialFocusTo,
    panelRef,
    captureOpener,
  });

  useEffect(() => {
    if (!open) {
      resetInitialFocus();
      return;
    }
    if (topmost) focusInitial();
  }, [focusInitial, open, resetInitialFocus, topmost]);

  useFocusTrap(panelRef, open && topmost);
  // Keyed on the close REQUEST, not on `mounted`: the page is scrollable again immediately while
  // the exit animation still plays, exactly as Dialog does it.
  useScrollLock(open, panelRef);

  const { onKeyDown: restOnKeyDown, ...restProps } = rest;
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    restOnKeyDown?.(event);
    if (!open || !isTopmost() || event.key !== 'Escape') return;

    event.stopPropagation();
    if (!event.defaultPrevented) onClose?.();
  };

  return (
    // The backdrop is a pointer-only close convenience; Escape and the close button provide keyboard access.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={attachOverlay}
      className={cx('lyra-drawer-overlay', closing && 'lyra-drawer-overlay--closing')}
      onMouseDown={(event) => {
        downOnOverlay.current = open && event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (open && isTopmost() && downOnOverlay.current && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        {...restProps}
        ref={attachPanel}
        className={cx('lyra-drawer', closing && 'lyra-drawer--closing', className)}
        onAnimationEnd={onAnimationEnd}
        role="dialog"
        aria-modal={open || undefined}
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
              aria-label={closeLabel}
              onClick={() => {
                if (open && isTopmost()) onClose?.();
              }}
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
 * background scroll, and restores focus to its declared target or opener after the controlled
 * `open` prop closes.
 */
export const Drawer = /*#__PURE__*/ forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
    open,
    onClose,
    closeLabel = 'Close',
    title,
    footer,
    container,
    returnFocusTo,
    initialFocusTo,
    className,
    children,
    ...rest
  },
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const { mounted, closing, onAnimationEnd } = usePresence(open);
  const layer = useModalLayer(open, panelRef);

  const { captureOpener } = useReturnFocus({
    open,
    active: layer.effectiveOpen,
    closeAuthorityRef: layer.closeAuthorityRef,
    fallbackFocusRef: layer.parentPanelRef,
    returnFocusTo,
    panelRef,
    overlayRef,
  });

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
    <ModalLayerProvider layer={layer}>
      <Portal container={container}>
        <DrawerPanel
          panelRef={panelRef}
          overlayRef={overlayRef}
          attachPanel={attachPanel}
          titleId={titleId}
          title={title}
          footer={footer}
          onClose={onClose}
          closeLabel={closeLabel}
          captureOpener={captureOpener}
          initialFocusTo={initialFocusTo}
          open={layer.effectiveOpen}
          className={className}
          rest={rest}
          closing={closing}
          onAnimationEnd={onAnimationEnd}
          layer={layer}
        >
          {children}
        </DrawerPanel>
      </Portal>
    </ModalLayerProvider>
  );
});
