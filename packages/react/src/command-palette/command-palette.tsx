import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ForwardedRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Icon } from '../icon';
import { cx } from '../internal/cx';
import { Portal } from '../internal/portal';
import { useFocusTrap } from '../internal/use-focus-trap';
import { useInitialFocus } from '../internal/use-initial-focus';
import { useModalActivity } from '../internal/use-modal-activity';
import {
  ModalLayerProvider,
  isModalLayerTopmost,
  useModalLayer,
  useModalLayerRegistration,
  type ModalLayerValue,
} from '../internal/use-modal-layer';
import { usePresence, type PresenceState } from '../internal/use-presence';
import { useReturnFocus } from '../internal/use-return-focus';
import { useScrollLock } from '../internal/use-scroll-lock';

/** A command available from {@link CommandPalette}. */
export interface CommandItem {
  /** Stable consumer-owned item key. */
  id: string;
  /** Primary command text. */
  label: string;
  /** Optional icon rendered before the command text. */
  icon?: ReactNode;
  /** Optional secondary text, also included in filtering. */
  hint?: string;
  /** Optional displayed keyboard shortcut, with keys separated by spaces. */
  shortcut?: string;
  /** Called before the palette-level `onSelect` callback when this item is chosen. */
  onSelect?: () => void;
}

/** A labelled collection of {@link CommandItem} entries. */
export interface CommandGroup {
  /** Optional visible group label. */
  label?: string;
  /** Commands in this group. */
  items: CommandItem[];
}

/** Labels for the keyboard hints in {@link CommandPalette}'s footer. */
export interface CommandPaletteHints {
  /** Label after the ↑↓ keys. Default `"navigate"`. */
  navigate?: string;
  /** Label after the ↵ key. Default `"select"`. */
  select?: string;
  /** Label after the esc key. Default `"close"`. */
  close?: string;
}

/** Props for {@link CommandPalette}. */
export interface CommandPaletteProps {
  /** Controls modal visibility. On close, the overlay and panel remain mounted for their exit motion. Ignored in inline mode. */
  open?: boolean;
  /** Called when the palette is dismissed or an item is selected. */
  onClose?: () => void;
  /** Enables the global Command/Ctrl+hotkey listener and is called to open the palette. */
  onOpen?: () => void;
  /** Called with the chosen item after its own `onSelect` callback. */
  onSelect?: (item: CommandItem) => void;
  /** Command groups to filter and render. */
  groups?: CommandGroup[];
  /** Search field placeholder. Default: `"Type a command or search…"`. */
  placeholder?: string;
  /** Text shown before the current query when no commands match. Default: `"No results for"`. */
  emptyMessage?: string;
  /** Accessible name for the command search field. Default: `"Search commands"`. */
  searchLabel?: string;
  /** Overrides for the footer keyboard hints. Merged over the defaults, so partial objects work. */
  hints?: CommandPaletteHints;
  /** Key used with Command/Ctrl for the global shortcut. Default: `"k"`. */
  hotkey?: string;
  /** Renders the panel without an overlay, portal, focus trap, or scroll lock. */
  inline?: boolean;
  /** Returns the current element to focus after an accepted modal close. Ignored in inline mode. */
  returnFocusTo?: () => HTMLElement | null;
  /** Resolves the initial focus destination inside the modal on each accepted opening. Ignored in inline mode. */
  initialFocusTo?: () => HTMLElement | null;
  /** Additional class name appended to `.lyra-cmdk`. */
  className?: string;
  /**
   * Accessible name for the modal dialog. Default: `"Command palette"`. Translate it in a
   * localized interface — it is what a screen reader announces when the palette opens.
   * Ignored in inline mode, which is not a dialog.
   */
  'aria-label'?: string;
}

interface CommandPaletteTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** Visible and accessible button label. */
  label: string;
  /** Optional keyboard shortcut displayed beside the label. */
  shortcut?: string;
}

/** A search-shaped button that delegates opening behavior to its consumer. */
const CommandPaletteTrigger = /*#__PURE__*/ forwardRef<
  HTMLButtonElement,
  CommandPaletteTriggerProps
>(function CommandPaletteTrigger({ label, shortcut, className, ...rest }, ref) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      className={cx('lyra-cmdk-trigger', className)}
      aria-label={label}
    >
      <svg
        className="lyra-cmdk-trigger__icon"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span className="lyra-cmdk-trigger__label">{label}</span>
      {shortcut && <kbd className="lyra-kbd">{shortcut}</kbd>}
    </button>
  );
});

const DEFAULT_HINTS: Required<CommandPaletteHints> = {
  navigate: 'navigate',
  select: 'select',
  close: 'close',
};

interface IndexedCommandItem {
  item: CommandItem;
  index: number;
}

interface VisibleCommandGroup {
  label?: string;
  groupIndex: number;
  items: IndexedCommandItem[];
}

interface CommandPalettePanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  overlay: HTMLElement | null;
  attachPanel: (node: HTMLDivElement | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
  listboxId: string;
  idBase: string;
  visibleGroups: VisibleCommandGroup[];
  flatItems: IndexedCommandItem[];
  activeIndex: number;
  query: string;
  placeholder: string;
  emptyMessage: string;
  searchLabel: string;
  dialogLabel: string;
  hints: Required<CommandPaletteHints>;
  className?: string;
  modal: boolean;
  open: boolean;
  closing: boolean;
  onQueryChange: (query: string) => void;
  onActiveIndexChange: (index: number) => void;
  onPick: (item: CommandItem) => void;
  onClose?: () => void;
  onAnimationEnd: PresenceState['onAnimationEnd'];
  onReady: () => void;
  captureOpener?: (element: Element | null) => void;
  initialFocusTo?: () => HTMLElement | null;
  layer: ModalLayerValue;
  revokeGesture: () => void;
}

/**
 * The panel is intentionally the Portal child in overlay mode. Its DOM effects run only after
 * the portaled elements exist, avoiding the Portal mount race for focusing and focus trapping.
 */
function CommandPalettePanel({
  panelRef,
  overlay,
  attachPanel,
  inputRef,
  listRef,
  listboxId,
  idBase,
  visibleGroups,
  flatItems,
  activeIndex,
  query,
  placeholder,
  emptyMessage,
  searchLabel,
  dialogLabel,
  hints,
  className,
  modal,
  open,
  closing,
  onQueryChange,
  onActiveIndexChange,
  onPick,
  onClose,
  onAnimationEnd,
  onReady,
  captureOpener,
  initialFocusTo,
  layer,
  revokeGesture,
}: CommandPalettePanelProps): ReactNode {
  const { topmost, isTopmost } = useModalLayerRegistration(
    layer,
    overlay,
    captureOpener,
    revokeGesture,
  );
  const active = !modal || open;
  // A filter invalidates the old option collection, so the active descendant always returns to
  // its first visible item. Keeping DOM focus on this input is the APG activedescendant model.
  const activeItem = flatItems[activeIndex];
  const activeOptionId = activeItem ? `${idBase}-option-${activeItem.index}` : undefined;

  const defaultInitialFocusTo = useCallback(() => inputRef.current, [inputRef]);
  const captureInitialOpener = useCallback(
    (element: Element | null) => captureOpener?.(element),
    [captureOpener],
  );
  const { focusInitial, resetInitialFocus } = useInitialFocus({
    initialFocusTo,
    panelRef,
    captureOpener: captureInitialOpener,
    defaultFocusTo: defaultInitialFocusTo,
  });

  useEffect(() => {
    if (modal && !open) {
      resetInitialFocus();
      return;
    }
    onReady();
  }, [modal, onReady, open, resetInitialFocus]);

  useEffect(() => {
    if (modal && (!open || !topmost)) return;
    const frame = requestAnimationFrame(() => {
      if (modal) focusInitial();
      else inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [focusInitial, inputRef, modal, open, topmost]);

  useFocusTrap(panelRef, modal && open && topmost);
  useScrollLock(modal && open, panelRef);

  // Focus never leaves the input in this model, so the active option needs manual scrolling.
  useEffect(() => {
    if (!activeOptionId || !listRef.current) return;
    const option = document.getElementById(activeOptionId);
    const list = listRef.current;
    if (!option || !list.contains(option)) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [activeOptionId, listRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!active || (modal && !isTopmost())) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatItems.length > 0) {
        onActiveIndexChange(Math.min(activeIndex + 1, flatItems.length - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatItems.length > 0) onActiveIndexChange(Math.max(activeIndex - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeItem) onPick(activeItem.item);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
    }
  };

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!modal || !open || !isTopmost() || event.key !== 'Escape') return;

    event.stopPropagation();
    if (!event.defaultPrevented) {
      event.preventDefault();
      onClose?.();
    }
  };

  return (
    <div
      ref={attachPanel}
      className={cx('lyra-cmdk', closing && 'lyra-cmdk--closing', className)}
      role={modal ? 'dialog' : undefined}
      aria-modal={(modal && open) || undefined}
      aria-label={modal ? dialogLabel : undefined}
      tabIndex={modal ? -1 : undefined}
      onKeyDown={handlePanelKeyDown}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="lyra-cmdk__search">
        <Icon name="search" size={17} color="var(--text-faint)" />
        <input
          ref={inputRef}
          role="combobox"
          aria-label={searchLabel}
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          value={query}
          placeholder={placeholder}
          onChange={active ? (event) => onQueryChange(event.target.value) : undefined}
          onKeyDown={handleKeyDown}
        />
        <kbd className="lyra-kbd">esc</kbd>
      </div>
      <div ref={listRef} id={listboxId} className="lyra-cmdk__body" role="listbox">
        {flatItems.length === 0 ? (
          <p className="lyra-cmdk__empty">
            {emptyMessage} “{query}”.
          </p>
        ) : (
          visibleGroups.map((group) => {
            const groupLabelId = `${idBase}-group-${group.groupIndex}`;
            return (
              <div
                key={group.groupIndex}
                className="lyra-cmdk__group"
                role="group"
                aria-labelledby={group.label ? groupLabelId : undefined}
              >
                {group.label && (
                  <span id={groupLabelId} className="lyra-cmdk__group-label">
                    {group.label}
                  </span>
                )}
                {group.items.map(({ item, index }) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      id={`${idBase}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={cx('lyra-cmdk__item', isActive && 'lyra-cmdk__item--active')}
                      onMouseEnter={() => {
                        if (active && (!modal || isTopmost())) onActiveIndexChange(index);
                      }}
                      onClick={() => {
                        if (active && (!modal || isTopmost())) onPick(item);
                      }}
                    >
                      {item.icon && <span className="lyra-cmdk__item-icon">{item.icon}</span>}
                      <span className="lyra-cmdk__item-label">{item.label}</span>
                      {item.hint && <span className="lyra-cmdk__item-hint">{item.hint}</span>}
                      {item.shortcut && (
                        <span className="lyra-cmdk__shortcut">
                          {item.shortcut.split(' ').map((key, keyIndex) => (
                            <kbd key={`${key}-${keyIndex}`} className="lyra-kbd">
                              {key}
                            </kbd>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
      <div className="lyra-cmdk__footer">
        <span>
          <kbd className="lyra-kbd">↑</kbd>
          <kbd className="lyra-kbd">↓</kbd> {hints.navigate}
        </span>
        <span>
          <kbd className="lyra-kbd">↵</kbd> {hints.select}
        </span>
        <span>
          <kbd className="lyra-kbd">esc</kbd> {hints.close}
        </span>
      </div>
    </div>
  );
}

/**
 * A Command/Ctrl+K command palette with grouped filtering and APG `aria-activedescendant`
 * navigation. Overlay mode is portaled, scroll-locked, focus-trapped, kept mounted through its
 * exit motion, and restores focus to its opener; `inline` renders just the panel for
 * documentation and embedded demos.
 */
const CommandPaletteRoot = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandPaletteProps>(
  function CommandPalette(
    {
      open = false,
      onClose,
      onOpen,
      onSelect,
      groups = [],
      placeholder = 'Type a command or search…',
      emptyMessage = 'No results for',
      searchLabel = 'Search commands',
      hints,
      hotkey = 'k',
      inline = false,
      returnFocusTo,
      initialFocusTo,
      className,
      'aria-label': ariaLabel = 'Command palette',
    },
    forwardedRef: ForwardedRef<HTMLDivElement>,
  ) {
    const idBase = useId();
    const listboxId = `${idBase}-listbox`;
    const panelRef = useRef<HTMLDivElement | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const downOnOverlay = useRef(false);
    const upOnOverlay = useRef(false);
    const revokeGesture = useCallback(() => {
      downOnOverlay.current = false;
      upOnOverlay.current = false;
    }, []);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const { mounted, closing, onAnimationEnd } = usePresence(open);
    const layer = useModalLayer(!inline && open, panelRef);
    const { attachOverlay, overlay } = useModalActivity({
      open: !inline && layer.effectiveOpen,
      overlayRef,
      revokeGesture,
    });
    const { captureOpener } = useReturnFocus({
      open: inline ? false : open,
      active: layer.effectiveOpen,
      closeAuthorityRef: layer.closeAuthorityRef,
      fallbackFocusRef: layer.parentPanelRef,
      returnFocusTo: inline ? undefined : returnFocusTo,
      panelRef,
      overlayRef,
    });

    const flatItems: IndexedCommandItem[] = [];
    const normalizedQuery = query.toLocaleLowerCase();
    const visibleGroups: VisibleCommandGroup[] = [];

    groups.forEach((group, groupIndex) => {
      const matchedItems = group.items.filter(
        (item) =>
          !normalizedQuery ||
          item.label.toLocaleLowerCase().includes(normalizedQuery) ||
          item.hint?.toLocaleLowerCase().includes(normalizedQuery),
      );
      if (matchedItems.length === 0) return;
      const indexedItems = matchedItems.map((item) => {
        const indexedItem = { item, index: flatItems.length };
        flatItems.push(indexedItem);
        return indexedItem;
      });
      visibleGroups.push({ label: group.label, groupIndex, items: indexedItems });
    });

    const resetAndFocus = useCallback(() => {
      setQuery('');
      setActiveIndex(0);
    }, []);

    const handleQueryChange = useCallback((nextQuery: string) => {
      setQuery(nextQuery);
      setActiveIndex(0);
    }, []);

    const pick = useCallback(
      (item: CommandItem) => {
        item.onSelect?.();
        onSelect?.(item);
        onClose?.();
      },
      [onClose, onSelect],
    );

    useEffect(() => {
      if (!hotkey || !onOpen) return;
      const handleDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLocaleLowerCase() === hotkey.toLocaleLowerCase()
        ) {
          if (open && !inline && !isModalLayerTopmost(overlay, layer.token)) return;
          event.preventDefault();
          if (open) onClose?.();
          else onOpen();
        }
      };
      document.addEventListener('keydown', handleDocumentKeyDown);
      return () => document.removeEventListener('keydown', handleDocumentKeyDown);
    }, [hotkey, inline, layer.token, onClose, onOpen, open, overlay]);

    const attachPanel = useCallback(
      (node: HTMLDivElement | null) => {
        panelRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    const panel = (
      <CommandPalettePanel
        panelRef={panelRef}
        overlay={overlay}
        attachPanel={attachPanel}
        inputRef={inputRef}
        listRef={listRef}
        listboxId={listboxId}
        idBase={idBase}
        visibleGroups={visibleGroups}
        flatItems={flatItems}
        activeIndex={activeIndex}
        query={query}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        searchLabel={searchLabel}
        dialogLabel={ariaLabel}
        hints={{ ...DEFAULT_HINTS, ...hints }}
        className={className}
        modal={!inline}
        open={inline || layer.effectiveOpen}
        closing={!inline && closing}
        onQueryChange={handleQueryChange}
        onActiveIndexChange={setActiveIndex}
        onPick={pick}
        onClose={onClose}
        onAnimationEnd={onAnimationEnd}
        onReady={resetAndFocus}
        captureOpener={inline ? undefined : captureOpener}
        initialFocusTo={inline ? undefined : initialFocusTo}
        layer={layer}
        revokeGesture={revokeGesture}
      />
    );

    if (inline) return panel;
    if (!mounted) return null;

    return (
      <ModalLayerProvider layer={layer}>
        <Portal>
          {/* Backdrop click is pointer-only convenience; Escape on the combobox is the keyboard path. */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            ref={attachOverlay}
            className={cx('lyra-cmdk-overlay', closing && 'lyra-cmdk-overlay--closing')}
            onMouseDown={(event) => {
              downOnOverlay.current = open && event.target === event.currentTarget;
            }}
            onMouseUp={(event) => {
              upOnOverlay.current = open && event.target === event.currentTarget;
            }}
            onClick={(event) => {
              const isBackdropGesture =
                open &&
                downOnOverlay.current &&
                upOnOverlay.current &&
                event.target === event.currentTarget;
              downOnOverlay.current = false;
              upOnOverlay.current = false;
              if (isBackdropGesture && isModalLayerTopmost(overlay, layer.token)) onClose?.();
            }}
          >
            {panel}
          </div>
        </Portal>
      </ModalLayerProvider>
    );
  },
);

/** A Command/Ctrl+K command palette with an optional search-shaped trigger. */
export const CommandPalette = Object.assign(CommandPaletteRoot, { Trigger: CommandPaletteTrigger });
