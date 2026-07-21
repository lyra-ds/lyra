import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Textarea } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Textarea', () => {
  for (const theme of THEMES) {
    it(`emits its exact classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<Textarea label="Notes" hint="Optional" />);
        expect(container.querySelector('textarea')!.className).toBe('lyra-input lyra-textarea');
        expect(errorSpy).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('wires an error message and composes native onChange', async () => {
    const onChange = vi.fn();
    const { container } = await render(
      <Textarea label="Notes" error="Required" onChange={onChange} />,
    );
    const textarea = container.querySelector('textarea')!;
    const message = container.querySelector('.lyra-hint--error')!;
    expect(textarea.className).toBe('lyra-input lyra-textarea lyra-input--error');
    expect(textarea.getAttribute('aria-describedby')).toBe(message.id);
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    await userEvent.fill(textarea, 'Hello');
    expect(onChange).toHaveBeenCalledOnce();
  });
});
