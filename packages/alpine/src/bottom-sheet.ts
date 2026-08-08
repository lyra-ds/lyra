import { attachFocusTrap } from './internal/focus-trap';
import { createPresence, type PresenceController } from './internal/presence';
import { lockScroll, unlockScroll } from './internal/scroll-lock';
import { whenVisible } from './internal/when-visible';

const INITIAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Initial configuration accepted by `x-data="lyraBottomSheet(...)"`. */
export interface LyraBottomSheetOptions {
  /** Whether the sheet starts open. Defaults to `false`. */
  defaultOpen?: boolean;
}

type Binding = Record<string, unknown>;

interface LyraBottomSheetData {
  open: boolean;
  closing: boolean;
  mounted: boolean;
  root: HTMLElement | null;
  opener: Element | null;
  downOnOverlay: boolean;
  presence: PresenceController | null;
  focusTrapCleanup: (() => void) | null;
  scrollLocked: boolean;
  init(): void;
  destroy(): void;
  panelElement(): HTMLElement | null;
  activateOpen(): void;
  activateClose(): void;
  attachFocusTrap(): void;
  detachFocusTrap(): void;
  focusInitial(): void;
  restoreOpener(): void;
  dismiss(): void;
  overlay: Binding;
  panel: Binding;
  close: Binding;
}

interface LyraBottomSheetMagics {
  $dispatch(name: string, detail?: unknown): void;
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraBottomSheetState = LyraBottomSheetData & LyraBottomSheetMagics;

/**
 * A modal bottom sheet over consumer-rendered markup.
 *
 * Consumers serve the `.lyra-bottomsheet-overlay` and `.lyra-bottomsheet` elements, binding
 * them with `x-bind="overlay"` and `x-bind="panel"`. The panel serves `role="dialog"`,
 * `aria-modal="true"`, `tabindex="-1"`, and either `aria-labelledby` pointing to its served
 * `.lyra-bottomsheet__title` id or an `aria-label` when it has no visible title. Bind the served
 * close button with `x-bind="close"`; title and other structural markup have no dynamic binding.
 */
export function lyraBottomSheet({
  defaultOpen = false,
}: LyraBottomSheetOptions = {}): LyraBottomSheetData {
  const state: LyraBottomSheetData & ThisType<LyraBottomSheetState> = {
    open: defaultOpen,
    closing: false,
    mounted: defaultOpen,
    root: null,
    opener: null,
    downOnOverlay: false,
    presence: null,
    focusTrapCleanup: null,
    scrollLocked: false,

    init() {
      this.root = this.$el;
      this.presence = createPresence(this.open, (closing) => {
        this.closing = closing;
        this.mounted = this.open || closing;
      });
      this.$watch('open', (open) => {
        if (open) this.activateOpen();
        else this.activateClose();
      });
      if (this.open) this.activateOpen();
    },

    destroy() {
      this.detachFocusTrap();
      this.presence?.destroy();
      this.presence = null;
      if (this.scrollLocked) {
        unlockScroll();
        this.scrollLocked = false;
      }
      this.opener = null;
    },

    panelElement() {
      return this.root?.querySelector<HTMLElement>('.lyra-bottomsheet') ?? null;
    },

    activateOpen() {
      this.mounted = true;
      this.presence?.update(true);
      if (!this.scrollLocked) {
        lockScroll();
        this.scrollLocked = true;
      }
      this.opener = document.activeElement;
      this.$nextTick(() => {
        const panel = this.panelElement();
        if (!panel) return;
        whenVisible(
          panel,
          () => !this.open,
          () => {
            this.attachFocusTrap();
            this.focusInitial();
          },
        );
      });
    },

    activateClose() {
      this.presence?.update(false);
      this.detachFocusTrap();
      if (this.scrollLocked) {
        unlockScroll();
        this.scrollLocked = false;
      }
      this.restoreOpener();
    },

    attachFocusTrap() {
      this.detachFocusTrap();
      const panel = this.panelElement();
      if (panel) this.focusTrapCleanup = attachFocusTrap(panel);
    },

    detachFocusTrap() {
      this.focusTrapCleanup?.();
      this.focusTrapCleanup = null;
    },

    focusInitial() {
      const panel = this.panelElement();
      if (!panel) return;
      const firstFocusable = panel.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR);
      (firstFocusable ?? panel).focus();
    },

    restoreOpener() {
      if (this.opener instanceof HTMLElement && this.opener.isConnected) this.opener.focus();
      this.opener = null;
    },

    dismiss() {
      this.open = false;
      this.$dispatch('lyra:close');
    },

    overlay: {
      ['x-show']() {
        return this.mounted;
      },
      [':class']() {
        return { 'lyra-bottomsheet-overlay--closing': this.closing };
      },
      ['@mousedown'](event: MouseEvent) {
        this.downOnOverlay = event.target === event.currentTarget;
      },
      ['@click'](event: MouseEvent) {
        if (this.downOnOverlay && event.target === event.currentTarget) this.dismiss();
      },
    },

    panel: {
      [':class']() {
        return { 'lyra-bottomsheet--closing': this.closing };
      },
      ['@animationend'](event: AnimationEvent) {
        this.presence?.onAnimationEnd(event);
      },
      ['@keydown'](event: KeyboardEvent) {
        if (event.key === 'Escape') this.dismiss();
      },
    },

    close: {
      type: 'button',
      ['@click']() {
        this.dismiss();
      },
    },
  };

  return state;
}
