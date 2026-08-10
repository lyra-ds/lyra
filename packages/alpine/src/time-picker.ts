import { whenVisible } from './internal/when-visible';

/** Translatable labels for {@link lyraTimePicker}, merged over the English defaults. */
export interface LyraTimePickerLabels {
  /** Accessible name for the listbox. Default: `"Time options"`. */
  timeOptions?: string;
}

/** English defaults for {@link lyraTimePicker} labels. */
const DEFAULT_LABELS: Required<LyraTimePickerLabels> = {
  timeOptions: 'Time options',
};

/** Initial configuration accepted by `x-data="lyraTimePicker(...)"`. */
export interface LyraTimePickerOptions {
  /** Initial 24-hour `HH:mm` value. */
  defaultValue?: string;
  /** Minutes between generated options. Default: `30`. */
  step?: number;
  /** Inclusive 24-hour `HH:mm` lower limit. Default: `"00:00"`. */
  min?: string;
  /** Inclusive 24-hour `HH:mm` upper limit. Default: `"23:59"`. */
  max?: string;
  /** BCP 47 locale used to display selected and option times. Default: `"en-US"`. */
  locale?: string;
  /** Labels merged over the English defaults. */
  labels?: LyraTimePickerLabels;
  /** Trigger text with no selected time. Default: `"Select time"`. */
  placeholder?: string;
}

type Binding = Record<string, unknown>;

interface LyraTimePickerData {
  selected: string | null;
  open: boolean;
  mobile: boolean;
  locale: string;
  placeholder: string;
  root: HTMLElement | null;
  media: MediaQueryList | null;
  onMediaChange: ((event: MediaQueryListEvent) => void) | null;
  init(): void;
  destroy(): void;
  options(): string[];
  formatTime(time: string): string;
  triggerText(): string;
  hasSelection(): boolean;
  pick(time: string): void;
  listElement(): HTMLElement | null;
  list: Binding;
}

interface LyraTimePickerMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraTimePickerState = LyraTimePickerData & LyraTimePickerMagics;

function minutesFromTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

function timeFromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * A thin time-picker coordinator. It owns `selected`, `open`, responsive branch selection,
 * generated options, and list interactions; Popover and BottomSheet retain their own bindings.
 * Consumers render the option list from `options()` rather than nesting another component.
 *
 * ```html
 * <div x-data="lyraTimePicker({ defaultValue: '09:00', min: '09:00', max: '17:00' })">
 *   <template x-if="!mobile">
 *     <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
 *       <!-- Alias scope: x-model resolves in the nested component's own scope first, so a
 *            same-name chain (open ↔ open) would entangle the component with itself. The alias
 *            getter/setter proxies the picker's property under a non-colliding name. -->
 *       <div class="lyra-popover-anchor lyra-datepicker" x-data="lyraPopover({ ariaLabel: 'Time picker' })"
 *         x-modelable="open" x-model="pickerOpen">
 *         <button class="lyra-input lyra-datepicker__btn" x-bind="trigger">
 *           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
 *             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
 *             <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
 *           </svg>
 *           <span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span>
 *         </button>
 *         <div class="lyra-popover" x-bind="panel">
 *           <div class="lyra-timelist" x-bind="list">
 *             <template x-for="time in options()" :key="time">
 *               <button class="lyra-timelist__item" type="button" role="option"
 *                 :class="{ 'lyra-timelist__item--selected': time === selected }"
 *                 :aria-selected="time === selected ? 'true' : false"
 *                 @click="pick(time)" x-text="formatTime(time)"></button>
 *             </template>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *   </template>
 *   <template x-if="mobile">
 *     <div>
 *       <div class="lyra-datepicker">
 *         <button class="lyra-input lyra-datepicker__btn" type="button" @click="open = true">
 *           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
 *             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
 *             <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
 *           </svg>
 *           <span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span>
 *         </button>
 *       </div>
 *       <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
 *         <div x-data="lyraBottomSheet()" x-modelable="open" x-model="pickerOpen">
 *           <div class="lyra-bottomsheet-overlay" x-bind="overlay">
 *             <div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1"
 *               aria-labelledby="time-picker-sheet-title" x-bind="panel">
 *               <div class="lyra-bottomsheet__header">
 *                 <h2 id="time-picker-sheet-title" class="lyra-bottomsheet__title">Select time</h2>
 *                 <button class="lyra-bottomsheet__close" x-bind="close">Close</button>
 *               </div>
 *               <div class="lyra-bottomsheet__body">
 *                 <div class="lyra-timelist" x-bind="list">
 *                   <template x-for="time in options()" :key="time">
 *                     <button class="lyra-timelist__item" type="button" role="option"
 *                       :class="{ 'lyra-timelist__item--selected': time === selected }"
 *                       :aria-selected="time === selected ? 'true' : false"
 *                       @click="pick(time)" x-text="formatTime(time)"></button>
 *                   </template>
 *                 </div>
 *               </div>
 *             </div>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *   </template>
 * </div>
 * ```
 */
export function lyraTimePicker({
  defaultValue,
  step = 30,
  min = '00:00',
  max = '23:59',
  locale = 'en-US',
  labels: labelsProp,
  placeholder = 'Select time',
}: LyraTimePickerOptions = {}): LyraTimePickerData {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const state: LyraTimePickerData & ThisType<LyraTimePickerState> = {
    selected: defaultValue ?? null,
    open: false,
    mobile: false,
    locale,
    placeholder,
    root: null,
    media: null,
    onMediaChange: null,

    init() {
      this.root = this.$el;
      this.$watch('open', (open) => {
        if (!open) return;
        this.$nextTick(() => {
          const list = this.listElement();
          if (!list) return;
          whenVisible(
            list,
            () => !this.open,
            () => {
              const selectedOption = list.querySelector<HTMLElement>('[aria-selected="true"]');
              if (selectedOption) list.scrollTop = Math.max(0, selectedOption.offsetTop - 84);
            },
          );
        });
      });

      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      this.media = window.matchMedia('(max-width: 640px)');
      this.mobile = this.media.matches;
      this.onMediaChange = (event) => {
        this.mobile = event.matches;
      };
      this.media.addEventListener('change', this.onMediaChange);
    },

    destroy() {
      if (this.media && this.onMediaChange)
        this.media.removeEventListener('change', this.onMediaChange);
      this.root = null;
      this.media = null;
      this.onMediaChange = null;
    },

    options() {
      const lower = minutesFromTime(min) ?? 0;
      const upper = minutesFromTime(max) ?? 23 * 60 + 59;
      const interval = Number.isFinite(step) && step > 0 ? Math.floor(step) : 30;
      if (lower > upper) return [];
      const values: string[] = [];
      for (let current = lower; current <= upper; current += interval) {
        values.push(timeFromMinutes(current));
      }
      return values;
    },

    formatTime(time) {
      const minutes = minutesFromTime(time);
      if (minutes === null) return time;
      return new Intl.DateTimeFormat(this.locale, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60));
    },

    triggerText() {
      return this.selected ? this.formatTime(this.selected) : this.placeholder;
    },

    hasSelection() {
      return Boolean(this.selected);
    },

    pick(time) {
      this.selected = time;
      this.open = false;
      this.$dispatch('lyra:change', { value: time });
    },

    listElement() {
      return this.root?.querySelector<HTMLElement>('.lyra-timelist') ?? null;
    },

    list: {
      role: 'listbox',
      tabindex: '-1',
      [':aria-label']() {
        return labels.timeOptions;
      },
      ['@keydown'](event: KeyboardEvent) {
        const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        const items = Array.from(
          (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
            '[role="option"]',
          ),
        );
        if (items.length === 0) return;
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : event.key === 'ArrowDown'
                ? Math.min(current + 1, items.length - 1)
                : Math.max(current - 1, 0);
        event.preventDefault();
        items[next]?.focus();
      },
    },
  };

  return state;
}
