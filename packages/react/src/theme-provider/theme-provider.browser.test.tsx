import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { ThemeProvider, useTheme } from './index';

const KEY = 'lyra-theme-test';

function Probe() {
  const { theme, resolvedTheme, dark, setTheme, toggle } = useTheme();
  return (
    <div>
      <span data-testid="state">{`${theme}/${resolvedTheme}/${dark}`}</span>
      <button type="button" onClick={toggle}>
        toggle
      </button>
      <button type="button" onClick={() => setTheme('system')}>
        system
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        dark
      </button>
    </div>
  );
}

const state = (c: HTMLElement) => c.querySelector('[data-testid="state"]')!.textContent;
const click = (c: HTMLElement, label: string) =>
  c.querySelector<HTMLButtonElement>(`button:nth-of-type(${label})`);

beforeEach(() => {
  localStorage.removeItem(KEY);
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-brand');
});
afterEach(cleanup);

describe('ThemeProvider', () => {
  it('applies the resolved theme to <html> and persists a choice', async () => {
    const { container } = await render(
      <ThemeProvider storageKey={KEY} defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(state(container)).toBe('light/light/false');
    expect(document.documentElement.dataset.theme).toBe('light');

    click(container, '1')!.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(KEY)).toBe('dark');
  });

  it('reads an already-stored choice instead of the default', async () => {
    localStorage.setItem(KEY, 'dark');
    const { container } = await render(
      <ThemeProvider storageKey={KEY} defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(state(container)).toBe('dark/dark/true');
  });

  it('keeps "system" as the choice while reporting a resolved value', async () => {
    const { container } = await render(
      <ThemeProvider storageKey={KEY} defaultTheme="system">
        <Probe />
      </ThemeProvider>,
    );
    const [theme, resolved] = state(container)!.split('/');
    expect(theme).toBe('system');
    // Whatever the runner's OS preference is, the resolved value must be a real theme — the
    // handoff version had no "system" at all and would have applied the literal string.
    expect(['light', 'dark']).toContain(resolved);
    expect(document.documentElement.dataset.theme).toBe(resolved);
  });

  it('toggle flips from what is applied, not from the stored word "system"', async () => {
    const { container } = await render(
      <ThemeProvider storageKey={KEY} defaultTheme="system">
        <Probe />
      </ThemeProvider>,
    );
    const resolved = state(container)!.split('/')[1];
    click(container, '1')!.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(localStorage.getItem(KEY)).toBe(resolved === 'dark' ? 'light' : 'dark');
  });

  it('sets data-brand when a brand is given', async () => {
    await render(
      <ThemeProvider storageKey={KEY} brand="acme">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.brand).toBe('acme');
  });

  it('survives storage that throws instead of returning null', async () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('blocked');
    };
    try {
      const { container } = await render(
        <ThemeProvider storageKey={KEY} defaultTheme="dark">
          <Probe />
        </ThemeProvider>,
      );
      expect(state(container)).toBe('dark/dark/true');
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('useTheme outside a provider fails loudly instead of returning a silent default', async () => {
    await expect(render(<Probe />)).rejects.toThrow(/ThemeProvider/);
  });
});
