import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import lyra from './index';

const STORAGE_KEY = 'lyra-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const mountedHosts: HTMLElement[] = [];

function registerThemeStore() {
  Alpine.plugin(lyra);
  return Alpine.store('theme') as {
    theme: 'light' | 'dark' | 'system';
    readonly resolvedTheme: 'light' | 'dark';
    readonly dark: boolean;
    setTheme(next: 'light' | 'dark' | 'system'): void;
    toggle(): void;
  };
}

function resolvedSystemTheme(): 'light' | 'dark' {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function mountProbe(): HTMLSpanElement {
  const host = document.createElement('div');
  host.innerHTML =
    '<div x-data><span data-testid="resolved" x-text="$store.theme.resolvedTheme"></span></div>';
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);

  const probe = host.querySelector<HTMLSpanElement>('[data-testid="resolved"]');
  if (!probe) throw new Error('Expected reactive theme probe');
  return probe;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
}

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY);
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  localStorage.removeItem(STORAGE_KEY);
  delete document.documentElement.dataset.theme;
});

describe('theme store', () => {
  it('resolves a fresh system choice from the browser media query and writes it to html', () => {
    const theme = registerThemeStore();
    const expected = resolvedSystemTheme();

    expect(theme.theme).toBe('system');
    expect(theme.resolvedTheme).toBe(expected);
    expect(document.documentElement.dataset.theme).toBe(expected);
  });

  it.each(['dark', 'light'] as const)(
    'uses stored %s instead of the system preference',
    (storedTheme) => {
      localStorage.setItem(STORAGE_KEY, storedTheme);
      const theme = registerThemeStore();

      expect(theme.theme).toBe(storedTheme);
      expect(theme.resolvedTheme).toBe(storedTheme);
      expect(document.documentElement.dataset.theme).toBe(storedTheme);
    },
  );

  it('persists an explicit choice and updates the resolved convenience values', () => {
    const theme = registerThemeStore();

    theme.setTheme('dark');

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(theme.theme).toBe('dark');
    expect(theme.resolvedTheme).toBe('dark');
    expect(theme.dark).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('applies a choice when localStorage rejects the persistence write', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('blocked');
    };
    try {
      const theme = registerThemeStore();

      theme.setTheme('dark');

      expect(theme.theme).toBe('dark');
      expect(theme.resolvedTheme).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it('toggles from the resolved system value into the opposite explicit choice', () => {
    const theme = registerThemeStore();
    const resolved = theme.resolvedTheme;

    theme.toggle();

    expect(theme.theme).toBe(resolved === 'dark' ? 'light' : 'dark');
    expect(theme.resolvedTheme).toBe(resolved === 'dark' ? 'light' : 'dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(resolved === 'dark' ? 'light' : 'dark');
  });

  it('falls back to system when storage contains an invalid value', () => {
    localStorage.setItem(STORAGE_KEY, 'sepia');
    const theme = registerThemeStore();
    const expected = resolvedSystemTheme();

    expect(theme.theme).toBe('system');
    expect(theme.resolvedTheme).toBe(expected);
    expect(document.documentElement.dataset.theme).toBe(expected);
  });

  it('falls back to system when localStorage cannot be read', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('blocked');
    };
    try {
      const theme = registerThemeStore();
      const expected = resolvedSystemTheme();

      expect(theme.theme).toBe('system');
      expect(theme.resolvedTheme).toBe(expected);
      expect(document.documentElement.dataset.theme).toBe(expected);
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('re-reads storage after a cross-tab storage event', () => {
    const theme = registerThemeStore();
    localStorage.setItem(STORAGE_KEY, 'light');

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: 'light',
        storageArea: localStorage,
      }),
    );

    expect(theme.theme).toBe('light');
    expect(theme.resolvedTheme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('updates x-text expressions that read the resolved theme', async () => {
    const theme = registerThemeStore();
    const probe = mountProbe();
    await flush();
    const next = theme.resolvedTheme === 'dark' ? 'light' : 'dark';

    theme.setTheme(next);
    await flush();

    expect(probe.textContent).toBe(next);
  });

  // OS-change coverage is omitted: Browser Mode exposes the real `matchMedia` result but cannot
  // change it, and replacing that browser boundary before the singleton registers is not faithful.
});
