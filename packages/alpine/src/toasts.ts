import { isEligibleReturnFocusTarget } from './internal/return-focus';

/** A visual tone supported by a queued notification. */
export type ToastTone = 'info' | 'success' | 'danger';

/** Configuration accepted by {@link LyraToastsStore.toast}. */
export interface LyraToastOptions {
  /** Visual tone and its default icon. Default: `"info"`. */
  tone?: ToastTone;
  /** Overrides the configured or tone-based delay. `0` disables auto-dismiss for this notification. */
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
  /** Reads `8000` initially; every assignment explicitly overrides tone defaults for new notifications. Otherwise danger persists and info/success last `8000` ms. Interaction pauses remaining time. */
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
  /** The singleton queue, in the order notifications were added. */
  readonly toasts: QueuedToast[];
  /** Non-danger toasts, rendered inside the persistent `aria-live="polite"` region. */
  readonly politeToasts: QueuedToast[];
  /** Danger toasts, rendered inside the persistent `aria-live="assertive"` region. */
  readonly assertiveToasts: QueuedToast[];
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

interface ToastLifetime {
  remaining: number;
  deadline: number;
  timer?: ReturnType<typeof setTimeout>;
  claims: Set<symbol>;
  opener: Element | null;
}

interface RendererOwnership {
  roots: Set<HTMLElement>;
  claim(id: number, reason: symbol, paused: boolean): void;
  release(reason: symbol): void;
}

const ownership = new WeakMap<LyraToastsStore, RendererOwnership>();

function rowId(row: Element): number {
  return Number(row.querySelector<HTMLElement>('[data-toast-id]')?.dataset.toastId);
}

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
  const records = new Map<number, ToastLifetime>();
  const roots = new Set<HTMLElement>();
  let configuredDuration: number | undefined;

  function stop(record: ToastLifetime) {
    if (record.timer === undefined) return;
    clearTimeout(record.timer);
    record.timer = undefined;
    record.remaining = Math.max(0, record.deadline - Date.now());
  }

  function schedule(id: number, record: ToastLifetime) {
    if (record.timer !== undefined || record.claims.size || record.remaining < 0) return;
    record.deadline = Date.now() + record.remaining;
    const timer = setTimeout(() => {
      if (records.get(id) === record && record.timer === timer) store.dismiss(id);
    }, record.remaining);
    record.timer = timer;
  }

  const owner: RendererOwnership = {
    roots,
    claim(id, reason, paused) {
      const record = records.get(id);
      if (!record || record.claims.has(reason) === paused) return;
      if (paused) {
        stop(record);
        record.claims.add(reason);
      } else {
        record.claims.delete(reason);
        schedule(id, record);
      }
    },
    release(reason) {
      for (const [id] of records) owner.claim(id, reason, false);
    },
  };
  let store: LyraToastsStore;
  const state: LyraToastsStore & ThisType<LyraToastsStore> = {
    items: [],
    get duration() {
      return configuredDuration ?? 8000;
    },
    set duration(value: number) {
      configuredDuration = value;
    },
    closeLabel: 'Close notification',

    init() {
      store = this;
      ownership.set(this, owner);
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

      const timeout =
        options.duration ?? configuredDuration ?? (toast.tone === 'danger' ? 0 : 8000);
      const record: ToastLifetime = {
        remaining: timeout > 0 ? timeout : -1,
        deadline: 0,
        claims: new Set(),
        opener: typeof document === 'undefined' ? null : document.activeElement,
      };
      records.set(id, record);
      schedule(id, record);
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
      const record = records.get(id);
      if (!record && !this.items.some((toast) => toast.id === id)) return;
      records.delete(id);
      if (record) stop(record);
      for (const root of roots) {
        const doc = root.ownerDocument;
        const row = doc.activeElement?.closest('.lyra-toast');
        if (!row || !root.contains(row) || rowId(row) !== id) continue;
        const opener = record?.opener ?? null;
        if (
          !opener?.closest('.lyra-toast-stack') &&
          isEligibleReturnFocusTarget(opener, doc, root, null)
        ) {
          opener.focus({ preventScroll: true });
          if (doc.activeElement === opener) break;
        }
        root.focus({ preventScroll: true });
        break;
      }
      this.items = this.items.filter((toast) => toast.id !== id);
    },
  };
  store = state;
  ownership.set(state, owner);

  return state;
}

/**
 * Thin served-markup renderer for the `lyraToasts` singleton queue.
 *
 * ```html
 * <div class="lyra-toast-stack" x-data="lyraToastStack()">
 *   <div data-lyra-toast-region="polite" aria-live="polite" aria-relevant="additions" style="display: contents">
 *      <template x-for="toast in politeToasts" :key="toast.id">
 *        <div class="lyra-toast">
 *          <span class="lyra-toast__icon" :class="toneClass(toast.tone)">
 *            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *              x-show="toast.tone === 'success'"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
 *            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *              x-show="toast.tone === 'danger'"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
 *            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *              x-show="toast.tone === 'info'"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
 *          </span>
 *          <span x-text="toast.message"></span>
 *          <button class="lyra-toast__close" :data-toast-id="toast.id" x-bind="closeButton">×</button>
 *        </div>
 *      </template>
 *   </div>
 *   <div data-lyra-toast-region="assertive" aria-live="assertive" aria-relevant="additions" style="display: contents">
 *      <template x-for="toast in assertiveToasts" :key="toast.id">
 *        <div class="lyra-toast">
 *          <span class="lyra-toast__icon" :class="toneClass(toast.tone)">
 *            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *              x-show="toast.tone === 'success'"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
 *            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *              x-show="toast.tone === 'danger'"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
 *            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
 *              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
 *              x-show="toast.tone === 'info'"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
 *          </span>
 *          <span x-text="toast.message"></span>
 *          <button class="lyra-toast__close" :data-toast-id="toast.id" x-bind="closeButton">×</button>
 *        </div>
 *      </template>
 *   </div>
 * </div>
 * ```
 *
 * The stack is deliberately not live: the two persistent regions exist before any toast, so
 * assistive tech registers them and announces each addition (danger toasts assertively). Rows carry
 * no `role` of their own, and `display: contents` keeps the visual stacking unchanged.
 *
 * The three inlined Lucide icon variants avoid importing React's 79-icon registry; `x-show`
 * selects the matching one. Unlike React's `ReactNode` messages, store messages render with
 * `x-text`, never `x-html`, because the queue can be fed by window events and Livewire payloads.
 * Rich content remains possible through a statically served toast outside this queue.
 */
export function lyraToastStack(): LyraToastStackData {
  let cleanup: (() => void) | undefined;
  const state: LyraToastStackData & {
    init(): void;
    destroy(): void;
  } & ThisType<LyraToastStackState> = {
    init() {
      const root = this.$el;
      const owner = ownership.get(this.$store.lyraToasts);
      if (!owner) return;
      root.tabIndex = -1;
      root.setAttribute('role', 'region');
      if (!root.hasAttribute('aria-label') && !root.hasAttribute('aria-labelledby'))
        root.setAttribute('aria-label', 'Notifications');
      owner.roots.add(root);
      const pointer = Symbol();
      const focus = Symbol();
      let focusedId: number | undefined;
      const observer = new MutationObserver(() => {
        const row = root.ownerDocument.activeElement?.closest('.lyra-toast');
        if (focusedId !== undefined && (!row || !root.contains(row) || rowId(row) !== focusedId)) {
          owner.claim(focusedId, focus, false);
          focusedId = undefined;
        }
      });
      observer.observe(root, { subtree: true, childList: true, attributes: true });
      const interaction = (event: Event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const row = target.closest('.lyra-toast');
        if (!row || !root.contains(row)) return;
        const related =
          event instanceof FocusEvent || event instanceof MouseEvent ? event.relatedTarget : null;
        if (related instanceof Node && row.contains(related)) return;
        const reason = event.type.startsWith('pointer') ? pointer : focus;
        const id = rowId(row);
        const entering = event.type === 'pointerover' || event.type === 'focusin';
        if (reason === focus) {
          if (entering) {
            if (focusedId !== undefined && focusedId !== id) owner.claim(focusedId, focus, false);
            focusedId = id;
          } else if (focusedId === id) focusedId = undefined;
        }
        owner.claim(id, reason, entering);
      };
      const events = ['pointerover', 'pointerout', 'focusin', 'focusout'];
      for (const event of events) root.addEventListener(event, interaction);
      cleanup = () => {
        observer.disconnect();
        for (const event of events) root.removeEventListener(event, interaction);
        owner.roots.delete(root);
        owner.release(pointer);
        owner.release(focus);
      };
    },

    destroy() {
      cleanup?.();
      cleanup = undefined;
    },
    get toasts() {
      return this.$store.lyraToasts.items;
    },

    get politeToasts() {
      return this.toasts.filter((toast) => toast.tone !== 'danger');
    },

    get assertiveToasts() {
      return this.toasts.filter((toast) => toast.tone === 'danger');
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
