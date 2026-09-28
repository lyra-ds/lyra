import { dateFrom, isoFrom, normalizeDay, sameDay } from './internal/date-utils';

const HOUR_HEIGHT = 48;
type View = 'day' | 'week' | 'month';
export type LyraCalendarViewKind = 'session' | 'program-session' | 'pending' | 'block' | 'external';

/** An event in local calendar time. Extra application fields are preserved in event-open. */
export interface LyraCalendarViewEvent {
  id: string | number;
  kind?: LyraCalendarViewKind;
  start: string | Date;
  end: string | Date;
  title: string;
  [key: string]: unknown;
}

export interface LyraCalendarViewAvailability {
  start: string;
  end: string;
}

/** Translatable controls. `event` accepts a localized date, `HH:mm`, and title. */
export interface LyraCalendarViewLabels {
  previous?: string;
  today?: string;
  next?: string;
  view?: string;
  day?: string;
  week?: string;
  month?: string;
  event?: (date: string, time: string, title: string) => string;
}

/** Options for `x-data="lyraCalendarView(...)"`. `view` and `date` are also writable Alpine state. */
export interface LyraCalendarViewOptions {
  /** Initial view, default `week`. Can be synchronized with `x-modelable="view"`. */
  defaultView?: View;
  /** Initial local anchor, default today. Can be synchronized with `x-modelable="date"`. */
  defaultDate?: string | Date;
  events?: LyraCalendarViewEvent[];
  availability?: Record<number, LyraCalendarViewAvailability[]>;
  startHour?: number;
  endHour?: number;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  slotStep?: number;
  locale?: string;
  labels?: LyraCalendarViewLabels;
}

interface NormalizedEvent extends LyraCalendarViewEvent {
  startDate: Date;
  endDate: Date;
  kind: LyraCalendarViewKind;
}
interface Popover {
  event: LyraCalendarViewEvent;
  top: number;
  left: number;
}
interface DayData {
  date: Date;
  key: string;
  events: NormalizedEvent[];
  windows: LyraCalendarViewAvailability[];
}

interface CalendarViewData {
  view: View;
  date: string;
  events: LyraCalendarViewEvent[];
  availability: Record<number, LyraCalendarViewAvailability[]>;
  popover: Popover | null;
  root: HTMLElement | null;
  init(): void;
  destroy(): void;
  label(key: keyof Omit<LyraCalendarViewLabels, 'event'>): string;
  setView(view: View): void;
  setDate(date: string | Date): void;
  navigate(direction: number): void;
  title(): string;
  days(): DayData[];
  weekdays(): string[];
  weekdayLabel(day: DayData): string;
  gridStyle(): Record<string, string>;
  gridHeight(): number;
  hours(): number[];
  hourStyle(hour: number): Record<string, string>;
  dayClass(day: DayData): Record<string, boolean>;
  monthClass(day: DayData): Record<string, boolean>;
  monthEvents(day: DayData): NormalizedEvent[];
  monthMore(day: DayData): number;
  selectMonthDay(day: DayData): void;
  time(date: Date): string;
  eventLabel(event: NormalizedEvent): string;
  eventStyle(event: NormalizedEvent): Record<string, string>;
  availabilityStyle(window: LyraCalendarViewAvailability): Record<string, string>;
  nowStyle(day: DayData): Record<string, string> | null;
  createSlot(pointer: MouseEvent, day: DayData): void;
  openEvent(pointer: MouseEvent, event: NormalizedEvent): void;
  closePopover(): void;
}

interface Magics {
  $el: HTMLElement;
  $dispatch(name: string, detail?: unknown): void;
}
type State = CalendarViewData & Magics;

const DEFAULT_LABELS: Required<LyraCalendarViewLabels> = {
  previous: 'Previous period',
  today: 'Today',
  next: 'Next period',
  view: 'Calendar view',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  event: (date, time, title) => `${date}, ${time} — ${title}`,
};

function eventDate(value: string | Date): Date | null {
  const date = normalizeDay(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return date;
  const exact = value instanceof Date ? value : new Date(value);
  return Number.isNaN(exact.getTime()) ? null : exact;
}

function minutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
function timeMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
}

/** Local-time day/week/month scheduler over served Alpine markup. */
export function lyraCalendarView({
  defaultView = 'week',
  defaultDate,
  events = [],
  availability = {},
  startHour = 7,
  endHour = 21,
  weekStartsOn = 1,
  slotStep = 30,
  locale = 'en-US',
  labels: translations,
}: LyraCalendarViewOptions = {}): CalendarViewData {
  const labels = { ...DEFAULT_LABELS, ...translations };
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const longDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const dayTitle = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const shortDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const shortYear = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const initialDate = normalizeDay(defaultDate) ?? new Date();
  const safeStep = Number.isFinite(slotStep) && slotStep > 0 ? slotStep : 30;
  let onPointer: (event: PointerEvent) => void;
  let onKey: (event: KeyboardEvent) => void;
  let onResize: () => void;

  const state: CalendarViewData & ThisType<State> = {
    view: defaultView,
    date: isoFrom(initialDate),
    events,
    availability,
    popover: null,
    root: null,
    init() {
      this.root = this.$el;
      onPointer = (event) => {
        if (
          this.popover &&
          !(event.target instanceof Element && event.target.closest('.lyra-calview__pop'))
        )
          this.closePopover();
      };
      onKey = (event) => {
        if (event.key === 'Escape') this.closePopover();
      };
      onResize = () => this.closePopover();
      document.addEventListener('pointerdown', onPointer);
      document.addEventListener('keydown', onKey);
      window.addEventListener('resize', onResize);
    },
    destroy() {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    },
    label(key) {
      return labels[key];
    },
    setView(view) {
      if (!['day', 'week', 'month'].includes(view)) return;
      this.view = view;
      this.closePopover();
      this.$dispatch('lyra:view-change', view);
    },
    setDate(value) {
      const date = normalizeDay(value);
      if (!date) return;
      const next = isoFrom(date);
      this.date = next;
      this.closePopover();
      this.$dispatch('lyra:change', next);
    },
    navigate(direction) {
      const anchor = dateFrom(this.date) ?? new Date();
      const next = new Date(anchor);
      if (this.view === 'day') next.setDate(anchor.getDate() + direction);
      else if (this.view === 'week') next.setDate(anchor.getDate() + direction * 7);
      else next.setMonth(anchor.getMonth() + direction);
      this.setDate(next);
    },
    title() {
      const anchor = dateFrom(this.date) ?? new Date();
      if (this.view === 'month') return monthTitle.format(anchor);
      if (this.view === 'day') return dayTitle.format(anchor);
      const days = this.days();
      return `${shortDate.format(days[0]!.date)} – ${shortYear.format(days[6]!.date)}`;
    },
    days() {
      const anchor = dateFrom(this.date) ?? new Date();
      const start = new Date(anchor);
      if (this.view === 'month') start.setDate(1);
      if (this.view !== 'day')
        start.setDate(start.getDate() - ((start.getDay() - weekStartsOn + 7) % 7));
      const count = this.view === 'day' ? 1 : this.view === 'week' ? 7 : 42;
      return Array.from({ length: count }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const dayEvents = this.events.reduce<NormalizedEvent[]>((result, event) => {
          const startDate = eventDate(event.start);
          const endDate = eventDate(event.end);
          if (startDate && endDate && sameDay(startDate, date))
            result.push({ ...event, startDate, endDate, kind: event.kind ?? 'session' });
          return result;
        }, []);
        return {
          date,
          key: isoFrom(date),
          events: dayEvents,
          windows: this.availability[date.getDay()] ?? [],
        };
      });
    },
    weekdays() {
      return this.days()
        .slice(0, 7)
        .map((day) => weekday.format(day.date));
    },
    weekdayLabel(day) {
      return weekday.format(day.date);
    },
    gridStyle() {
      return { gridTemplateColumns: `56px repeat(${this.view === 'day' ? 1 : 7}, 1fr)` };
    },
    gridHeight() {
      return Math.max(0, endHour - startHour) * HOUR_HEIGHT;
    },
    hours() {
      return Array.from(
        { length: Math.max(0, endHour - startHour) },
        (_, index) => startHour + index,
      );
    },
    hourStyle(hour) {
      return { top: `${(hour - startHour) * HOUR_HEIGHT}px` };
    },
    dayClass(day) {
      return { 'lyra-calview__head-cell--today': sameDay(day.date, new Date()) };
    },
    monthClass(day) {
      const anchor = dateFrom(this.date) ?? new Date();
      return {
        'lyra-calview__mcell--out': day.date.getMonth() !== anchor.getMonth(),
        'lyra-calview__mcell--today': sameDay(day.date, new Date()),
      };
    },
    monthEvents(day) {
      return day.events.slice(0, 3);
    },
    monthMore(day) {
      return Math.max(0, day.events.length - 3);
    },
    selectMonthDay(day) {
      this.setDate(day.date);
      this.setView('day');
    },
    time(date) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    eventLabel(event) {
      return labels.event(
        longDate.format(event.startDate),
        this.time(event.startDate),
        event.title,
      );
    },
    eventStyle(event) {
      const height = Math.max(
        20,
        ((event.endDate.getTime() - event.startDate.getTime()) / 3_600_000) * HOUR_HEIGHT - 2,
      );
      return {
        top: `${((minutes(event.startDate) - startHour * 60) / 60) * HOUR_HEIGHT + 1}px`,
        height: `${height}px`,
      };
    },
    availabilityStyle(window) {
      const start = timeMinutes(window.start);
      return {
        top: `${((start - startHour * 60) / 60) * HOUR_HEIGHT}px`,
        height: `${((timeMinutes(window.end) - start) / 60) * HOUR_HEIGHT}px`,
      };
    },
    nowStyle(day) {
      const now = new Date();
      return sameDay(day.date, now) && minutes(now) > startHour * 60 && minutes(now) < endHour * 60
        ? { top: `${((minutes(now) - startHour * 60) / 60) * HOUR_HEIGHT}px` }
        : null;
    },
    createSlot(pointer, day) {
      if (
        this.popover ||
        !(pointer.currentTarget instanceof HTMLElement) ||
        (pointer.target instanceof Element && pointer.target.closest('.lyra-calview__evt'))
      )
        return;
      const rect = pointer.currentTarget.getBoundingClientRect();
      const raw =
        startHour * 60 +
        Math.floor((((pointer.clientY - rect.top) / HOUR_HEIGHT) * 60) / safeStep) * safeStep;
      const date = new Date(day.date);
      date.setHours(Math.floor(raw / 60), raw % 60, 0, 0);
      this.$dispatch('lyra:slot-create', date);
    },
    openEvent(pointer, event) {
      pointer.stopPropagation();
      this.$dispatch('lyra:event-open', event);
      const chip = pointer.currentTarget;
      const scroll = this.root?.querySelector<HTMLElement>('.lyra-calview__scroll');
      const panel = scroll?.querySelector<HTMLElement>('.lyra-calview__pop');
      if (!(chip instanceof HTMLElement) || !scroll || !panel) return;
      const chipRect = chip.getBoundingClientRect();
      const scrollRect = scroll.getBoundingClientRect();
      this.popover = {
        event,
        top: chipRect.top - scrollRect.top + scroll.scrollTop + Math.min(chipRect.height, 32),
        left: Math.max(0, Math.min(chipRect.left - scrollRect.left + 8, scrollRect.width - 240)),
      };
    },
    closePopover() {
      this.popover = null;
    },
  };
  return state;
}
