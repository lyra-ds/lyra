import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Checkbox } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Checkbox', () => {
  for (const theme of THEMES) {
    it(`emits its exact class and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<Checkbox label="Accept terms" />);
        expect(container.querySelector('input')!.className).toBe('lyra-checkbox');
        const wrapper = container.querySelector('label')!;
        expect(wrapper.className).toBe('lyra-check-row');
        expect(wrapper.querySelector('span')!.textContent).toBe('Accept terms');
        expect(errorSpy).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('toggles via Space and forwards the native change event', async () => {
    const onChange = vi.fn();
    const screen = await render(<Checkbox label="Accept terms" onChange={onChange} />);
    const input = screen.container.querySelector('input')! as HTMLInputElement;
    input.focus();
    await userEvent.keyboard(' ');
    expect(input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('renders a bare input without a label and forwards an id', async () => {
    const screen = await render(<Checkbox id="terms" />);
    const input = screen.container.firstElementChild! as HTMLInputElement;

    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBe('terms');
  });

  it.each(['label text', 'wrapper'] as const)('toggles when its %s is clicked', async (target) => {
    const screen = await render(<Checkbox label="Accept terms" />);
    const input = screen.container.querySelector('input')! as HTMLInputElement;
    const wrapper = screen.container.querySelector('label')!;
    const clickTarget = target === 'label text' ? wrapper.querySelector('span')! : wrapper;

    await userEvent.click(clickTarget);

    expect(input.checked).toBe(true);
  });
});
