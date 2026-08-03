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
import { usePresence } from '../internal/use-presence';
import { useScrollLock } from '../internal/use-scroll-lock';

const INITIAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type BottomSheetBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'aria-label'> & {
  /** Controls visibility. `true` mounts the portaled overlay and bottom sheet. */
  open: boolean;
  /** Called when the user dismisses the sheet with Escape, the backdrop, or the close button. */
  onClose?: () => void;
  /** Accessible name for the close button. Default: `"Close"`. */
  closeLabel?: string;
  /** Portal host. Defaults to `document.body`. */
  container?: HTMLElement;
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
  attachPanel: (node: HTMLDivElement | null) => void;
  titleId: string;
  title: ReactNode | undefined;
  accessibleName: string | undefined;
  onClose?: () => void;
  closeLabel: string;
  /** The live controlled value; re-runs focus capture when an exit is cancelled by a reopen. */
  open: boolean;
  captureOpener: (element: Element | null) => void;
  className?: string;
  children: ReactNode;
  rest: HTMLAttributes<HTMLDivElement>;
  closing: boolean;
  onAnimationEnd: AnimationEventHandler;
}

/** Portal child: DOM-dependent effects intentionally live with the portaled panel. */
function BottomSheetPanel({
  panelRef,
  attachPanel,
  titleId,
  title,
  accessibleName,
  onClose,
  closeLabel,
  open,
  captureOpener,
  className,
  children,
  rest,
  closing,
  onAnimationEnd,
}: BottomSheetPanelProps): ReactNode {
  const hasTitle = title != null;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    captureOpener(document.activeElement);
    const firstFocusable = panel.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR);
    (firstFocusable ?? panel).focus();
  }, [open, panelRef, captureOpener]);

  useFocusTrap(panelRef, true);
  useScrollLock(!closing);

  // A click is dispatched on the nearest common ancestor of its mousedown and mouseup targets.
  // Record where the press began so dragging from the panel onto the backdrop cannot dismiss it.
  const downOnOverlay = useRef(false);

  const { onKeyDown: restOnKeyDown, onAnimationEnd: restOnAnimationEnd, ...restProps } = rest;
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    restOnKeyDown?.(event);
    if (event.key === 'Escape') onClose?.();
  };
  const handleAnimationEnd: AnimationEventHandler<HTMLDivElement> = (event) => {
    restOnAnimationEnd?.(event);
    onAnimationEnd(event);
  };

  return (
    // The backdrop is a pointer-only close convenience; Escape and the close button provide keyboard access.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className={cx('lyra-bottomsheet-overlay', closing && 'lyra-bottomsheet-overlay--closing')}
      onMouseDown={(event) => {
        downOnOverlay.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (downOnOverlay.current && event.target === event.currentTarget) onClose?.();
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
        aria-modal="true"
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
        )}
        <div className="lyra-bottomsheet__body">{children}</div>
      </div>
    </div>
  );
}

/**
 * A controlled modal panel anchored to the bottom viewport edge. It is portaled, traps focus,
 * locks background scroll, and restores focus to its opener after the controlled `open` prop closes.
 */
export const BottomSheet = /*#__PURE__*/ forwardRef<HTMLDivElement, BottomSheetProps>(
  function BottomSheet(
    {
      open,
      onClose,
      closeLabel = 'Close',
      title,
      container,
      className,
      children,
      'aria-label': accessibleName,
      ...rest
    },
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement | null>(null);
    const openerRef = useRef<Element | null>(null);
    const { mounted, closing, onAnimationEnd } = usePresence(open);

    useEffect(() => {
      if (open) return;
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
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
        <BottomSheetPanel
          panelRef={panelRef}
          attachPanel={attachPanel}
          titleId={titleId}
          title={title}
          accessibleName={accessibleName}
          onClose={onClose}
          closeLabel={closeLabel}
          open={open}
          captureOpener={captureOpener}
          className={className}
          rest={rest}
          closing={closing}
          onAnimationEnd={onAnimationEnd}
        >
          {children}
        </BottomSheetPanel>
      </Portal>
    );
  },
);
