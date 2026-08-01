import { forwardRef, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** A selectable option in {@link SegmentedControl}. */
export interface SegmentedControlOption {
  /** Stable value reported by `onChange` when this option is selected. */
  value: string;
  /** Visible option content. */
  label: ReactNode;
  /** Prevent selection and keyboard focus for this option. */
  disabled?: boolean;
}

/** Props for {@link SegmentedControl}. */
export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Options rendered in keyboard-navigation order. Provide at least two options. */
  options: SegmentedControlOption[];
  /** Currently selected option value. */
  value: string;
  /** Called with the next value after pointer or keyboard selection. */
  onChange: (value: string) => void;
  /** Translated accessible name for the radiogroup. */
  label: string;
}

/** A controlled, single-choice radiogroup with roving tabindex and automatic selection. */
export const SegmentedControl = /*#__PURE__*/ forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl({ options, value, onChange, label, className, ...rest }, ref) {
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const selectedIndex = options.findIndex((option) => option.value === value);
    const firstEnabledIndex = options.findIndex((option) => !option.disabled);
    const focusableIndex =
      selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : firstEnabledIndex;

    const select = (index: number): void => {
      const option = options[index];
      if (!option || option.disabled) return;
      optionRefs.current[index]?.focus();
      onChange(option.value);
    };

    const nextEnabledIndex = (start: number, direction: 1 | -1): number | undefined => {
      for (let offset = 1; offset <= options.length; offset += 1) {
        const index = (start + direction * offset + options.length) % options.length;
        if (!options[index].disabled) return index;
      }
      return undefined;
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
      if (event.defaultPrevented) return;

      let nextIndex: number | undefined;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
        nextIndex = nextEnabledIndex(index, -1);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
        nextIndex = nextEnabledIndex(index, 1);
      if (event.key === 'Home') nextIndex = firstEnabledIndex >= 0 ? firstEnabledIndex : undefined;
      if (event.key === 'End') {
        nextIndex = [...options]
          .map((option, optionIndex) => ({ option, optionIndex }))
          .reverse()
          .find(({ option }) => !option.disabled)?.optionIndex;
      }
      if (nextIndex === undefined) return;

      event.preventDefault();
      select(nextIndex);
    };

    return (
      <div
        {...rest}
        ref={ref}
        className={cx('lyra-segmented', className)}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              tabIndex={index === focusableIndex ? 0 : -1}
              className={cx('lyra-segmented__option', selected && 'lyra-segmented__option--active')}
              onClick={() => select(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  },
);
