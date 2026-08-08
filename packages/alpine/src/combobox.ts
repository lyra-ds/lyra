import { moveActiveIndex, scrollActiveIntoView } from './internal/active-descendant';
import { observeFlipPlacement } from './internal/flip-placement';
import type { FlipPlacement } from './internal/flip-placement';
import { whenVisible } from './internal/when-visible';

/** A data option rendered by {@link lyraCombobox}. */
export interface LyraComboboxOption {
  /** Value emitted when this option is selected. */
  value: string;
  /** Visible option text and primary search term. */
  label: string;
  /** Optional secondary text rendered by the consumer's option template. */
  hint?: string;
  /** Optional presentational heading for this contiguous option group. */
  group?: string;
  /** Optional search terms that are matched but not rendered. */
  keywords?: string;
}

/** Initial configuration accepted by `x-data="lyraCombobox(...)"`. */
export interface LyraComboboxOptions {
  /** Available data options. Default: `[]`. */
  options?: LyraComboboxOption[];
  /** Initially selected option value; also the modelable selected value. */
  value?: string;
  /** Whether the popup initially starts open; also modelable. Default: `false`. */
  open?: boolean;
  /** Trigger text with no selected option. Default: `"Select…"`. */
  placeholder?: string;
  /** Search input placeholder. Default: `"Search…"`. */
  searchPlaceholder?: string;
  /** Text shown when filtering finds no options. Default: `"No results."`. */
  emptyMessage?: string;
  /** Disables the trigger. Default: `false`. */
  disabled?: boolean;
  /** Stable id base; one is generated from the root when omitted. */
  id?: string;
  /** Applies the React field error modifier to the trigger. Default: `false`. */
  error?: boolean;
  /** Consumer-owned field-message id used for `aria-describedby`. */
  describedBy?: string;
}

interface IndexedOption {
  option: LyraComboboxOption;
  index: number;
}

type Binding = Record<string, unknown>;

interface LyraComboboxData {
  value: string | undefined;
  open: boolean;
  query: string;
  activeIndex: number;
  emptyMessage: string;
  root: HTMLElement | null;
  baseId: string;
  placement: FlipPlacement;
  stopMeasuring: (() => void) | null;
  removeDocumentMouseDown: (() => void) | null;
  init(): void;
  destroy(): void;
  filtered(): IndexedOption[];
  selected(): LyraComboboxOption | undefined;
  activeOptionId(): string | undefined;
  optionId(index: number): string;
  optionClass(filteredIndex: number): Record<string, boolean>;
  optionSelected(option: LyraComboboxOption): 'true' | 'false';
  showGroup(filteredIndex: number): boolean;
  pick(option: LyraComboboxOption): void;
  setActive(filteredIndex: number): void;
  triggerElement(): HTMLElement | null;
  popElement(): HTMLElement | null;
  searchElement(): HTMLInputElement | null;
  listElement(): HTMLElement | null;
  startPlacement(): void;
  stopPlacement(): void;
  startOutsideClick(): void;
  stopOutsideClick(): void;
  openPopover(): void;
  closePopover(restoreFocus?: boolean): void;
  scheduleActiveScroll(): void;
  onSearchInput(value: string): void;
  onSearchKeydown(event: KeyboardEvent): void;
  trigger: Binding;
  triggerValue: Binding;
  pop: Binding;
  search: Binding;
  list: Binding;
  empty: Binding;
}

interface LyraComboboxMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: () => void): void;
}

type LyraComboboxState = LyraComboboxData & LyraComboboxMagics;

let nextComboboxId = 0;

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

/**
 * A searchable single-select APG combobox over consumer-rendered data markup.
 *
 * The component owns state and behavior only. Keep icons and trailing content in consumer
 * template slots; unlike React nodes, those fragments remain ordinary server-rendered markup.
 * Field wrappers are likewise consumer markup: give the label a `for` matching the optional
 * `id`, render a hint/error element with its own id, and pass that id as `describedBy`.
 *
 * ```html
 * <div class="lyra-field">
 *   <label class="lyra-label" for="country">Country</label>
 *   <div class="lyra-combobox"
 *     x-data="lyraCombobox({ id: 'country', options, value: selected, describedBy: 'country-help' })"
 *     x-modelable="value" x-model="selected">
 *     <button class="lyra-input lyra-combobox__trigger" x-bind="trigger">
 *       <span x-bind="triggerValue"></span>
 *     </button>
 *     <div class="lyra-combobox__pop" x-bind="pop">
 *       <div class="lyra-combobox__search"><input x-bind="search" aria-label="Search countries"></div>
 *       <div class="lyra-combobox__list" x-bind="list">
 *         <span class="lyra-combobox__empty" x-bind="empty" x-text="emptyMessage"></span>
 *         <template x-for="({ option, index }, filteredIndex) in filtered()" :key="option.value">
 *           <div>
 *             <template x-if="showGroup(filteredIndex)">
 *               <span class="lyra-combobox__group" role="presentation" x-text="option.group"></span>
 *             </template>
 *             <button class="lyra-combobox__option" type="button" tabindex="-1" role="option"
 *               :id="optionId(index)" :class="optionClass(filteredIndex)"
 *               :aria-selected="optionSelected(option)" @mouseenter="setActive(filteredIndex)"
 *               @click="pick(option)">
 *               <!-- consumer icon slot -->
 *               <span class="lyra-combobox__option-label"><span x-text="option.label"></span>
 *                 <span class="lyra-combobox__option-hint" x-show="option.hint" x-text="option.hint"></span>
 *               </span>
 *               <span class="lyra-combobox__trailing"><!-- consumer trailing slot --></span>
 *             </button>
 *           </div>
 *         </template>
 *       </div>
 *     </div>
 *   </div>
 *   <span id="country-help" class="lyra-hint">Choose one country.</span>
 * </div>
 * ```
 */
export function lyraCombobox({
  options = [],
  value,
  open = false,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results.',
  disabled = false,
  id,
  error = false,
  describedBy,
}: LyraComboboxOptions = {}): LyraComboboxData {
  const state: LyraComboboxData & ThisType<LyraComboboxState> = {
    value,
    open,
    query: '',
    activeIndex: 0,
    emptyMessage,
    root: null,
    baseId: id ?? '',
    placement: { side: 'down', align: 'start' },
    stopMeasuring: null,
    removeDocumentMouseDown: null,

    init() {
      this.root = this.$el;
      if (!this.baseId) this.baseId = `lyra-combobox-${++nextComboboxId}`;
      this.$watch('open', () => {
        if (this.open) this.openPopover();
        else {
          this.stopPlacement();
          this.stopOutsideClick();
        }
      });
      this.$watch('activeIndex', () => this.scheduleActiveScroll());
      this.$watch('query', () => this.scheduleActiveScroll());
      if (this.open) this.openPopover();
    },

    destroy() {
      this.stopPlacement();
      this.stopOutsideClick();
      this.root = null;
    },

    filtered() {
      const normalizedQuery = normalizeSearchText(this.query);
      return options
        .map((option, index) => ({ option, index }))
        .filter(
          ({ option }) =>
            !normalizedQuery ||
            normalizeSearchText(option.label).includes(normalizedQuery) ||
            normalizeSearchText(option.keywords ?? '').includes(normalizedQuery),
        );
    },

    selected() {
      return options.find((option) => option.value === this.value);
    },

    activeOptionId() {
      const active = this.filtered()[this.activeIndex];
      return active ? this.optionId(active.index) : undefined;
    },

    optionId(index) {
      return `${this.baseId}-option-${index}`;
    },

    optionClass(filteredIndex) {
      return { 'lyra-combobox__option--active': filteredIndex === this.activeIndex };
    },

    optionSelected(option) {
      return option.value === this.value ? 'true' : 'false';
    },

    showGroup(filteredIndex) {
      const current = this.filtered()[filteredIndex];
      if (!current?.option.group) return false;
      return this.filtered()[filteredIndex - 1]?.option.group !== current.option.group;
    },

    pick(option) {
      this.value = option.value;
      this.$dispatch('lyra:change', { value: option.value, option });
      this.closePopover(true);
    },

    setActive(filteredIndex) {
      this.activeIndex = filteredIndex;
    },

    triggerElement() {
      return this.root?.querySelector<HTMLElement>('.lyra-combobox__trigger') ?? null;
    },

    popElement() {
      return this.root?.querySelector<HTMLElement>('.lyra-combobox__pop') ?? null;
    },

    searchElement() {
      return this.root?.querySelector<HTMLInputElement>('[role="combobox"]') ?? null;
    },

    listElement() {
      return this.root?.querySelector<HTMLElement>('[role="listbox"]') ?? null;
    },

    startPlacement() {
      this.stopPlacement();
      const trigger = this.triggerElement();
      const pop = this.popElement();
      if (!trigger || !pop) return;
      this.stopMeasuring = observeFlipPlacement(trigger, pop, (placement) => {
        this.placement = placement;
      });
    },

    stopPlacement() {
      this.stopMeasuring?.();
      this.stopMeasuring = null;
      this.placement = { side: 'down', align: 'start' };
    },

    startOutsideClick() {
      this.stopOutsideClick();
      const onDocumentMouseDown = (event: MouseEvent): void => {
        if (!this.root?.contains(event.target as Node)) this.closePopover();
      };
      document.addEventListener('mousedown', onDocumentMouseDown);
      this.removeDocumentMouseDown = () =>
        document.removeEventListener('mousedown', onDocumentMouseDown);
    },

    stopOutsideClick() {
      this.removeDocumentMouseDown?.();
      this.removeDocumentMouseDown = null;
    },

    openPopover() {
      this.query = '';
      this.activeIndex = 0;
      this.startOutsideClick();
      this.$nextTick(() => {
        const pop = this.popElement();
        if (!pop) return;
        whenVisible(
          pop,
          () => !this.open,
          () => {
            this.startPlacement();
            this.searchElement()?.focus({ preventScroll: true });
            this.scheduleActiveScroll();
          },
        );
      });
    },

    closePopover(restoreFocus = false) {
      this.open = false;
      if (restoreFocus) this.triggerElement()?.focus();
    },

    scheduleActiveScroll() {
      this.$nextTick(() => {
        const list = this.listElement();
        if (!list) return;
        const activeId = this.activeOptionId();
        scrollActiveIntoView(list, activeId ? document.getElementById(activeId) : null);
      });
    },

    onSearchInput(nextQuery) {
      this.query = nextQuery;
      this.activeIndex = 0;
    },

    onSearchKeydown(event) {
      const next = moveActiveIndex(event.key, this.activeIndex, this.filtered().length);
      if (next !== null) {
        event.preventDefault();
        this.activeIndex = next;
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const active = this.filtered()[this.activeIndex];
        if (active) this.pick(active.option);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closePopover(true);
      }
    },

    trigger: {
      type: 'button',
      [':id']() {
        return this.baseId;
      },
      [':aria-haspopup']() {
        return 'listbox';
      },
      [':aria-expanded']() {
        return String(this.open);
      },
      [':aria-controls']() {
        return `${this.baseId}-listbox`;
      },
      [':aria-describedby']() {
        return describedBy;
      },
      [':disabled']() {
        return disabled;
      },
      [':class']() {
        return { 'lyra-input--error': error };
      },
      ['@click']() {
        this.open = !this.open;
      },
    },

    triggerValue: {
      [':class']() {
        return {
          'lyra-combobox__value': Boolean(this.selected()),
          'lyra-combobox__placeholder': !this.selected(),
        };
      },
      ['x-text']() {
        return this.selected()?.label ?? placeholder;
      },
    },

    pop: {
      ['x-show']() {
        return this.open;
      },
      [':class']() {
        return { 'lyra-combobox__pop--up': this.placement.side === 'up' };
      },
    },

    search: {
      role: 'combobox',
      [':aria-expanded']() {
        return String(this.open);
      },
      [':aria-controls']() {
        return `${this.baseId}-listbox`;
      },
      'aria-autocomplete': 'list',
      [':aria-activedescendant']() {
        return this.activeOptionId();
      },
      [':value']() {
        return this.query;
      },
      [':placeholder']() {
        return searchPlaceholder;
      },
      ['@input'](event: InputEvent) {
        this.onSearchInput((event.currentTarget as HTMLInputElement).value);
      },
      ['@keydown'](event: KeyboardEvent) {
        this.onSearchKeydown(event);
      },
    },

    list: {
      [':id']() {
        return `${this.baseId}-listbox`;
      },
      role: 'listbox',
    },

    empty: {
      ['x-show']() {
        return this.filtered().length === 0;
      },
    },
  };

  return state;
}
