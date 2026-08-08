/** Initial configuration accepted by `x-data="lyraTimeInput(...)"`. */
export interface LyraTimeInputOptions {
  /** Initial 24-hour HH:mm value, or no selection when omitted. */
  defaultValue?: string;
  /** Minutes added or subtracted by steppers and Arrow keys. Default: `15`. */
  step?: number;
  /** Inclusive 24-hour HH:mm lower limit. */
  min?: string;
  /** Inclusive 24-hour HH:mm upper limit. */
  max?: string;
  /** Enables consumer-driven invalid styling and `aria-invalid`. */
  invalid?: boolean;
  /** Spoken value for a selected time. */
  valueText?: (hours: number, minutes: number) => string;
}

type Binding = Record<string, unknown>;

interface LyraTimeInputData {
  selected: string | null;
  text: string;
  bad: boolean;
  init(): void;
  clamp(minutes: number): number;
  normalize(raw: string): void;
  bump(delta: number): void;
  input: Binding;
  up: Binding;
  down: Binding;
}

interface LyraTimeInputMagics {
  $dispatch(name: string, detail?: Record<string, unknown>): void;
  $watch(path: string, callback: (value: string | null) => void): void;
}

type LyraTimeInputState = LyraTimeInputData & LyraTimeInputMagics;

const pad = (value: number): string => String(value).padStart(2, '0');

function minutesFromTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 ? hours * 60 + minutes : null;
}

const timeFromMinutes = (minutes: number): string =>
  pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60);

/**
 * Parses supported free-form time input. null means an intentional clear, undefined means
 * invalid text that must remain visible for correction, and a string is a valid normalized time.
 */
function parseTime(raw: string): string | null | undefined {
  const text = raw.trim().replace(/[hH]/, ':');
  if (!text) return null;

  let hours: number;
  let minutes: number;
  if (text.includes(':')) {
    const fields = text.split(':');
    if (fields.length !== 2) return undefined;
    const [rawHours, rawMinutes = '0'] = fields;
    hours = Number(rawHours);
    minutes = Number(rawMinutes);
  } else if (text.length <= 2) {
    hours = Number(text);
    minutes = 0;
  } else {
    hours = Number(text.slice(0, -2));
    minutes = Number(text.slice(-2));
  }

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return undefined;
  }
  return timeFromMinutes(hours * 60 + minutes);
}

const defaultValueText = (hours: number, minutes: number): string =>
  String(hours) + ' hours and ' + String(minutes) + ' minutes';

/**
 * A controllable masked 24-hour HH:mm input over consumer-rendered markup.
 *
 * Serve the input with `x-bind="input"`, and the increment and decrement buttons with
 * `x-bind="up"` and `x-bind="down"`. Consumers serve the `.lyra-input` base and size
 * classes, the surrounding `.lyra-timeinput` structure, and all label, hint, error text, and
 * their ids (including `label[for]`, `aria-describedby`, and stepper labels).
 */
export function lyraTimeInput({
  defaultValue,
  step = 15,
  min,
  max,
  invalid = false,
  valueText = defaultValueText,
}: LyraTimeInputOptions = {}): LyraTimeInputData {
  const lowerLimit = minutesFromTime(min);
  const upperLimit = minutesFromTime(max);
  const state: LyraTimeInputData & ThisType<LyraTimeInputState> = {
    selected: defaultValue ?? null,
    text: defaultValue ?? '',
    bad: false,

    init() {
      this.$watch('selected', (selected) => {
        this.text = selected ?? '';
        this.bad = false;
      });
    },

    clamp(minutes) {
      return Math.min(upperLimit ?? 1439, Math.max(lowerLimit ?? 0, minutes));
    },

    normalize(raw) {
      const parsed = parseTime(raw);
      if (parsed === undefined) {
        this.bad = true;
        return;
      }

      this.bad = false;
      if (parsed === null) {
        this.selected = null;
        this.$dispatch('lyra:change', { value: null });
        return;
      }

      const normalized = timeFromMinutes(this.clamp(minutesFromTime(parsed)!));
      this.text = normalized;
      this.selected = normalized;
      this.$dispatch('lyra:change', { value: normalized });
    },

    bump(delta) {
      const parsedText = parseTime(this.text);
      const base =
        minutesFromTime(typeof parsedText === 'string' ? parsedText : this.selected) ??
        this.clamp(new Date().getHours() * 60);
      const next = timeFromMinutes(this.clamp(base + delta));
      this.text = next;
      this.bad = false;
      this.selected = next;
      this.$dispatch('lyra:change', { value: next });
    },

    input: {
      role: 'spinbutton',
      inputmode: 'numeric',
      autocomplete: 'off',
      [':value']() {
        return this.text;
      },
      [':aria-invalid']() {
        return this.bad || invalid ? true : false;
      },
      [':class']() {
        return { 'lyra-input--error': this.bad || invalid };
      },
      [':aria-valuemin']() {
        return lowerLimit ?? 0;
      },
      [':aria-valuemax']() {
        return upperLimit ?? 1439;
      },
      [':aria-valuenow']() {
        return minutesFromTime(this.selected) ?? false;
      },
      [':aria-valuetext']() {
        const selectedMinutes = minutesFromTime(this.selected);
        return selectedMinutes === null
          ? false
          : valueText(Math.floor(selectedMinutes / 60), selectedMinutes % 60);
      },
      ['@input'](event: Event) {
        this.text = (event.currentTarget as HTMLInputElement).value;
      },
      ['@blur'](event: FocusEvent) {
        this.normalize((event.currentTarget as HTMLInputElement).value);
      },
      ['@keydown'](event: KeyboardEvent) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          this.bump(event.shiftKey ? 60 : step);
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.bump(event.shiftKey ? -60 : -step);
        } else if (event.key === 'Enter') {
          this.normalize((event.currentTarget as HTMLInputElement).value);
        }
      },
    },

    up: {
      type: 'button',
      tabindex: '-1',
      ['@click']() {
        this.bump(step);
      },
    },

    down: {
      type: 'button',
      tabindex: '-1',
      ['@click']() {
        this.bump(-step);
      },
    },
  };

  return state;
}
