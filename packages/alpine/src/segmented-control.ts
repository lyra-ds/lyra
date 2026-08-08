/** Initial configuration accepted by `x-data="lyraSegmentedControl(...)"`. */
export interface LyraSegmentedControlOptions {
  /** Initially selected option value. Defaults to an unselected group. */
  value?: string;
}

type Binding = Record<string, unknown>;

interface LyraSegmentedControlData {
  value: string;
  root: HTMLElement | null;
  init(): void;
  optionElements(): HTMLButtonElement[];
  selectedIndex(): number;
  firstEnabledIndex(): number;
  focusableIndex(): number;
  isSelected(option: HTMLButtonElement): boolean;
  selectOption(option: HTMLButtonElement): void;
  nextEnabledIndex(start: number, direction: 1 | -1): number | undefined;
  handleOptionKeyDown(event: KeyboardEvent): void;
  option: Binding;
}

interface LyraSegmentedControlMagics {
  $el: HTMLElement;
  $dispatch(name: string, detail?: unknown): void;
}

type LyraSegmentedControlState = LyraSegmentedControlData & LyraSegmentedControlMagics;

/**
 * A controllable, selection-follows-focus radiogroup over consumer-rendered markup.
 *
 * Consumers must serve the root's `role="radiogroup"` and accessible `aria-label`, then
 * serve each option as a `[role="radio"].lyra-segmented__option` button with `data-value`
 * and `x-bind="option"`. Disabled options use the native `disabled` attribute.
 */
export function lyraSegmentedControl({
  value = '',
}: LyraSegmentedControlOptions = {}): LyraSegmentedControlData {
  const state: LyraSegmentedControlData & ThisType<LyraSegmentedControlState> = {
    value,
    root: null,

    init() {
      // In x-bind object handlers Alpine's $el is the bound option, not this root.
      // Capture it once so every DOM-derived state calculation stays within this group.
      this.root = this.$el;
    },

    optionElements() {
      return Array.from(
        this.root?.querySelectorAll<HTMLButtonElement>(
          '[role="radio"].lyra-segmented__option[data-value]',
        ) ?? [],
      );
    },

    selectedIndex() {
      return this.optionElements().findIndex((option) => option.dataset.value === this.value);
    },

    firstEnabledIndex() {
      return this.optionElements().findIndex((option) => !option.disabled);
    },

    focusableIndex() {
      const options = this.optionElements();
      const selectedIndex = options.findIndex((option) => option.dataset.value === this.value);
      const firstEnabledIndex = options.findIndex((option) => !option.disabled);
      return selectedIndex >= 0 && !options[selectedIndex].disabled
        ? selectedIndex
        : firstEnabledIndex;
    },

    isSelected(option) {
      return option.dataset.value === this.value;
    },

    selectOption(option) {
      if (option.disabled) return;
      option.focus();
      this.value = option.dataset.value ?? '';
      this.$dispatch('lyra:change', { value: this.value });
    },

    nextEnabledIndex(start, direction) {
      const options = this.optionElements();
      for (let offset = 1; offset <= options.length; offset += 1) {
        const index = (start + direction * offset + options.length) % options.length;
        if (!options[index].disabled) return index;
      }
      return undefined;
    },

    handleOptionKeyDown(event) {
      if (event.defaultPrevented) return;
      const options = this.optionElements();
      const currentIndex = options.indexOf(event.currentTarget as HTMLButtonElement);
      if (currentIndex < 0 || options.length === 0) return;

      let nextIndex: number | undefined;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
        nextIndex = this.nextEnabledIndex(currentIndex, -1);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
        nextIndex = this.nextEnabledIndex(currentIndex, 1);
      if (event.key === 'Home') {
        const firstEnabledIndex = this.firstEnabledIndex();
        nextIndex = firstEnabledIndex >= 0 ? firstEnabledIndex : undefined;
      }
      if (event.key === 'End') {
        nextIndex = [...options]
          .map((option, optionIndex) => ({ option, optionIndex }))
          .reverse()
          .find(({ option }) => !option.disabled)?.optionIndex;
      }
      if (nextIndex === undefined) return;

      event.preventDefault();
      this.selectOption(options[nextIndex]);
    },

    option: {
      type: 'button',
      [':aria-checked']() {
        return String(this.isSelected(this.$el as HTMLButtonElement));
      },
      [':tabindex']() {
        return this.optionElements().indexOf(this.$el as HTMLButtonElement) ===
          this.focusableIndex()
          ? 0
          : -1;
      },
      [':class']() {
        // Object syntax lets Alpine remove a modifier rendered by the server.
        return {
          'lyra-segmented__option--active': this.isSelected(this.$el as HTMLButtonElement),
        };
      },
      ['@click']() {
        this.selectOption(this.$el as HTMLButtonElement);
      },
      ['@keydown'](event: KeyboardEvent) {
        this.handleOptionKeyDown(event);
      },
    },
  };

  return state;
}
