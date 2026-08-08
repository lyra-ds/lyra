const COPIED_RESET_DELAY = 1500;

type Binding = Record<string, unknown>;

interface LyraCodeBlockData {
  copied: boolean;
  root: HTMLElement | null;
  resetTimer: ReturnType<typeof setTimeout> | null;
  init(): void;
  destroy(): void;
  copy(): Promise<void>;
  copyText(): string;
  copyButton: Binding;
  status: Binding;
}

interface LyraCodeBlockMagics {
  $el: HTMLElement;
}

type LyraCodeBlockState = LyraCodeBlockData & LyraCodeBlockMagics;

/**
 * Copy feedback for consumer-rendered code block markup.
 *
 * `copied` is internal-only to match React: consumer markup renders its copy/copy-confirmed label
 * swap and polite live-region text from this reactive property, but it is not `x-modelable`.
 */
export function lyraCodeBlock(): LyraCodeBlockData {
  const state: LyraCodeBlockData & ThisType<LyraCodeBlockState> = {
    copied: false,
    root: null,
    resetTimer: null,

    init() {
      this.root = this.$el;
    },

    destroy() {
      if (this.resetTimer !== null) clearTimeout(this.resetTimer);
    },

    async copy() {
      const text = this.copyText();
      if (!navigator.clipboard) return;

      try {
        await navigator.clipboard.writeText(text);
        this.copied = true;
        if (this.resetTimer !== null) clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(() => {
          this.copied = false;
        }, COPIED_RESET_DELAY);
      } catch {
        this.copied = false;
      }
    },

    copyText() {
      if (!this.root) return '';
      const copyText = this.root.getAttribute('data-copy-text');
      if (copyText !== null) return copyText;
      return (
        this.root.querySelector<HTMLElement>('.lyra-code__pre')?.textContent ??
        this.root.querySelector('pre')?.textContent ??
        ''
      );
    },

    copyButton: {
      type: 'button',
      ['@click']() {
        void this.copy();
      },
    },

    status: {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
  };

  return state;
}
