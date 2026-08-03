import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Separator } from './index';

const THEMES = ['light', 'dark'] as const;
function setTheme(theme: (typeof THEMES)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('Separator', () => {
  for (const theme of THEMES) {
    it(`renders all separator variants and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const { container } = await render(
        <>
          <Separator />
          <Separator orientation="vertical" aria-label="Toolbar sections" />
          <Separator label="or" />
        </>,
      );

      const horizontal = container.querySelector('hr')!;
      expect(horizontal.className).toBe('lyra-separator');
      const vertical = container.querySelector<HTMLElement>('.lyra-separator--vertical')!;
      expect(vertical.className).toBe('lyra-separator lyra-separator--vertical');
      expect(vertical.getAttribute('aria-orientation')).toBe('vertical');
      const labelled = container.querySelector<HTMLElement>('.lyra-separator--label')!;
      expect(labelled.className).toBe('lyra-separator--label');
      await expect.element(labelled).toBeInTheDocument();
      expect((await axe.run(container)).violations).toEqual([]);
    });
  }
});
