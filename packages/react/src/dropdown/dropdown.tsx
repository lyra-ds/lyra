import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { useFlipPlacement } from '../internal/use-flip-placement';

/** A command, separator, or non-interactive label rendered in a {@link Dropdown}. */
export type DropdownItem =
  | {
      /** Stable React key for this command. */
      id?: string;
      /** Command content. */
      label: ReactNode;
      /** Optional leading icon. */
      icon?: ReactNode;
      /** Applies the destructive-command menu styling. */
      danger?: boolean;
      /** Called when the command is selected. */
      onSelect?: () => void;
    }
  | { /** Visual separator between command groups. */ type: 'separator' }
  | { /** Non-interactive label above a command group. */ type: 'label'; label: ReactNode };

/** Props for {@link Dropdown}. */
export interface DropdownProps extends HTMLAttributes<HTMLSpanElement> {
  /** Element that opens the action menu, such as a Button, IconButton, or Avatar. */
  trigger: ReactNode;
  /** Commands, separators, and labels rendered by the menu. */
  items: DropdownItem[];
  /** Popup alignment. Default: `"start"`. */
  align?: 'start' | 'end';
  /** Whether the menu starts open. Useful for demos. */
  defaultOpen?: boolean;
}

/**
 * An APG menu button with real focus roving across its commands.
 *
 * The wrapper deliberately uses a `span[role="button"]` for the trigger: consumers commonly
 * pass an existing `<button>` (for example, Lyra Button or IconButton), and another literal
 * `<button>` would create invalid nested interactive content. The span has full button semantics
 * and is the focus-restoration target for every menu-owned close path.
 */
export const Dropdown = /*#__PURE__*/ forwardRef<HTMLSpanElement, DropdownProps>(function Dropdown(
  { trigger, items, align = 'start', defaultOpen = false, id, className, onKeyDown, ...rest },
  ref,
) {
  const generatedId = useId();
  const dropdownId = id ?? generatedId;
  const menuId = `${dropdownId}-menu`;
  const [open, setOpen] = useState(defaultOpen);
  const [pendingFocus, setPendingFocus] = useState<number | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const placement = useFlipPlacement(open, triggerRef, menuRef);

  const commandItems = (): HTMLElement[] =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const restoreTriggerFocus = (): void => {
    triggerRef.current?.focus();
  };

  const closeMenu = (restoreFocus = false): void => {
    setOpen(false);
    setPendingFocus(null);
    if (restoreFocus) restoreTriggerFocus();
  };

  const openMenu = (focusIndex: number | null): void => {
    setPendingFocus(focusIndex);
    setOpen(true);
  };

  useEffect(() => {
    if (!open || pendingFocus === null) return;
    const commands = commandItems();
    if (commands.length === 0) return;
    const index = pendingFocus < 0 ? commands.length - 1 : pendingFocus;
    // preventScroll: the menu is already placed to fit; focusing an item must not scroll the page.
    commands[Math.min(index, commands.length - 1)]?.focus({ preventScroll: true });
    setPendingFocus(null);
  }, [open, pendingFocus]);

  useEffect(() => {
    if (!open) return;
    const onDocumentMouseDown = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setPendingFocus(null);
      }
    };
    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, [open]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLSpanElement>): void => {
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(-1);
    }
  };

  const handleMenuItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.defaultPrevented) return;
    const commands = commandItems();
    const currentIndex = commands.indexOf(event.currentTarget);
    if (currentIndex < 0 || commands.length === 0) return;

    let nextIndex: number | undefined;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % commands.length;
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + commands.length) % commands.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = commands.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      commands[nextIndex]?.focus();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'Tab') {
      // Do not prevent Tab: closing must leave native sequential focus navigation intact.
      closeMenu();
    }
  };

  const attachRoot = (node: HTMLSpanElement | null): void => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    // The root forwards the native `onKeyDown` prop for non-trigger descendants. It is not
    // itself interactive; the trigger and menuitems own the corresponding keyboard semantics.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      {...rest}
      ref={attachRoot}
      id={dropdownId}
      className={cx('lyra-dropdown', className)}
      onKeyDown={(event) => {
        // Trigger calls the consumer handler before its own behavior so preventDefault remains
        // an escape hatch. Other descendants retain the normal root-level handler contract.
        if (event.target !== triggerRef.current) onKeyDown?.(event);
      }}
    >
      {/* A role button avoids invalid nested buttons when trigger is a Lyra Button/IconButton. */}
      <span
        ref={triggerRef}
        className="lyra-dropdown__trigger"
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? closeMenu() : openMenu(null))}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          handleTriggerKeyDown(event);
        }}
      >
        {trigger}
      </span>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className={cx('lyra-menu', `lyra-menu--${align}`, placement === 'up' && 'lyra-menu--up')}
          role="menu"
        >
          {items.map((item, index) => {
            if ('type' in item && item.type === 'separator') {
              return <hr key={`separator-${index}`} className="lyra-menu__sep" />;
            }
            if ('type' in item && item.type === 'label') {
              return (
                <span key={`label-${index}`} className="lyra-menu__label">
                  {item.label}
                </span>
              );
            }
            return (
              <button
                key={item.id ?? index}
                type="button"
                role="menuitem"
                className={cx('lyra-menu__item', item.danger && 'lyra-menu__item--danger')}
                onKeyDown={handleMenuItemKeyDown}
                onClick={() => {
                  item.onSelect?.();
                  closeMenu(true);
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
});
