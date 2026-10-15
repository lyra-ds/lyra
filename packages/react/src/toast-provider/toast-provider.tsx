import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { Toast, ToastStack } from '../toast';
import { isEligibleReturnFocusTarget } from '../internal/use-return-focus';

/** Configuration for a notification added through {@link useToast}. */
export interface ToastOptions {
  /** Visual tone and its default icon. Default: `"info"`. */
  tone?: 'info' | 'success' | 'danger';
  /** Content that replaces the default tone icon. */
  icon?: ReactNode;
  /** Overrides the configured or tone-based delay. `0` persists; use it for action-bearing content. */
  duration?: number;
}

/** Imperative notification methods returned by {@link useToast}. */
export interface ToastApi {
  /** Add an informational notification and return its provider-local identifier. */
  toast: (message: ReactNode, options?: ToastOptions) => number;
  /** Add a success notification and return its provider-local identifier. */
  success: (message: ReactNode, options?: ToastOptions) => number;
  /** Add a danger notification and return its provider-local identifier. */
  error: (message: ReactNode, options?: ToastOptions) => number;
  /** Add an informational notification and return its provider-local identifier. */
  info: (message: ReactNode, options?: ToastOptions) => number;
  /** Remove a notification before its auto-dismiss timer expires. */
  dismiss: (id: number) => void;
}

/** Props for {@link ToastProvider}. */
export interface ToastProviderProps {
  /** Explicit delay for new notifications, overriding tone defaults. Omitted: info/success `8000`, danger `0`. Interaction pauses remaining time; `0` persists. */
  duration?: number;
  /** Accessible name of the owned notification region. Use distinct names for coexisting providers. Default: `"Notifications"`. */
  'aria-label'?: string;
  /** Accessible name passed to every composed Toast close button. Default: `"Close notification"`. */
  closeLabel?: string;
  children: ReactNode;
}

interface QueuedToast {
  id: number;
  message: ReactNode;
  tone: NonNullable<ToastOptions['tone']>;
  icon: ReactNode | undefined;
}

interface Lifetime {
  remaining: number;
  deadline: number;
  timer?: ReturnType<typeof setTimeout>;
  claims: Set<'pointer' | 'focus'>;
  opener: HTMLElement | null;
  row: HTMLDivElement | null;
}

function stopTimer(record: Lifetime) {
  if (record.timer === undefined) return;
  clearTimeout(record.timer);
  record.timer = undefined;
  record.remaining = Math.max(0, record.deadline - Date.now());
}

function restoreFocus(opener: HTMLElement | null, stack: HTMLElement): HTMLElement {
  const doc = stack.ownerDocument;
  if (
    !opener?.closest('.lyra-toast-stack') &&
    isEligibleReturnFocusTarget(opener, doc, stack, null)
  ) {
    opener.focus({ preventScroll: true });
    if (doc.activeElement === opener) return opener;
  }
  stack.focus({ preventScroll: true });
  return stack;
}

const ToastContext = createContext<ToastApi | null>(null);
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function ToneIcon({ tone }: { tone: QueuedToast['tone'] }) {
  // Lucide's circle-check, circle-alert, and info paths are deliberately inlined here. Importing
  // Icon would pull the 79-icon registry into every ToastProvider consumer.
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      {tone === 'success' && <path d="m9 12 2 2 4-4" />}
      {tone === 'danger' && (
        <>
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </>
      )}
      {tone === 'info' && (
        <>
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </>
      )}
    </svg>
  );
}

/**
 * Owns a stack of transient notifications and exposes an imperative API to its descendants.
 *
 * The provider composes the presentational {@link ToastStack} and {@link Toast} primitives; it
 * does not add presentation or depend on browser APIs during server rendering.
 */
export function ToastProvider({
  duration,
  'aria-label': regionLabel = 'Notifications',
  closeLabel = 'Close notification',
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const nextId = useRef(0);
  const unmounted = useRef(false);
  const records = useRef(new Map<number, Lifetime>());
  const stackRef = useRef<HTMLDivElement>(null);
  const configuredDuration = useRef(duration);
  const replayDismissals = useRef(new Set<number>());
  const focusIntent = useRef<{ opener: HTMLElement | null; target: HTMLElement } | null>(null);

  useIsomorphicLayoutEffect(() => {
    configuredDuration.current = duration;
  }, [duration]);

  const dismiss = useCallback((id: number) => {
    const record = records.current.get(id);
    if (!record) return;
    records.current.delete(id);
    stopTimer(record);
    if (unmounted.current) {
      // Child effect cleanup may dismiss during StrictMode's layout cleanup/setup gap.
      replayDismissals.current.add(id);
      return;
    }
    const stack = stackRef.current;
    if (stack && record.row?.contains(stack.ownerDocument.activeElement)) {
      focusIntent.current = { opener: record.opener, target: restoreFocus(record.opener, stack) };
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, record: Lifetime) => {
      if (
        unmounted.current ||
        record.timer !== undefined ||
        record.claims.size ||
        record.remaining < 0
      )
        return;
      record.deadline = Date.now() + record.remaining;
      const timer = setTimeout(() => {
        if (records.current.get(id) === record && record.timer === timer) dismiss(id);
      }, record.remaining);
      record.timer = timer;
    },
    [dismiss],
  );

  const claim = useCallback(
    (id: number, reason: 'pointer' | 'focus', paused: boolean) => {
      const record = records.current.get(id);
      if (!record || unmounted.current || record.claims.has(reason) === paused) return;
      if (paused) {
        stopTimer(record);
        record.claims.add(reason);
      } else {
        record.claims.delete(reason);
        schedule(id, record);
      }
    },
    [schedule],
  );

  const push = useCallback(
    (message: ReactNode, options: ToastOptions = {}): number => {
      const id = ++nextId.current;
      if (unmounted.current || typeof document === 'undefined') return id;
      const tone = options.tone ?? 'info';
      const timeout =
        options.duration ?? configuredDuration.current ?? (tone === 'danger' ? 0 : 8000);
      // Child layout effects can enqueue before the stack ref attaches.
      const ownerDocument = stackRef.current?.ownerDocument ?? document;
      const active = ownerDocument.activeElement;
      const elementConstructor = ownerDocument.defaultView?.HTMLElement;
      const record: Lifetime = {
        remaining: timeout > 0 ? timeout : -1,
        deadline: 0,
        claims: new Set(),
        opener: elementConstructor && active instanceof elementConstructor ? active : null,
        row: null,
      };
      records.current.set(id, record);
      setToasts((current) => [...current, { id, message, tone, icon: options.icon }]);
      schedule(id, record);
      return id;
    },
    [schedule],
  );

  // Layout setup precedes replayed child passive effects. Cleanup preserves elapsed time and
  // claims for replay, while retained methods cannot schedule work after real unmount.
  useIsomorphicLayoutEffect(() => {
    unmounted.current = false;
    const pending = records.current;
    if (replayDismissals.current.size) {
      const dismissed = new Set(replayDismissals.current);
      replayDismissals.current.clear();
      setToasts((current) => current.filter((toast) => !dismissed.has(toast.id)));
    }
    for (const [id, record] of pending) schedule(id, record);
    const stack = stackRef.current;
    const observer = new MutationObserver(() => {
      // Removing or disabling a focused descendant need not emit blur.
      for (const [id, record] of pending) {
        if (
          record.claims.has('focus') &&
          !record.row?.contains(stack?.ownerDocument.activeElement ?? null)
        )
          claim(id, 'focus', false);
      }
    });
    if (stack) observer.observe(stack, { subtree: true, childList: true, attributes: true });
    return () => {
      unmounted.current = true;
      focusIntent.current = null;
      observer.disconnect();
      for (const record of pending.values()) stopTimer(record);
      queueMicrotask(() => {
        if (unmounted.current) {
          pending.clear();
          replayDismissals.current.clear();
        }
      });
    };
  }, [claim, schedule]);

  useIsomorphicLayoutEffect(() => {
    const intent = focusIntent.current;
    const stack = stackRef.current;
    focusIntent.current = null;
    if (!intent || !stack) return;
    const active = stack.ownerDocument.activeElement;
    // An action may remove the opener in this commit or deliberately move focus elsewhere.
    if (active === intent.target || active === stack.ownerDocument.body)
      restoreFocus(intent.opener, stack);
  });

  const api = useMemo<ToastApi>(
    () => ({
      toast: push,
      success: (message, options) => push(message, { ...options, tone: 'success' }),
      error: (message, options) => push(message, { ...options, tone: 'danger' }),
      info: (message, options) => push(message, { ...options, tone: 'info' }),
      dismiss,
    }),
    [dismiss, push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* The stack itself is not live: two persistent regions (mounted before any toast) split the
          announcements by urgency. display:contents keeps the visual stacking unchanged. */}
      <ToastStack
        ref={stackRef}
        tabIndex={-1}
        role="region"
        aria-label={regionLabel}
        aria-live={undefined}
        aria-relevant={undefined}
      >
        {(['polite', 'assertive'] as const).map((politeness) => (
          <div
            key={politeness}
            data-lyra-toast-region={politeness}
            aria-live={politeness}
            aria-relevant="additions"
            style={{ display: 'contents' }}
          >
            {toasts
              .filter((toast) => (toast.tone === 'danger') === (politeness === 'assertive'))
              .map((toast) => (
                <Toast
                  key={toast.id}
                  ref={(row) => {
                    const record = records.current.get(toast.id);
                    if (record) record.row = row;
                  }}
                  onPointerEnter={() => claim(toast.id, 'pointer', true)}
                  onPointerLeave={() => claim(toast.id, 'pointer', false)}
                  onFocus={() => claim(toast.id, 'focus', true)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      claim(toast.id, 'focus', false);
                  }}
                  tone={toast.tone}
                  icon={toast.icon !== undefined ? toast.icon : <ToneIcon tone={toast.tone} />}
                  closeLabel={closeLabel}
                  onClose={() => dismiss(toast.id)}
                >
                  {toast.message}
                </Toast>
              ))}
          </div>
        ))}
      </ToastStack>
    </ToastContext.Provider>
  );
}

/** Reads the notification API. Must be called inside a {@link ToastProvider}. */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be called inside a <ToastProvider>.');
  return context;
}
