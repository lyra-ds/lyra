import { forwardRef, isValidElement, useEffect, useId, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';
import { useControllableState } from '../internal/use-controllable-state';
import { useFlipPlacement } from '../internal/use-flip-placement';

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
    ...rest
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
  const placement = useFlipPlacement(open, triggerRef, panelRef, 8);
  const resolvedSide = side === 'auto' ? placement.side : side === 'bottom' ? 'down' : 'up';
  const resolvedAlign = align ?? placement.align;

  useEffect(() => {
    if (!open) return;
    const onDocumentMouseDown = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [open, setOpen]);

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
    onClick: () => setOpen(!open),
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(!open);
      }
    },
  };

  return (
    <span {...rest} ref={attachRoot} id={rootId} className={cx('lyra-popover-anchor', className)}>
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
          style={width === undefined ? undefined : { width }}
        >
          {children}
        </div>
      )}
    </span>
  );
});
