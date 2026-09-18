import { forwardRef, isValidElement, useEffect, useId, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { cx } from '../internal/cx';
import { Slot } from '../internal/slot';
import { focusPopupItem, useFlipPlacement } from '../internal/use-flip-placement';

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

type DropdownCommand = Exclude<DropdownItem, { type: 'separator' } | { type: 'label' }>;

function isDropdownCommand(item: DropdownItem): item is DropdownCommand {
  return !('type' in item);
}

/** Props for {@link Dropdown}. */
export interface DropdownProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Content that opens the action menu — a Button, IconButton, Avatar, icon or plain text.
   * When it is an element, it receives the trigger semantics itself (role, tab stop, and the
   * menu ARIA) instead of being wrapped, so one control is one tab stop.
   */
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
  {
    trigger,
    items,
    align = 'start',
    defaultOpen = false,
    id,
    className,
    onClick,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const dropdownId = id ?? generatedId;
  const menuId = `${dropdownId}-menu`;
  const [open, setOpen] = useState(defaultOpen);
  const [pendingFocus, setPendingFocus] = useState<number | null>(null);
  const [rovingIndex, setRovingIndex] = useState(0);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef<{ prefix: string; timeout: ReturnType<typeof setTimeout> | null }>({
    prefix: '',
    timeout: null,
  });
  const placement = useFlipPlacement(open, triggerRef, menuRef, 6, undefined, true);
  const commandCount = items.filter(isDropdownCommand).length;
  const activeIndex = Math.min(rovingIndex, commandCount - 1);

  const commandItems = (): HTMLElement[] =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const commandForTarget = (target: EventTarget | null): HTMLButtonElement | null => {
    const command = (target as Element).closest<HTMLButtonElement>('[role="menuitem"]');
    return command && menuRef.current?.contains(command) ? command : null;
  };

  const focusCommand = (command: HTMLElement | undefined): void => {
    focusPopupItem(menuRef.current, command);
  };

  const restoreTriggerFocus = (): void => {
    triggerRef.current?.focus();
  };

  const clearTypeahead = (): void => {
    if (typeaheadRef.current.timeout !== null) clearTimeout(typeaheadRef.current.timeout);
    typeaheadRef.current = { prefix: '', timeout: null };
  };

  const closeMenu = (restoreFocus = false): void => {
    clearTypeahead();
    setOpen(false);
    setPendingFocus(null);
    if (restoreFocus) restoreTriggerFocus();
  };

  const openMenu = (focusIndex: number | null): void => {
    clearTypeahead();
    if (focusIndex !== null && commandCount > 0) {
      const index = focusIndex < 0 ? commandCount - 1 : Math.min(focusIndex, commandCount - 1);
      setRovingIndex(index);
      setPendingFocus(index);
    } else {
      setPendingFocus(null);
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open || pendingFocus === null) return;
    const commands = commandItems();
    if (commands.length === 0) {
      setPendingFocus(null);
      return;
    }
    focusCommand(commands[Math.min(pendingFocus, commands.length - 1)]);
    setPendingFocus(null);
  }, [items, open, pendingFocus]);

  useEffect(() => {
    return () => {
      clearTypeahead();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocumentMouseDown = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        clearTypeahead();
        setOpen(false);
        setPendingFocus(null);
      }
    };
    document.addEventListener('mousedown', onDocumentMouseDown);
    return () => document.removeEventListener('mousedown', onDocumentMouseDown);
  }, [open]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(-1);
    }
  };

  const handleTypeahead = (event: KeyboardEvent<HTMLElement>, currentIndex: number): void => {
    if (
      event.key === ' ' ||
      event.key.length !== 1 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    const key = event.key.toLocaleLowerCase();
    const currentPrefix = typeaheadRef.current.prefix;
    const prefix = currentPrefix === key ? key : `${currentPrefix}${key}`;
    const commands = commandItems();
    const matchingIndex = Array.from(
      { length: commands.length },
      (_, offset) => (currentIndex + offset + 1) % commands.length,
    ).find((index) => {
      const label = commands[index]?.querySelector<HTMLElement>(
        '[data-lyra-dropdown-command-label]',
      );
      return label?.textContent?.toLocaleLowerCase().startsWith(prefix) ?? false;
    });

    if (typeaheadRef.current.timeout !== null) clearTimeout(typeaheadRef.current.timeout);
    typeaheadRef.current = {
      prefix,
      timeout: setTimeout(() => {
        typeaheadRef.current = { prefix: '', timeout: null };
      }, 500),
    };
    if (matchingIndex !== undefined) focusCommand(commands[matchingIndex]);
  };

  const handleMenuItemKeyDown = (event: KeyboardEvent<HTMLSpanElement>): void => {
    const command = commandForTarget(event.target);
    if (!command) return;

    const commands = commandItems();
    const currentIndex = commands.indexOf(command);
    if (currentIndex < 0 || commands.length === 0) return;

    let nextIndex: number | undefined;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % commands.length;
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + commands.length) % commands.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = commands.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      focusCommand(commands[nextIndex]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'Tab') {
      // Do not prevent Tab: closing must leave native sequential focus navigation intact.
      closeMenu();
    } else {
      handleTypeahead(event, currentIndex);
    }
  };

  const attachRoot = (node: HTMLSpanElement | null): void => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const triggerProps = {
    ref: triggerRef,
    className: 'lyra-dropdown__trigger',
    role: 'button',
    tabIndex: 0,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    'aria-controls': menuId,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event as KeyboardEvent<HTMLSpanElement>);
      handleTriggerKeyDown(event);
    },
  };

  return (
    // The root is not interactive; its bubble handlers keep consumer callbacks at their native
    // currentTarget and make cancellation observable before menu defaults run.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      {...rest}
      ref={attachRoot}
      id={dropdownId}
      className={cx('lyra-dropdown', className)}
      onKeyDown={(event) => {
        if (triggerRef.current?.contains(event.target as Node)) return;
        onKeyDown?.(event);
        if (!event.defaultPrevented) handleMenuItemKeyDown(event);
      }}
      onClick={(event) => {
        // Keep the clicked command stable across synchronous consumer updates.
        const command = commandForTarget(event.target);
        const item = command && items.filter(isDropdownCommand)[commandItems().indexOf(command)];
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (triggerRef.current?.contains(event.target as Node)) {
          if (open) closeMenu();
          else openMenu(null);
        } else if (item) {
          item.onSelect?.();
          closeMenu(true);
        }
      }}
    >
      {/*
        The trigger BECOMES the interactive element rather than being wrapped in one. Wrapping a
        consumer's Button in a `span[role="button"][tabIndex=0]` produced two tab stops for one
        control — the outer span carrying `aria-haspopup`/`aria-expanded` and the inner button
        carrying neither — which axe reports as `nested-interactive`. Slot merges the trigger
        semantics onto the element the consumer passed; only a bare string still needs a span of
        its own. Child props win the merge, so a trigger that brings its own `aria-label` keeps it.
      */}
      {isValidElement(trigger) ? (
        <Slot {...triggerProps}>{trigger}</Slot>
      ) : (
        <span {...triggerProps}>{trigger}</span>
      )}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className={cx(
            'lyra-menu',
            `lyra-menu--${align}`,
            placement.side === 'up' && 'lyra-menu--up',
          )}
          role="menu"
        >
          {(() => {
            let commandIndex = 0;
            return items.map((item, index) => {
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
              const currentCommandIndex = commandIndex;
              commandIndex += 1;
              return (
                <button
                  key={item.id ?? index}
                  type="button"
                  role="menuitem"
                  tabIndex={currentCommandIndex === activeIndex ? 0 : -1}
                  className={cx('lyra-menu__item', item.danger && 'lyra-menu__item--danger')}
                  onFocus={() => setRovingIndex(currentCommandIndex)}
                >
                  {item.icon}
                  <span data-lyra-dropdown-command-label>{item.label}</span>
                </button>
              );
            });
          })()}
        </div>
      )}
    </span>
  );
});
