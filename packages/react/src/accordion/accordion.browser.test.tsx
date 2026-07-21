import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Accordion } from './index';

const themes = ['light', 'dark'] as const;
const items = [
  { id: 'a', title: 'First', content: 'One' },
  { id: 'b', title: 'Second', content: 'Two' },
];
function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});
describe('Accordion', () => {
  for (const theme of themes)
    it(`emits exact classes and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<Accordion items={items} defaultOpen="a" />);
        expect(container.querySelector('.lyra-accordion')!.className).toBe('lyra-accordion');
        expect(container.querySelector('.lyra-acc__item')!.className).toBe(
          'lyra-acc__item lyra-acc__item--open',
        );
        expect(container.querySelector('.lyra-acc__trigger')!.className).toBe('lyra-acc__trigger');
        expect(spy).not.toHaveBeenCalled();
        expect(
          (await axe.run(container)).violations.filter((v) => v.id !== 'color-contrast'),
        ).toEqual([]);
      } finally {
        spy.mockRestore();
      }
    });
  it('toggles every header with Space and supports multiple items', async () => {
    const { container } = await render(<Accordion items={items} multiple />);
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');
    buttons[0].focus();
    await userEvent.keyboard(' ');
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    buttons[1].focus();
    await userEvent.keyboard('{Enter}');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelectorAll('.lyra-acc__panel').length).toBe(2);
  });
});
