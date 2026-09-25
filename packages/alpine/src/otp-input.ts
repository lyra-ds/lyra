/** Initial configuration accepted by `x-data="lyraOtpInput(...)"`. */
export interface LyraOtpInputOptions {
  /** Number of numeric digits. Default: 6. */
  length?: number;
  /** Initial code. */
  defaultValue?: string;
  /** Adds an invalid state; serve an error message and aria-describedby in the markup. */
  invalid?: boolean;
  /** Localized word for each digit's accessible name. Default: "Digit". */
  digitLabel?: string;
}

type Binding = Record<string, unknown>;

interface LyraOtpInputData {
  code: string;
  length: number;
  invalid: boolean;
  digitLabel: string;
  positions: number[];
  root: HTMLElement | null;
  init(): void;
  inputs(): HTMLInputElement[];
  focus(index: number): void;
  write(index: number, text: string): void;
  digit: Binding;
}

interface LyraOtpInputMagics {
  $el: HTMLElement;
  $dispatch(name: string, detail?: unknown): void;
  $watch(path: string, callback: (value: string) => void): void;
}

type LyraOtpInputState = LyraOtpInputData & LyraOtpInputMagics;

const numeric = (value: string, length: number): string =>
  value.replace(/[^0-9]/g, '').slice(0, length);

/** Segmented OTP behavior for consumer-served inputs with `x-for="index in positions"` and `x-bind="digit"`. */
export function lyraOtpInput({
  length = 6,
  defaultValue = '',
  invalid = false,
  digitLabel = 'Digit',
}: LyraOtpInputOptions = {}): LyraOtpInputData {
  const count = Math.max(1, Math.floor(Number.isFinite(length) ? length : 6));
  const state: LyraOtpInputData & ThisType<LyraOtpInputState> = {
    code: numeric(defaultValue, count),
    length: count,
    invalid,
    digitLabel,
    positions: Array.from({ length: count }, (_, index) => index),
    root: null,

    init() {
      this.root = this.$el;
      this.$watch('code', (value) => {
        const clean = numeric(value ?? '', this.length);
        if (clean !== value) this.code = clean;
      });
    },

    inputs() {
      return Array.from(this.root?.querySelectorAll<HTMLInputElement>('.lyra-otp__digit') ?? []);
    },

    focus(index) {
      const target = this.inputs()[Math.max(0, Math.min(index, this.length - 1))];
      target?.focus();
      target?.select();
    },

    write(index, text) {
      const incoming = numeric(text, this.length);
      if (!incoming) return;
      const start = incoming.length >= this.length ? 0 : Math.min(index, this.code.length);
      const next = Array.from({ length: this.length }, (_, position) => this.code[position] ?? '');
      for (let offset = 0; offset < incoming.length && start + offset < this.length; offset += 1) {
        next[start + offset] = incoming[offset];
      }
      this.code = next.join('');
      this.$dispatch('lyra:change', { value: this.code });
      this.focus(Math.min(start + incoming.length, this.length - 1));
    },

    digit: {
      ':value'(this: LyraOtpInputState) {
        const index = Number(this.$el.dataset.index);
        return this.code[index] ?? '';
      },
      ':aria-label'(this: LyraOtpInputState) {
        return `${this.digitLabel} ${Number(this.$el.dataset.index) + 1} / ${this.length}`;
      },
      ':aria-invalid'(this: LyraOtpInputState) {
        return this.invalid ? 'true' : null;
      },
      ':class'(this: LyraOtpInputState) {
        return { 'lyra-input--error': this.invalid };
      },
      '@input'(this: LyraOtpInputState, event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const index = Number(input.dataset.index);
        if (input.value) this.write(index, input.value);
        else {
          const next = this.code.split('');
          next.splice(index, 1);
          this.code = next.join('');
          this.$dispatch('lyra:change', { value: this.code });
        }
      },
      '@paste'(this: LyraOtpInputState, event: ClipboardEvent) {
        event.preventDefault();
        this.write(
          Number((event.currentTarget as HTMLInputElement).dataset.index),
          event.clipboardData?.getData('text') ?? '',
        );
      },
      '@keydown'(this: LyraOtpInputState, event: KeyboardEvent) {
        const index = Number((event.currentTarget as HTMLInputElement).dataset.index);
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          this.focus(index + (event.key === 'ArrowLeft' ? -1 : 1));
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          this.focus(event.key === 'Home' ? 0 : this.length - 1);
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault();
          const target =
            event.key === 'Backspace' && !this.code[index] ? Math.max(0, index - 1) : index;
          const next = this.code.split('');
          next.splice(target, 1);
          this.code = next.join('');
          this.$dispatch('lyra:change', { value: this.code });
          if (event.key === 'Backspace') this.focus(target);
        }
      },
    },
  };
  return state;
}
