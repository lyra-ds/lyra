import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Radio } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Radio', () => {
  for (const theme of THEMES) {
    it(`emits its exact class and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<Radio label="Email" name="contact" />);
        expect(container.querySelector('input')!.className).toBe('lyra-radio');
        expect(errorSpy).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('toggles via Space and forwards the native change event', async () => {
    const onChange = vi.fn();
    const screen = await render(<Radio label="Email" name="contact" onChange={onChange} />);
    const input = screen.container.querySelector('input')! as HTMLInputElement;
    input.focus();
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();
  });
});
