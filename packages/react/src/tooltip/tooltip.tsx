import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type {
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { cx } from '../internal/cx';
import { getTooltipCoordinator } from '../internal/tooltip-coordinator';
import type { TooltipCoordinator, TooltipOwner } from '../internal/tooltip-coordinator';
import { useTooltipPlacement } from '../internal/use-tooltip-placement';
import type { TooltipPlacement } from '../internal/use-tooltip-placement';

/** Props for {@link Tooltip}. */
export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Short, non-interactive text shown for the target. */
  tip: string;
  /** The target element. Pass one focusable React element for full keyboard support. */
  children: ReactNode;
  /**
   * Side of the target to draw the tip on. Default `"top"`. The tip flips to the opposite side on
   * its own when the chosen one would be clipped by the viewport, so this is a preference.
   */
  placement?: TooltipPlacement;
}

/**
 * A hover- and focus-triggered tooltip.
 *
 * The shipped stylesheet owns visual presentation through `data-tip`; the hidden DOM node gives
 * assistive technologies a real `role="tooltip"` target without duplicating visible text.
 */
export const Tooltip = /*#__PURE__*/ forwardRef<HTMLSpanElement, TooltipProps>(function Tooltip(
  {
    tip,
    children,
    id,
    className,
    placement = 'top',
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const [rootNode, setRootNode] = useState<HTMLSpanElement | null>(null);
  const coordinatorRef = useRef<TooltipCoordinator | null>(null);
  const openTimerRef = useRef<number | undefined>(undefined);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const timerWindowRef = useRef<Window | null>(null);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const visibleRef = useRef(false);
  const dismissedRef = useRef(false);
  const targetRef = useRef<Element | null>(null);
  const tipRef = useRef(tip);
  tipRef.current = tip;
  const resolvedPlacement = useTooltipPlacement(open, placement, rootRef);

  const clearOpenTimer = useCallback((): void => {
    if (openTimerRef.current !== undefined) {
      timerWindowRef.current?.clearTimeout(openTimerRef.current);
      openTimerRef.current = undefined;
    }
  }, []);
  const clearCloseTimer = useCallback((): void => {
    if (closeTimerRef.current !== undefined) {
      timerWindowRef.current?.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  }, []);
  const close = useCallback((): void => {
    clearOpenTimer();
    clearCloseTimer();
    if (!visibleRef.current) return;
    visibleRef.current = false;
    setOpen(false);
    coordinatorRef.current?.closed(ownerRef.current);
  }, [clearCloseTimer, clearOpenTimer]);
  const openNow = useCallback(
    (scheduledTarget?: Element): void => {
      clearOpenTimer();
      clearCloseTimer();
      const root = rootRef.current;
      const target = root?.firstElementChild;
      if (
        dismissedRef.current ||
        !root?.isConnected ||
        !target ||
        !root.contains(target) ||
        (scheduledTarget !== undefined && target !== scheduledTarget)
      ) {
        return;
      }
      targetRef.current = target;
      if (!visibleRef.current) {
        visibleRef.current = true;
        setOpen(true);
        coordinatorRef.current?.opened(ownerRef.current);
      }
    },
    [clearCloseTimer, clearOpenTimer],
  );
  const updateOwnership = useCallback((): void => {
    if (!hoverRef.current && !focusRef.current) dismissedRef.current = false;
    coordinatorRef.current?.ownershipChanged();
  }, []);
  const scheduleClose = useCallback((): void => {
    if (focusRef.current || !visibleRef.current || closeTimerRef.current !== undefined) return;
    const window = rootRef.current?.ownerDocument.defaultView;
    if (!window) return;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = undefined;
      if (!hoverRef.current && !focusRef.current) close();
    }, 100);
  }, [close]);
  const scheduleOpen = useCallback((): void => {
    if (dismissedRef.current || visibleRef.current || openTimerRef.current !== undefined) return;
    if (coordinatorRef.current?.isWarm()) {
      openNow();
      return;
    }
    const root = rootRef.current;
    const window = root?.ownerDocument.defaultView;
    if (!root || !window) return;
    const target = root.firstElementChild;
    if (!target) return;
    targetRef.current = target;
    const scheduledTip = tipRef.current;
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = undefined;
      if (hoverRef.current && tipRef.current === scheduledTip) openNow(target);
    }, 500);
  }, [openNow]);
  const dismiss = useCallback((): void => {
    dismissedRef.current = true;
    close();
    updateOwnership();
  }, [close, updateOwnership]);
  const ownerRef = useRef<TooltipOwner>({
    hasOwnership: () => hoverRef.current || focusRef.current,
    dismiss,
  });
  ownerRef.current.dismiss = dismiss;

  const attachRoot = useCallback(
    (node: HTMLSpanElement | null): void => {
      if (rootRef.current !== node) {
        rootRef.current = node;
        if (node) timerWindowRef.current = node.ownerDocument.defaultView;
        setRootNode((current) => (current === node ? current : node));
      }
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    if (!rootNode) return;
    const coordinator = getTooltipCoordinator(rootNode.ownerDocument);
    const owner = ownerRef.current;
    coordinatorRef.current = coordinator;
    targetRef.current = rootNode.firstElementChild;
    coordinator.register(owner);
    const observer = new MutationObserver(() => {
      if (targetRef.current && !rootNode.contains(targetRef.current)) {
        focusRef.current = rootNode.contains(rootNode.ownerDocument.activeElement);
        hoverRef.current = rootNode.matches(':hover');
        close();
        updateOwnership();
      }
    });
    observer.observe(rootNode, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearOpenTimer();
      clearCloseTimer();
      coordinator.unregister(owner);
      coordinatorRef.current = null;
      visibleRef.current = false;
    };
  }, [clearCloseTimer, clearOpenTimer, close, rootNode, updateOwnership]);

  useEffect(() => {
    clearOpenTimer();
    clearCloseTimer();
    if (visibleRef.current) close();
  }, [clearCloseTimer, clearOpenTimer, close, tip]);

  const child = isValidElement(children)
    ? (children as ReactElement<Record<string, unknown>>)
    : undefined;
  const target = child
    ? cloneElement(child, {
        'aria-describedby': [child.props['aria-describedby'], tooltipId].filter(Boolean).join(' '),
      })
    : children;

  return (
    // The wrapper must receive pointer transitions between its target and tooltip surface so the
    // tip remains dismissible only after the pointer leaves both (WCAG 1.4.13).
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      {...rest}
      ref={attachRoot}
      id={rootId}
      className={cx(
        'lyra-tooltip',
        resolvedPlacement !== 'top' && `lyra-tooltip--${resolvedPlacement}`,
        className,
      )}
      data-tip={tip}
      data-state={open ? 'open' : 'closed'}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (event.defaultPrevented) return;
        hoverRef.current = true;
        clearCloseTimer();
        updateOwnership();
        scheduleOpen();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        if (event.defaultPrevented) return;
        hoverRef.current = false;
        clearOpenTimer();
        updateOwnership();
        scheduleClose();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        focusRef.current = true;
        clearCloseTimer();
        updateOwnership();
        openNow();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (event.defaultPrevented || rootRef.current?.contains(event.relatedTarget)) return;
        focusRef.current = false;
        updateOwnership();
        if (!hoverRef.current) close();
      }}
      onKeyDown={(event: ReactKeyboardEvent<HTMLSpanElement>) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && coordinatorRef.current?.dismissTop(event.nativeEvent)) {
          // React ancestors inspect the SyntheticEvent, while the document route receives its
          // native event. Mark both only when this Tooltip actually handled Escape.
          event.preventDefault();
        }
      }}
    >
      {target}
      <span id={tooltipId} role="tooltip" hidden>
        {tip}
      </span>
    </span>
  );
});
