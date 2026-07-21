import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Skeleton } from './index';
afterEach(cleanup);
describe('Skeleton', () => {
  for (const theme of ['light', 'dark'])
    it(`circle in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = await render(<Skeleton circle height={24} />);
      expect(container.querySelector('span')!.className).toBe(
        'lyra-skeleton lyra-skeleton--circle',
      );
      expect(error).not.toHaveBeenCalled();
      expect((await axe.run(container)).violations).toEqual([]);
      error.mockRestore();
    });
});
