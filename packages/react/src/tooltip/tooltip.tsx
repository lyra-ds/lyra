import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { cx } from '../internal/cx';
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
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const resolvedPlacement = useTooltipPlacement(open, placement, rootRef);

  const show = (): void => setOpen(true);
  const hide = (): void => setOpen(false);

  const attachRoot = (node: HTMLSpanElement | null): void => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  // WCAG 1.4.13 asks that content shown on hover be dismissible without moving the pointer. The
  // element's own key handler only fires when focus is inside it, which is never true for a tip
  // opened by hovering, so Escape has to be heard at the document.
  useEffect(() => {
    if (!open) return;
    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, [open]);
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      hide();
    }
  };

  const child = isValidElement(children)
    ? (children as ReactElement<Record<string, unknown>>)
    : undefined;
  const target = child
    ? cloneElement(child, {
        'aria-describedby': [child.props['aria-describedby'], tooltipId].filter(Boolean).join(' '),
        onFocus: (event: FocusEvent<HTMLElement>) => {
          const childHandler = child.props.onFocus as
            ((event: FocusEvent<HTMLElement>) => void) | undefined;
          childHandler?.(event);
          show();
        },
        onBlur: (event: FocusEvent<HTMLElement>) => {
          const childHandler = child.props.onBlur as
            ((event: FocusEvent<HTMLElement>) => void) | undefined;
          childHandler?.(event);
          hide();
        },
        onMouseEnter: (event: MouseEvent<HTMLElement>) => {
          const childHandler = child.props.onMouseEnter as
            ((event: MouseEvent<HTMLElement>) => void) | undefined;
          childHandler?.(event);
          show();
        },
        onMouseLeave: (event: MouseEvent<HTMLElement>) => {
          const childHandler = child.props.onMouseLeave as
            ((event: MouseEvent<HTMLElement>) => void) | undefined;
          childHandler?.(event);
          hide();
        },
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
          const childHandler = child.props.onKeyDown as
            ((event: ReactKeyboardEvent<HTMLElement>) => void) | undefined;
          childHandler?.(event);
          if (!event.defaultPrevented) handleKeyDown(event);
        },
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
        show();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        hide();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        show();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        hide();
      }}
      onKeyDown={handleKeyDown}
    >
      {target}
      <span id={tooltipId} role="tooltip" hidden>
        {tip}
      </span>
    </span>
  );
});
