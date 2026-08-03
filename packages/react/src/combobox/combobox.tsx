import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Icon } from '../icon';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';
import { useFlipPlacement } from '../internal/use-flip-placement';

/** An option shown by {@link Combobox}. */
export interface ComboboxOption {
  /** Value reported when this option is selected. */
  value: string;
  /** Primary option text. */
  label: string;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
  /** Optional secondary text rendered after the label. */
  hint?: string;
}

/** Props for {@link Combobox}. */
export interface ComboboxProps {
  /** Label rendered above the control. */
  label?: string;
  /** Helper text rendered below the control. */
  hint?: string;
  /** Error message that replaces `hint` and enables error styling. */
  error?: string;
  /** Available options. */
  options?: ComboboxOption[];
  /** Selected value in controlled mode. */
  value?: string;
  /** Initial selected value in uncontrolled mode. */
  defaultValue?: string;
  /** Called with the selected value and option. */
  onChange?: (value: string, option: ComboboxOption) => void;
  /** Trigger text when no option is selected. Default: `"Select…"`. */
  placeholder?: string;
  /** Search input placeholder. Default: `"Search…"`. */
  searchPlaceholder?: string;
  /** Text shown when filtering finds no options. Default: `"No results."`. */
  emptyMessage?: string;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Whether the popup starts open. Useful for demos. */
  defaultOpen?: boolean;
  /** Id for the trigger. A stable id is generated when omitted. */
  id?: string;
  /** Additional class name appended to `.lyra-combobox`. */
  className?: string;
}

interface IndexedOption {
  option: ComboboxOption;
  index: number;
}

/**
 * Searchable single-select combobox with APG `aria-activedescendant` navigation.
 *
 * DOM focus remains on the search input while the active option changes. This is deliberately
 * different from Dropdown's real-menuitem-focus model and lets assistive technology read the
 * active option through a stable option id.
 */
export const Combobox = /*#__PURE__*/ forwardRef<HTMLButtonElement, ComboboxProps>(
  function Combobox(
    {
      label,
      hint,
      error,
      options = [],
      value,
      defaultValue,
      onChange,
      placeholder = 'Select…',
      searchPlaceholder = 'Search…',
      emptyMessage = 'No results.',
      disabled = false,
      defaultOpen = false,
      id,
      className,
    },
    ref,
  ) {
    const generatedId = useId();
    const triggerId = id ?? generatedId;
    const labelId = `${triggerId}-label`;
    const messageId = useId();
    const listboxId = `${triggerId}-listbox`;
    const searchId = `${triggerId}-search`;
    const [current, setCurrent] = useControllableState<string | undefined>({ value, defaultValue });
    const [open, setOpen] = useState(defaultOpen);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLSpanElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const placement = useFlipPlacement(open, triggerRef, popRef);

    const filtered: IndexedOption[] = options
      .map((option, index) => ({ option, index }))
      .filter(
        ({ option }) =>
          !query || option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      );
    const selected = options.find((option) => option.value === current);
    const active = filtered[activeIndex];
    const activeOptionId = active ? `${triggerId}-option-${active.index}` : undefined;
    const hasMessage = Boolean(error) || Boolean(hint);

    useEffect(() => {
      if (!open) return;
      const onDocumentMouseDown = (event: MouseEvent): void => {
        if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', onDocumentMouseDown);
      return () => document.removeEventListener('mousedown', onDocumentMouseDown);
    }, [open]);

    useEffect(() => {
      if (!open) return;
      setQuery('');
      setActiveIndex(0);
      // preventScroll: the popup is already positioned to fit, so letting the browser scroll to the
      // freshly focused input would move the page out from under the trigger.
      searchRef.current?.focus({ preventScroll: true });
    }, [open]);

    // Filtering changes the rendered option collection, so always reset the active descendant to
    // its first result. This prevents aria-activedescendant from retaining a stale option id.
    const handleSearchChange = (nextQuery: string): void => {
      setQuery(nextQuery);
      setActiveIndex(0);
    };

    useEffect(() => {
      if (!activeOptionId || !listRef.current) return;
      const option = document.getElementById(activeOptionId);
      const list = listRef.current;
      if (!option || !list.contains(option)) return;
      if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
      else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    }, [activeOptionId]);

    const closeAndRestoreTrigger = (): void => {
      setOpen(false);
      triggerRef.current?.focus();
    };

    const pick = (option: ComboboxOption): void => {
      setCurrent(option.value);
      onChange?.(option.value, option);
      closeAndRestoreTrigger();
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (filtered.length > 0)
          setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (filtered.length > 0) setActiveIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (active) pick(active.option);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeAndRestoreTrigger();
      }
    };

    const attachTrigger = (node: HTMLButtonElement | null): void => {
      triggerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const control = (
      <span ref={rootRef} className={cx('lyra-combobox', className)}>
        <button
          ref={attachTrigger}
          type="button"
          id={triggerId}
          className={cx('lyra-input', 'lyra-combobox__trigger', error && 'lyra-input--error')}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-describedby={hasMessage ? messageId : undefined}
          disabled={disabled}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          <span className={selected ? 'lyra-combobox__value' : 'lyra-combobox__placeholder'}>
            {selected ? (
              <>
                {selected.icon}
                {selected.label}
              </>
            ) : (
              placeholder
            )}
          </span>
          <Icon name="chevrons-up-down" size={15} color="var(--text-faint)" />
        </button>
        {open && (
          <div
            ref={popRef}
            className={cx(
              'lyra-combobox__pop',
              placement.side === 'up' && 'lyra-combobox__pop--up',
            )}
          >
            <div className="lyra-combobox__search">
              <Icon name="search" size={15} color="var(--text-faint)" />
              <input
                ref={searchRef}
                id={searchId}
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeOptionId}
                aria-labelledby={label ? labelId : undefined}
                aria-label={label ? undefined : searchPlaceholder}
                aria-describedby={hasMessage ? messageId : undefined}
                value={query}
                placeholder={searchPlaceholder}
                onChange={(event) => handleSearchChange(event.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <div ref={listRef} id={listboxId} className="lyra-combobox__list" role="listbox">
              {filtered.length === 0 && (
                <span className="lyra-combobox__empty">{emptyMessage}</span>
              )}
              {filtered.map(({ option, index }, filteredIndex) => (
                <button
                  key={option.value}
                  id={`${triggerId}-option-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.value === current}
                  className={cx(
                    'lyra-combobox__option',
                    filteredIndex === activeIndex && 'lyra-combobox__option--active',
                  )}
                  onMouseEnter={() => setActiveIndex(filteredIndex)}
                  onClick={() => pick(option)}
                >
                  {option.icon}
                  <span className="lyra-combobox__option-label">
                    {option.label}
                    {option.hint && (
                      <span className="lyra-combobox__option-hint">{option.hint}</span>
                    )}
                  </span>
                  {option.value === current && (
                    <Icon name="check" size={15} color="var(--accent)" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </span>
    );

    if (!label && !hint && !error) return control;
    return (
      <div className="lyra-field">
        {label && (
          <label id={labelId} className="lyra-label" htmlFor={triggerId}>
            {label}
          </label>
        )}
        {control}
        {error ? (
          <span id={messageId} className="lyra-hint lyra-hint--error">
            {error}
          </span>
        ) : hint ? (
          <span id={messageId} className="lyra-hint">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
