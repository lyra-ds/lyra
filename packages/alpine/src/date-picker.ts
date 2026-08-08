import { normalizeDay } from './internal/date-utils';

/** Initial configuration accepted by `x-data="lyraDatePicker(...)"`. */
export interface LyraDatePickerOptions {
  /** Initial ISO `YYYY-MM-DD` date. */
  defaultValue?: string;
  /** BCP 47 locale used for the trigger's selected-date text. Default: `"en-US"`. */
  locale?: string;
  /** Trigger text when no date is selected. Default: `"Select date"`. */
  placeholder?: string;
}

interface LyraDatePickerData {
  selected: unknown;
  open: boolean;
  mobile: boolean;
  locale: string;
  placeholder: string;
  root: HTMLElement | null;
  media: MediaQueryList | null;
  onMediaChange: ((event: MediaQueryListEvent) => void) | null;
  onCalendarChange: ((event: Event) => void) | null;
  init(): void;
  destroy(): void;
  triggerText(): string;
  hasSelection(): boolean;
}

interface LyraDatePickerMagics {
  $el: HTMLElement;
}

type LyraDatePickerState = LyraDatePickerData & LyraDatePickerMagics;

/**
 * A thin date-picker coordinator. It owns only `selected`, `open`, responsive branch selection,
 * and the single-date close rule; Popover, BottomSheet, and Calendar retain their own bindings.
 * It intentionally provides no `trigger` binding: the desktop trigger belongs to the nested
 * Popover and the mobile trigger uses one `@click="open = true"` handler.
 *
 * ```html
 * <div x-data="lyraDatePicker({ defaultValue: '2024-05-01', locale: 'en-US' })">
 *   <template x-if="!mobile">
 *     <div class="lyra-popover-anchor lyra-datepicker"
 *     <!-- Alias scope: x-model resolves in the nested component's own scope first, so a
 *          same-name chain (open ↔ open) would entangle the component with itself. The alias
 *          getter/setter proxies the picker's property under a non-colliding name. -->
 *     <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
 *       <div x-data="lyraPopover({ ariaLabel: 'Date picker' })" x-modelable="open" x-model="pickerOpen">
 *       <button class="lyra-input lyra-datepicker__btn" x-bind="trigger">
 *         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
 *           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
 *           <path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" />
 *           <path d="M3 10h18" />
 *         </svg>
 *         <span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span>
 *       </button>
 *       <div class="lyra-popover" x-bind="panel">
 *         <div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }">
 *         <div class="lyra-cal" x-data="lyraCalendar({ locale })" x-modelable="selected" x-model="pickerSelected">
 *           <div class="lyra-cal__head">
 *             <button class="lyra-cal__nav" x-bind="prev">Previous</button>
 *             <button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button>
 *             <button class="lyra-cal__nav" x-bind="next">Next</button>
 *           </div>
 *           <template x-if="mode === 'days'"><div class="lyra-cal__grid">
 *             <template x-for="weekday in weekdays()" :key="weekday.key">
 *               <span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span>
 *             </template>
 *             <template x-for="date in days()" :key="dayKey(date)">
 *               <button class="lyra-cal__day" type="button" :class="dayClass(date)"
 *                 :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)"
 *                 :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)"
 *                 @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)">
 *                 <span x-text="date.getDate()"></span>
 *               </button>
 *             </template>
 *           </div></template>
 *           <template x-if="mode === 'months'"><div class="lyra-cal__mgrid">
 *             <template x-for="month in months()" :key="month.getMonth()">
 *               <button class="lyra-cal__mcell" type="button" :class="monthClass(month)"
 *                 @click="pickMonth(month)" x-text="monthName(month)"></button>
 *             </template>
 *           </div></template>
 *           <template x-if="mode === 'years'"><div class="lyra-cal__mgrid">
 *             <template x-for="year in years()" :key="year">
 *               <button class="lyra-cal__mcell" type="button" :class="yearClass(year)"
 *                 @click="pickYear(year)" x-text="year"></button>
 *             </template>
 *           </div></template>
 *           <div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div>
 *         </div>
 *       </div>
 *     </div>
 *   </template>
 *   <template x-if="mobile">
 *     <div class="lyra-datepicker">
 *       <button class="lyra-input lyra-datepicker__btn" type="button" @click="open = true">
 *         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
 *           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
 *           <path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" />
 *           <path d="M3 10h18" />
 *         </svg>
 *         <span :class="{ 'lyra-datepicker__ph': !hasSelection() }" x-text="triggerText()"></span>
 *       </button>
 *     </div>
 *     <div x-data="{ get pickerOpen() { return open }, set pickerOpen(v) { open = v } }">
 *     <div x-data="lyraBottomSheet()" x-modelable="open" x-model="pickerOpen">
 *       <div class="lyra-bottomsheet-overlay" x-bind="overlay">
 *         <div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1"
 *           aria-labelledby="date-picker-sheet-title" x-bind="panel">
 *           <div class="lyra-bottomsheet__header">
 *             <h2 id="date-picker-sheet-title" class="lyra-bottomsheet__title">Select date</h2>
 *             <button class="lyra-bottomsheet__close" x-bind="close">Close</button>
 *           </div>
 *           <div class="lyra-bottomsheet__body"><div class="lyra-cal--sheet">
 *             <div x-data="{ get pickerSelected() { return selected }, set pickerSelected(v) { selected = v } }">
 *         <div class="lyra-cal" x-data="lyraCalendar({ locale })" x-modelable="selected" x-model="pickerSelected">
 *               <div class="lyra-cal__head">
 *                 <button class="lyra-cal__nav" x-bind="prev">Previous</button>
 *                 <button class="lyra-cal__label" x-bind="viewButton" x-text="headerLabel()"></button>
 *                 <button class="lyra-cal__nav" x-bind="next">Next</button>
 *               </div>
 *               <template x-if="mode === 'days'"><div class="lyra-cal__grid">
 *                 <template x-for="weekday in weekdays()" :key="weekday.key">
 *                   <span class="lyra-cal__wd" :aria-label="weekday.long" x-text="weekday.narrow"></span>
 *                 </template>
 *                 <template x-for="date in days()" :key="dayKey(date)">
 *                   <button class="lyra-cal__day" type="button" :class="dayClass(date)"
 *                     :aria-disabled="dayDisabled(date)" :tabindex="dayTabindex(date)"
 *                     :aria-label="dayLabel(date)" :aria-pressed="dayPressed(date)" :data-key="dayKey(date)"
 *                     @click="selectDate(date)" @focus="onDayFocus(date)" @keydown="onDayKeydown($event, date)">
 *                     <span x-text="date.getDate()"></span>
 *                   </button>
 *                 </template>
 *               </div></template>
 *               <template x-if="mode === 'months'"><div class="lyra-cal__mgrid">
 *                 <template x-for="month in months()" :key="month.getMonth()">
 *                   <button class="lyra-cal__mcell" type="button" :class="monthClass(month)"
 *                     @click="pickMonth(month)" x-text="monthName(month)"></button>
 *                 </template>
 *               </div></template>
 *               <template x-if="mode === 'years'"><div class="lyra-cal__mgrid">
 *                 <template x-for="year in years()" :key="year">
 *                   <button class="lyra-cal__mcell" type="button" :class="yearClass(year)"
 *                     @click="pickYear(year)" x-text="year"></button>
 *                 </template>
 *               </div></template>
 *               <div class="lyra-cal__foot"><button class="lyra-cal__today" x-bind="today"></button></div>
 *             </div>
 *           </div></div>
 *         </div>
 *       </div>
 *     </div>
 *   </template>
 * </div>
 * ```
 */
export function lyraDatePicker({
  defaultValue,
  locale = 'en-US',
  placeholder = 'Select date',
}: LyraDatePickerOptions = {}): LyraDatePickerData {
  const state: LyraDatePickerData & ThisType<LyraDatePickerState> = {
    selected: normalizeDay(defaultValue),
    open: false,
    mobile: false,
    locale,
    placeholder,
    root: null,
    media: null,
    onMediaChange: null,
    onCalendarChange: null,

    init() {
      this.root = this.$el;
      this.onCalendarChange = (event) => {
        const detail = (event as CustomEvent<unknown>).detail;
        const value =
          typeof detail === 'string' ? detail : (detail as { value?: unknown } | null)?.value;
        if (typeof value === 'string') this.open = false;
      };
      this.root.addEventListener('lyra:change', this.onCalendarChange);

      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      this.media = window.matchMedia('(max-width: 640px)');
      this.mobile = this.media.matches;
      this.onMediaChange = (event) => {
        this.mobile = event.matches;
      };
      this.media.addEventListener('change', this.onMediaChange);
    },

    destroy() {
      if (this.root && this.onCalendarChange)
        this.root.removeEventListener('lyra:change', this.onCalendarChange);
      if (this.media && this.onMediaChange)
        this.media.removeEventListener('change', this.onMediaChange);
      this.root = null;
      this.media = null;
      this.onMediaChange = null;
      this.onCalendarChange = null;
    },

    triggerText() {
      const selected = normalizeDay(this.selected);
      return selected ? new Intl.DateTimeFormat(this.locale).format(selected) : this.placeholder;
    },

    hasSelection() {
      return normalizeDay(this.selected) !== null;
    },
  };

  return state;
}
