import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

/** The theme a consumer chooses. `"system"` follows the OS setting. */
export type Theme = 'light' | 'dark' | 'system';

/** The theme actually applied to the document — `"system"` resolved to a real value. */
export type ResolvedTheme = 'light' | 'dark';

/** The value returned by {@link useTheme}. */
export interface ThemeApi {
  /** The chosen theme, which may be `"system"`. */
  theme: Theme;
  /** The theme actually on the document, with `"system"` already resolved. */
  resolvedTheme: ResolvedTheme;
  /** Convenience for `resolvedTheme === "dark"`. */
  dark: boolean;
  /** Choose a theme and persist it. */
  setTheme: (theme: Theme) => void;
  /** Flip between light and dark, starting from what is currently applied. */
  toggle: () => void;
}

/** Props for {@link ThemeProvider}. */
export interface ThemeProviderProps {
  /** Theme to use when nothing is stored yet. Default: `"system"`. */
  defaultTheme?: Theme;
  /** localStorage key holding the choice. Default: `"lyra-theme"`. */
  storageKey?: string;
  /** Sets `data-brand` on `<html>` for white-label theming. See the white-label guide. */
  brand?: string;
  children: ReactNode;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** `useLayoutEffect` warns when it runs on the server; the theme only ever applies in a browser. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Same-tab change notifier. `storage` only fires in OTHER tabs, so a write here has to tell its
 * own document; the listener set covers that and the `storage` handler covers cross-tab sync.
 */
const listeners = new Set<() => void>();
const notify = (): void => {
  for (const listener of listeners) listener();
};

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const media = window.matchMedia(DARK_QUERY);
  window.addEventListener('storage', onChange);
  media.addEventListener('change', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
    media.removeEventListener('change', onChange);
  };
}

function readStored(storageKey: string): Theme | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
  } catch {
    // Private mode and blocked-storage settings throw on access rather than returning null.
    return null;
  }
}

/**
 * One string holds both halves of the state — the chosen theme and what the OS currently
 * prefers — because `useSyncExternalStore` compares snapshots by identity. Returning an object
 * would allocate a new one per call and re-render forever.
 */
function snapshot(storageKey: string, defaultTheme: Theme): string {
  const chosen = readStored(storageKey) ?? defaultTheme;
  const systemDark = window.matchMedia(DARK_QUERY).matches;
  return `${chosen}:${systemDark ? 'dark' : 'light'}`;
}

const ThemeContext = createContext<ThemeApi | null>(null);

/**
 * Applies the chosen theme to `<html data-theme>` and persists it.
 *
 * IT DOES NOT PREVENT THE FIRST-PAINT FLASH, and cannot: React runs after the document has
 * already painted. Preventing it requires a blocking inline script in `<head>` that sets the
 * attribute before first paint, reading the SAME `storageKey`:
 *
 * ```html
 * <script>
 *   (function () {
 *     try {
 *       var s = localStorage.getItem('lyra-theme');
 *       var d = matchMedia('(prefers-color-scheme: dark)').matches;
 *       document.documentElement.dataset.theme = s === 'light' || s === 'dark' ? s : d ? 'dark' : 'light';
 *     } catch (e) {}
 *   })();
 * </script>
 * ```
 *
 * It has to be inline and blocking — anything deferred runs after the first paint, which is the
 * flash it exists to prevent. This provider then reads what the script applied and takes over.
 * The snippet is not shipped as an exported helper because every module in this package carries
 * the `"use client"` directive, so a server component could not call it (see WORK.md).
 *
 * Server-render safety: the server snapshot is always `defaultTheme`, and no browser API is
 * touched during render on either side, so the first client render matches the server HTML.
 * The real stored value arrives through the store subscription, after hydration.
 */
export function ThemeProvider({
  defaultTheme = 'system',
  storageKey = 'lyra-theme',
  brand,
  children,
}: ThemeProviderProps) {
  const getSnapshot = useCallback(
    () => snapshot(storageKey, defaultTheme),
    [storageKey, defaultTheme],
  );
  // On the server (and the hydration render) nothing is known yet: report the default, unresolved.
  const getServerSnapshot = useCallback(() => `${defaultTheme}:light`, [defaultTheme]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [chosen, systemResolved] = state.split(':') as [Theme, ResolvedTheme];
  const resolvedTheme: ResolvedTheme = chosen === 'system' ? systemResolved : chosen;

  const setTheme = useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Storage can be unavailable; the attribute below still applies for this page view.
      }
      notify();
    },
    [storageKey],
  );

  // The attribute is written AFTER commit, never during render: a render can be thrown away under
  // concurrent rendering, and applying a theme that was never committed would leave the document
  // showing something React does not believe. Layout-effect timing (not useEffect) so a toggle
  // repaints once in the new theme instead of flashing the old one for a frame; it falls back to
  // useEffect on the server, where useLayoutEffect warns and there is no paint to beat anyway.
  useIsomorphicLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useIsomorphicLayoutEffect(() => {
    if (brand) document.documentElement.dataset.brand = brand;
  }, [brand]);

  const value = useMemo<ThemeApi>(
    () => ({
      theme: chosen,
      resolvedTheme,
      dark: resolvedTheme === 'dark',
      setTheme,
      toggle: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    }),
    [chosen, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Reads the current theme. Must be called inside a {@link ThemeProvider}.
 *
 * Exported as a normal hook. The handoff prototype also hangs it off
 * `ThemeProvider.useTheme`; that was a limitation of its preview bundle and is not reproduced.
 */
export function useTheme(): ThemeApi {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be called inside a <ThemeProvider>.');
  return context;
}
