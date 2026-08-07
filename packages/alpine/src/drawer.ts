import { attachFocusTrap } from './internal/focus-trap';
import { createPresence, type PresenceController } from './internal/presence';
import { lockScroll, unlockScroll } from './internal/scroll-lock';

const INITIAL_FOCUS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Initial configuration accepted by `x-data="lyraDrawer(...)"`. */
export interface LyraDrawerOptions {
  defaultOpen?: boolean;
  labelId?: string;
}

type Binding = Record<string, unknown>;

interface LyraDrawerData {
  open: boolean;
  closing: boolean;
  mounted: boolean;
  labelId?: string;
  titleId: string;
  root: HTMLElement | null;
  opener: Element | null;
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
  overlay: Binding;
  panel: Binding;
  title: Binding;
  close: Binding;
}

interface LyraDrawerMagics {
  $el: HTMLElement;
  $nextTick(callback: () => void): void;
  $watch(path: string, callback: (value: boolean) => void): void;
}

type LyraDrawerState = LyraDrawerData & LyraDrawerMagics;

let nextDrawerId = 0;

/** A modal slide-over panel driven entirely by consumer-rendered markup. */
export function lyraDrawer({
  defaultOpen = false,
  labelId,
}: LyraDrawerOptions = {}): LyraDrawerData {
  const state: LyraDrawerData & ThisType<LyraDrawerState> = {
    open: defaultOpen,
    closing: false,
    mounted: defaultOpen,
    labelId,
    titleId: '',
    root: null,
    opener: null,
    presence: null,
    focusTrapCleanup: null,
    scrollLocked: false,

    init() {
      this.root = this.$el;
      if (!this.root.id) this.root.id = `lyra-drawer-${++nextDrawerId}`;
      this.titleId = this.labelId ?? `${this.root.id}-title`;
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
      return this.root?.querySelector<HTMLElement>('.lyra-drawer') ?? null;
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
        if (!this.open) return;
        this.attachFocusTrap();
        this.focusInitial();
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
      if (this.opener instanceof HTMLElement) this.opener.focus();
      this.opener = null;
    },

    overlay: {
      // x-show must read the single `mounted` flag, never `open || closing`: on close, `open`
      // flips false one scheduler tick before the watcher sets `closing`, and that transient
      // false→true flap arms Alpine's requestAnimationFrame-deferred show, which lands AFTER
      // the final microtask-deferred hide and re-reveals the dismissed overlay.
      ['x-show']() {
        return this.mounted;
      },
      [':class']() {
        return this.closing ? 'lyra-drawer-overlay--closing' : '';
      },
      ['@click'](event: MouseEvent) {
        if (event.target === event.currentTarget) this.open = false;
      },
    },

    panel: {
      role: 'dialog',
      'aria-modal': 'true',
      tabindex: '-1',
      [':aria-labelledby']() {
        return this.titleId;
      },
      [':class']() {
        return this.closing ? 'lyra-drawer--closing' : '';
      },
      ['@keydown'](event: KeyboardEvent) {
        if (event.key === 'Escape') this.open = false;
      },
      ['@animationend'](event: AnimationEvent) {
        this.presence?.onAnimationEnd(event);
      },
    },

    title: {
      [':id']() {
        return this.titleId;
      },
    },

    close: {
      type: 'button',
      'aria-label': 'Close',
      ['@click']() {
        this.open = false;
      },
    },
  };

  return state;
}
