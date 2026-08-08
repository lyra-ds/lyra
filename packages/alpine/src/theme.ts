/** The theme a consumer chooses. `"system"` follows the OS setting. */
export type Theme = 'light' | 'dark' | 'system';

/** The theme actually applied to the document. */
export type ResolvedTheme = 'light' | 'dark';

export interface LyraThemeStore {
  /** The chosen theme, which may be `"system"`. */
  theme: Theme;
  /** The actual theme applied to `<html data-theme>`. */
  resolvedTheme: ResolvedTheme;
  /** Convenience for `resolvedTheme === "dark"`. */
  readonly dark: boolean;
  /** Initializes browser state after Alpine registers this singleton store. */
  init(): void;
  /** Chooses a theme, persists it, and applies it to the document. */
  setTheme(next: Theme): void;
  /** Flips from the theme currently applied to the document. */
  toggle(): void;
}

const STORAGE_KEY = 'lyra-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const DEFAULT_THEME: Theme = 'system';

function readStored(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null;
  } catch {
    return null;
  }
}

function resolveTheme(theme: Theme, systemDark: boolean): ResolvedTheme {
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}

/**
 * The singleton `Alpine.store('theme', ...)` state machine.
 *
 * IT DOES NOT PREVENT THE FIRST-PAINT FLASH, and cannot: Alpine runs after the document has
 * already painted. Preventing it requires a blocking inline script in `<head>` that sets the
 * attribute before first paint, reading the SAME `lyra-theme` key:
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
 * flash it exists to prevent. This store then reads what the script applied and takes over.
 */
export function lyraTheme(): LyraThemeStore {
  const state: LyraThemeStore & ThisType<LyraThemeStore> = {
    theme: DEFAULT_THEME,
    resolvedTheme: 'light',

    get dark() {
      return this.resolvedTheme === 'dark';
    },

    init() {
      const media = window.matchMedia(DARK_QUERY);
      this.theme = readStored() ?? DEFAULT_THEME;
      this.resolvedTheme = resolveTheme(this.theme, media.matches);
      document.documentElement.dataset.theme = this.resolvedTheme;

      media.addEventListener('change', (event) => {
        if (this.theme === 'system') {
          this.resolvedTheme = resolveTheme(this.theme, event.matches);
          document.documentElement.dataset.theme = this.resolvedTheme;
        }
      });

      window.addEventListener('storage', () => {
        this.theme = readStored() ?? DEFAULT_THEME;
        this.resolvedTheme = resolveTheme(this.theme, media.matches);
        document.documentElement.dataset.theme = this.resolvedTheme;
      });
    },

    setTheme(next) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage can be unavailable; the theme still applies for this page view.
      }
      this.theme = next;
      this.resolvedTheme = resolveTheme(this.theme, window.matchMedia(DARK_QUERY).matches);
      document.documentElement.dataset.theme = this.resolvedTheme;
    },

    toggle() {
      this.setTheme(this.resolvedTheme === 'dark' ? 'light' : 'dark');
    },
  };

  return state;
}
