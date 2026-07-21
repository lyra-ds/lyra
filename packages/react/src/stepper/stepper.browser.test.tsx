import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Stepper } from './index';
const themes = ['light', 'dark'] as const;
function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});
describe('Stepper', () => {
  for (const theme of themes)
    it(`emits states and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <Stepper steps={['Account', 'Profile', 'Done']} active={1} />,
        );
        const steps = container.querySelectorAll('.lyra-step');
        expect(container.querySelector('.lyra-stepper')!.className).toBe('lyra-stepper');
        expect(steps[0].className).toBe('lyra-step lyra-step--done');
        expect(steps[1].className).toBe('lyra-step lyra-step--active');
        expect(steps[1].getAttribute('aria-current')).toBe('step');
        expect(container.querySelector('.lyra-step__line--done')!.className).toBe(
          'lyra-step__line lyra-step__line--done',
        );
        expect(spy).not.toHaveBeenCalled();
        expect(
          (await axe.run(container)).violations.filter((v) => v.id !== 'color-contrast'),
        ).toEqual([]);
      } finally {
        spy.mockRestore();
      }
    });
});
