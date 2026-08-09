/** A visual tone supported by a queued notification. */
export type ToastTone = 'info' | 'success' | 'danger';

/** Configuration accepted by {@link LyraToastsStore.toast}. */
export interface LyraToastOptions {
  /** Visual tone and its default icon. Default: `"info"`. */
  tone?: ToastTone;
  /** Auto-dismiss delay in milliseconds. `0` disables auto-dismiss for this notification. */
  duration?: number;
}

/** A notification currently owned by the singleton toast store. */
export interface QueuedToast {
  /** Store-local identifier returned when the notification was queued. */
  id: number;
  /** Plain-text notification message. */
  message: string;
  /** Visual tone that selects the icon and modifier class. */
  tone: ToastTone;
}

/** Imperative notification API and state registered as `Alpine.store('lyraToasts', ...)`. */
export interface LyraToastsStore {
  /** The current queue, in the order notifications were added. */
  items: QueuedToast[];
  /** Default auto-dismiss delay in milliseconds. Default: `4000`. */
  duration: number;
  /** Accessible name passed to every toast close button. Default: `"Close notification"`. */
  closeLabel: string;
  /** Registers the singleton's browser-only Livewire event bridge. */
  init(): void;
  /** Queues a notification and returns its store-local identifier. */
  toast(message: string, options?: LyraToastOptions): number;
  /** Queues a success notification, overriding a supplied tone. */
  success(message: string, options?: LyraToastOptions): number;
  /** Queues a danger notification, overriding a supplied tone. */
  error(message: string, options?: LyraToastOptions): number;
  /** Queues an informational notification, overriding a supplied tone. */
  info(message: string, options?: LyraToastOptions): number;
  /** Removes a notification and clears its pending auto-dismiss timer, if any. */
  dismiss(id: number): void;
}

type Binding = Record<string, unknown>;

/** State exposed by `x-data="lyraToastStack()"`. */
export interface LyraToastStackData {
  /** The singleton queue, exposed for `template x-for="toast in toasts"`. */
  readonly toasts: QueuedToast[];
  /** The singleton close label, exposed for the served close-button binding. */
  readonly closeLabel: string;
  /** Returns the exact tone modifier class for a served icon wrapper. */
  toneClass(tone: ToastTone): string;
  /** Binds the native close button and removes the toast represented by its row. */
  closeButton: Binding;
}

interface LyraToastStackMagics {
  $el: HTMLElement;
  $store: { lyraToasts: LyraToastsStore };
}

type LyraToastStackState = LyraToastStackData & LyraToastStackMagics;

let nextId = 0;
let activeToastStore: LyraToastsStore | undefined;
let toastListenerInstalled = false;

/**
 * The singleton `Alpine.store('lyraToasts', ...)` notification state machine.
 *
 * Its timers deliberately belong to the store rather than to any rendered stack. A stack may
 * unmount and remount during a Livewire update; queued notifications then keep their scheduled
 * dismissal instead of becoming stranded. The same singleton also has no React-style unmounted
 * guard: a promise continuation may safely queue a toast after a stack is gone, and the timer
 * removes it on schedule even when no stack is mounted. Dismissing an unknown id is a no-op.
 *
 * `init()` installs the `lyra:toast` window listener used by `$this->dispatch('lyra:toast', ...)`.
 * The listener is intentionally never removed because Alpine stores are singleton page-lifetime
 * state, unlike a mountable component. Installed once per module, it forwards events to whichever
 * store registered last, mirroring `Alpine.store`'s overwrite semantics. Re-registering a store
 * takes over the bridge rather than adding another listener.
 */
export function lyraToasts(): LyraToastsStore {
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  const state: LyraToastsStore & ThisType<LyraToastsStore> = {
    items: [],
    duration: 4000,
    closeLabel: 'Close notification',

    init() {
      activeToastStore = this;
      if (toastListenerInstalled) return;
      toastListenerInstalled = true;
      window.addEventListener('lyra:toast', (event) => {
        const { message, tone, duration } = (
          event as CustomEvent<{
            message: string;
            tone?: ToastTone;
            duration?: number;
          }>
        ).detail;
        activeToastStore?.toast(message, { tone, duration });
      });
    },

    toast(message, options = {}) {
      const id = ++nextId;
      const toast: QueuedToast = {
        id,
        message,
        tone: options.tone ?? 'info',
      };
      this.items = [...this.items, toast];

      const timeout = options.duration ?? this.duration;
      if (timeout > 0)
        timers.set(
          id,
          setTimeout(() => this.dismiss(id), timeout),
        );
      return id;
    },

    success(message, options) {
      return this.toast(message, { ...options, tone: 'success' });
    },

    error(message, options) {
      return this.toast(message, { ...options, tone: 'danger' });
    },

    info(message, options) {
      return this.toast(message, { ...options, tone: 'info' });
    },

    dismiss(id) {
      const timer = timers.get(id);
      if (timer !== undefined) {
        clearTimeout(timer);
        timers.delete(id);
      }
      this.items = this.items.filter((toast) => toast.id !== id);
    },
  };

  return state;
}

/**
 * Thin served-markup renderer for the `lyraToasts` singleton queue.
 *
 * ```html
 * <div class="lyra-toast-stack" x-data="lyraToastStack()">
 *   <template x-for="toast in toasts" :key="toast.id">
 *     <div class="lyra-toast" role="status">
 *       <span class="lyra-toast__icon" :class="toneClass(toast.tone)">
 *         <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *           x-show="toast.tone === 'success'"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
 *         <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *           x-show="toast.tone === 'danger'"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
 *         <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *           x-show="toast.tone === 'info'"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
 *       </span>
 *       <span x-text="toast.message"></span>
 *       <button class="lyra-toast__close" :data-toast-id="toast.id" x-bind="closeButton">×</button>
 *     </div>
 *   </template>
 * </div>
 * ```
 *
 * The three inlined Lucide icon variants avoid importing React's 79-icon registry; `x-show`
 * selects the matching one. Unlike React's `ReactNode` messages, store messages render with
 * `x-text`, never `x-html`, because the queue can be fed by window events and Livewire payloads.
 * Rich content remains possible through a statically served toast outside this queue.
 */
export function lyraToastStack(): LyraToastStackData {
  const state: LyraToastStackData & ThisType<LyraToastStackState> = {
    get toasts() {
      return this.$store.lyraToasts.items;
    },

    get closeLabel() {
      return this.$store.lyraToasts.closeLabel;
    },

    toneClass(tone) {
      return `lyra-toast__icon--${tone}`;
    },

    closeButton: {
      type: 'button',
      [':aria-label']() {
        return this.closeLabel;
      },
      ['@click']() {
        const id = Number(this.$el.dataset.toastId);
        if (Number.isFinite(id)) this.$store.lyraToasts.dismiss(id);
      },
    },
  };

  return state;
}
