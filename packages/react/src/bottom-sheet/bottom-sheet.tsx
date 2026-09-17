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
import { usePresence } from '../internal/use-presence';
import { useReturnFocus } from '../internal/use-return-focus';
import { useScrollLock } from '../internal/use-scroll-lock';

type BottomSheetBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'aria-label'> & {
  /** Controls visibility. `true` mounts the portaled overlay and bottom sheet. */
  open: boolean;
  /** Called when the user dismisses the sheet with Escape, the backdrop, or the close button. */
  onClose?: () => void;
  /** Accessible name for the close button. Default: `"Close"`. */
  closeLabel?: string;
  /** Portal host. Defaults to `document.body`. */
  container?: HTMLElement;
  /**
   * Resolves the logical destination for an accepted close. The resolver result is used only when
   * eligible; otherwise an eligible previously focused opener is the fallback. A successor
   * composition must supply a meaningful target when the opener can disappear or become ineligible.
   */
  returnFocusTo?: () => HTMLElement | null;
  /** Resolves the initial focus destination inside the modal on each accepted opening. */
  initialFocusTo?: () => HTMLElement | null;
  /** Bottom sheet body content. */
  children: ReactNode;
};

type BottomSheetWithTitleProps = {
  /** Heading rendered in the sheet header and used as its accessible name. */
  title: Exclude<ReactNode, boolean | null | undefined>;
  /** The visible heading supplies the accessible name in this branch. */
  'aria-label'?: never;
};

type BottomSheetWithoutTitleProps = {
  /** Omit the heading when the sheet has no visible title. */
  title?: undefined;
  /** Translated accessible name required when no heading is rendered. */
  'aria-label': string;
};

/** Props for {@link BottomSheet}. */
export type BottomSheetProps = BottomSheetBaseProps &
  (BottomSheetWithTitleProps | BottomSheetWithoutTitleProps);

interface BottomSheetPanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  attachPanel: (node: HTMLDivElement | null) => void;
  titleId: string;
  title: ReactNode | undefined;
  accessibleName: string | undefined;
  onClose?: () => void;
  closeLabel: string;
  /** The live controlled value; re-runs focus capture when an exit is cancelled by a reopen. */
  open: boolean;
  captureOpener: (element: Element | null) => void;
  initialFocusTo?: () => HTMLElement | null;
  className?: string;
  children: ReactNode;
  rest: HTMLAttributes<HTMLDivElement>;
  closing: boolean;
  onAnimationEnd: AnimationEventHandler;
  layer: ModalLayerValue;
}

/** Portal child: DOM-dependent effects intentionally live with the portaled panel. */
function BottomSheetPanel({
  panelRef,
  overlayRef,
  attachPanel,
  titleId,
  title,
  accessibleName,
  onClose,
  closeLabel,
  open,
  captureOpener,
  initialFocusTo,
  className,
  children,
  rest,
  closing,
  onAnimationEnd,
  layer,
}: BottomSheetPanelProps): ReactNode {
  // A click is dispatched on the nearest common ancestor of its mousedown and mouseup targets.
  // Record where the press began so dragging from the panel onto the backdrop cannot dismiss it.
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
  const hasTitle = title != null;

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
  useScrollLock(open, panelRef);

  const { onKeyDown: restOnKeyDown, onAnimationEnd: restOnAnimationEnd, ...restProps } = rest;
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    restOnKeyDown?.(event);
    if (!open || !isTopmost() || event.key !== 'Escape') return;

    event.stopPropagation();
    if (!event.defaultPrevented) onClose?.();
  };
  const handleAnimationEnd: AnimationEventHandler<HTMLDivElement> = (event) => {
    restOnAnimationEnd?.(event);
    onAnimationEnd(event);
  };

  return (
    // The backdrop is a pointer-only close convenience; Escape and the close button provide keyboard access.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={attachOverlay}
      className={cx('lyra-bottomsheet-overlay', closing && 'lyra-bottomsheet-overlay--closing')}
      onMouseDown={(event) => {
        downOnOverlay.current = open && event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (open && isTopmost() && downOnOverlay.current && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      {/* The sheet panel owns the Escape-to-close keydown for the modal-dialog pattern. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        {...restProps}
        ref={attachPanel}
        className={cx('lyra-bottomsheet', closing && 'lyra-bottomsheet--closing', className)}
        onAnimationEnd={handleAnimationEnd}
        role="dialog"
        aria-modal={open || undefined}
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-label={hasTitle ? undefined : accessibleName}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {(hasTitle || onClose) && (
          <div className="lyra-bottomsheet__header">
            {hasTitle && (
              <h2 id={titleId} className="lyra-bottomsheet__title">
                {title}
              </h2>
            )}
            {onClose && (
              <button
                type="button"
                className="lyra-bottomsheet__close"
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
        )}
        <div className="lyra-bottomsheet__body">{children}</div>
      </div>
    </div>
  );
}

/**
 * A controlled modal panel anchored to the bottom viewport edge. It is portaled, traps focus,
 * locks background scroll, and restores focus to its declared target or opener after the controlled
 * `open` prop closes.
 */
export const BottomSheet = /*#__PURE__*/ forwardRef<HTMLDivElement, BottomSheetProps>(
  function BottomSheet(
    {
      open,
      onClose,
      closeLabel = 'Close',
      title,
      container,
      returnFocusTo,
      initialFocusTo,
      className,
      children,
      'aria-label': accessibleName,
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
          <BottomSheetPanel
            panelRef={panelRef}
            overlayRef={overlayRef}
            attachPanel={attachPanel}
            titleId={titleId}
            title={title}
            accessibleName={accessibleName}
            onClose={onClose}
            closeLabel={closeLabel}
            open={layer.effectiveOpen}
            captureOpener={captureOpener}
            initialFocusTo={initialFocusTo}
            className={className}
            rest={rest}
            closing={closing}
            onAnimationEnd={onAnimationEnd}
            layer={layer}
          >
            {children}
          </BottomSheetPanel>
        </Portal>
      </ModalLayerProvider>
    );
  },
);
