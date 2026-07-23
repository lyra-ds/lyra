import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Switch } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Switch', () => {
  for (const theme of THEMES) {
    it(`emits its exact classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<Switch label="Email alerts" />);
        const wrapper = container.querySelector('label.lyra-switch')!;
        expect(wrapper.className).toBe('lyra-switch');
        expect(container.querySelector('.lyra-switch__track')!.className).toBe(
          'lyra-switch__track',
        );
        expect(wrapper.querySelector('span:not(.lyra-switch__track)')!.textContent).toBe(
          'Email alerts',
        );
        expect(errorSpy).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('toggles via Space and forwards the native change event', async () => {
    const onChange = vi.fn();
    const screen = await render(<Switch label="Email alerts" onChange={onChange} />);
    const input = screen.container.querySelector('input')! as HTMLInputElement;
    input.focus();
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it.each(['label text', 'wrapper'] as const)('toggles when its %s is clicked', async (target) => {
    const screen = await render(<Switch label="Email alerts" />);
    const input = screen.container.querySelector('input')! as HTMLInputElement;
    const wrapper = screen.container.querySelector('label.lyra-switch')!;
    const clickTarget =
      target === 'label text' ? wrapper.querySelector('span:not(.lyra-switch__track)')! : wrapper;

    await userEvent.click(clickTarget);

    expect(input.checked).toBe(true);
  });
});
