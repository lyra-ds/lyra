import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { Toast, ToastStack } from '../toast';

/** Configuration for a notification added through {@link useToast}. */
export interface ToastOptions {
  /** Visual tone and its default icon. Default: `"info"`. */
  tone?: 'info' | 'success' | 'danger';
  /** Content that replaces the default tone icon. */
  icon?: ReactNode;
  /** Auto-dismiss delay in milliseconds. `0` disables auto-dismiss for this notification. */
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
  /** Default auto-dismiss delay in milliseconds. `0` disables auto-dismiss. Default: `4000`. */
  duration?: number;
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

const ToastContext = createContext<ToastApi | null>(null);

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
  duration = 4000,
  closeLabel = 'Close notification',
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const nextId = useRef(0);
  const unmounted = useRef(false);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: ReactNode, options: ToastOptions = {}): number => {
      const id = ++nextId.current;
      // A retained toast()/success() reference may fire after the provider
      // unmounted (promise continuations): pushing then would set state on an
      // unmounted tree and leave an uncleanable timer.
      if (unmounted.current) return id;
      const toast: QueuedToast = {
        id,
        message,
        tone: options.tone ?? 'info',
        icon: options.icon,
      };
      setToasts((current) => [...current, toast]);

      const timeout = options.duration ?? duration;
      if (timeout > 0)
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), timeout),
        );
      return id;
    },
    [dismiss, duration],
  );

  useEffect(
    () => () => {
      unmounted.current = true;
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
    },
    [],
  );

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
      <ToastStack>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            tone={toast.tone}
            icon={toast.icon !== undefined ? toast.icon : <ToneIcon tone={toast.tone} />}
            closeLabel={closeLabel}
            onClose={() => dismiss(toast.id)}
          >
            {toast.message}
          </Toast>
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
