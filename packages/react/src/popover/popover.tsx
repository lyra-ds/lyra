import { forwardRef, isValidElement, useEffect, useId, useRef } from 'react';
import type {
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';
import { useControllableState } from '../internal/use-controllable-state';
import { useFlipPlacement } from '../internal/use-flip-placement';

interface ReturnFocusIntent {
  ownerDocument: Document;
  focusedElement: HTMLElement;
}

function isInert(root: HTMLElement | null): boolean {
  return root?.closest('[inert]') !== null;
}

function isEligibleTrigger(
  trigger: HTMLElement | null,
  ownerDocument: Document,
): trigger is HTMLElement {
  if (!trigger || trigger.ownerDocument !== ownerDocument || !trigger.isConnected) return false;
  if (trigger.matches(':disabled')) return false;
  if (trigger.closest('[hidden], [inert], [aria-hidden="true"]')) return false;

  const style = ownerDocument.defaultView?.getComputedStyle(trigger);
  return (
    style?.display !== 'none' &&
    style?.visibility !== 'hidden' &&
    style?.visibility !== 'collapse' &&
    trigger.getClientRects().length > 0
  );
}

/** Props for {@link Popover}. */
export interface PopoverProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Interactive element that opens and closes the panel. It receives the panel's keyboard and
   * ARIA semantics directly, so pass a focusable control such as a `<button>` or `Button`.
   */
  trigger: ReactNode;
  /** Whether the panel is open in controlled mode. */
  open?: boolean;
  /** Whether the panel is initially open in uncontrolled mode. Default: `false`. */
  defaultOpen?: boolean;
  /** Called whenever the requested open state changes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Preferred vertical side. Default: automatic placement; `"top"` and `"bottom"` keep the
   * panel on that explicit side.
   */
  side?: 'auto' | 'bottom' | 'top';
  /**
   * Preferred horizontal alignment. Default: automatic placement; an explicit value overrides
   * it.
   */
  align?: 'start' | 'end' | 'center';
  /** Fixed panel width in CSS pixels. */
  width?: number;
  /** Accessible name for the non-modal dialog panel. Default: `"Popover"`. */
  ariaLabel?: string;
  /** Content rendered in the panel. */
  children: ReactNode;
}

/**
 * An in-flow, trigger-anchored non-modal dialog for menus, filters, and pickers.
 *
 * The trigger receives its own semantics through {@link Slot}, preserving one interactive
 * element and one tab stop when the consumer passes a Button or other control.
 */
export const Popover = /*#__PURE__*/ forwardRef<HTMLSpanElement, PopoverProps>(function Popover(
  {
    trigger,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    side = 'auto',
    align,
    width,
    ariaLabel = 'Popover',
    id,
    className,
    children,
    onKeyDown: restOnKeyDown,
    onMouseDownCapture: restOnMouseDownCapture,
    ...restProps
  },
  forwardedRef,
) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const panelId = `${rootId}-panel`;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const insideMouseDownsRef = useRef(new WeakSet<MouseEvent>());
  const pendingFocusIntentRef = useRef<ReturnFocusIntent | null>(null);
  const previousOpenRef = useRef(open);
  const explicitSide = side === 'auto' ? undefined : side === 'bottom' ? 'down' : 'up';
  const placement = useFlipPlacement(open, triggerRef, panelRef, 8, explicitSide, true);
  const resolvedSide = side === 'auto' ? placement.side : side === 'bottom' ? 'down' : 'up';
  const resolvedAlign = align ?? placement.align;
  const automaticAlignmentStyle =
    align === undefined
      ? placement.align === 'start'
        ? { left: 0, right: 'auto' }
        : { left: 'auto', right: 0 }
      : undefined;

  useEffect(() => {
    if (!open) return;
    const ownerDocument = rootRef.current?.ownerDocument;
    if (!ownerDocument) return;

    const onDocumentMouseDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      const originatedInside = insideMouseDownsRef.current.has(event);
      insideMouseDownsRef.current.delete(event);
      if (
        event.defaultPrevented ||
        !root ||
        isInert(root) ||
        originatedInside ||
        root.contains(event.target as Node)
      ) {
        return;
      }

      pendingFocusIntentRef.current = null;
      setOpen(false);
    };
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
      const root = rootRef.current;
      if (event.key !== 'Escape' || event.defaultPrevented || !root || isInert(root)) return;

      event.preventDefault();
      pendingFocusIntentRef.current = null;
      setOpen(false);
    };
    ownerDocument.addEventListener('mousedown', onDocumentMouseDown);
    ownerDocument.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      ownerDocument.removeEventListener('mousedown', onDocumentMouseDown);
      ownerDocument.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [open, setOpen]);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;
    if (open) {
      if (!wasOpen) pendingFocusIntentRef.current = null;
      return;
    }
    if (!wasOpen) return;

    const intent = pendingFocusIntentRef.current;
    pendingFocusIntentRef.current = null;
    if (!intent) return;

    const activeElement = intent.ownerDocument.activeElement;
    if (
      activeElement !== intent.focusedElement &&
      activeElement !== intent.ownerDocument.body &&
      activeElement !== intent.ownerDocument.documentElement
    ) {
      return;
    }

    const trigger = triggerRef.current;
    if (isEligibleTrigger(trigger, intent.ownerDocument) && activeElement !== trigger) {
      trigger.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(
    () => () => {
      pendingFocusIntentRef.current = null;
    },
    [],
  );

  const attachRoot = (node: HTMLSpanElement | null): void => {
    rootRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const triggerProps = {
    ref: triggerRef,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'aria-controls': panelId,
    onClick: () => {
      pendingFocusIntentRef.current = null;
      setOpen(!open);
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pendingFocusIntentRef.current = null;
        setOpen(!open);
      }
    },
  };

  const handleRootKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>): void => {
    restOnKeyDown?.(event);
    const root = rootRef.current;
    if (event.key !== 'Escape' || event.defaultPrevented || !open || !root || isInert(root)) return;

    const ownerDocument = root.ownerDocument;
    const activeElement = ownerDocument.activeElement;
    const elementConstructor = ownerDocument.defaultView?.HTMLElement;
    pendingFocusIntentRef.current =
      panelRef.current &&
      elementConstructor &&
      activeElement instanceof elementConstructor &&
      panelRef.current.contains(activeElement)
        ? { ownerDocument, focusedElement: activeElement }
        : null;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
  };

  const handleRootMouseDownCapture = (event: ReactMouseEvent<HTMLSpanElement>): void => {
    restOnMouseDownCapture?.(event);
    insideMouseDownsRef.current.add(event.nativeEvent);
  };

  return (
    // The root is not interactive; its handlers let the consumer observe and cancel defaults
    // while React portal descendants retain their logical ownership at this boundary.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      {...restProps}
      ref={attachRoot}
      id={rootId}
      className={cx('lyra-popover-anchor', className)}
      onKeyDown={handleRootKeyDown}
      onMouseDownCapture={handleRootMouseDownCapture}
    >
      {isValidElement(trigger) ? (
        <Slot {...triggerProps}>{trigger}</Slot>
      ) : (
        <span {...triggerProps} role="button" tabIndex={0}>
          {trigger}
        </span>
      )}
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className={cx(
            'lyra-popover',
            `lyra-popover--${resolvedSide === 'down' ? 'bottom' : 'top'}`,
            `lyra-popover--align-${resolvedAlign}`,
          )}
          role="dialog"
          aria-label={ariaLabel}
          style={
            width === undefined && automaticAlignmentStyle === undefined
              ? undefined
              : { width, ...automaticAlignmentStyle }
          }
        >
          {children}
        </div>
      )}
    </span>
  );
});
