import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Card } from './index';
afterEach(cleanup);
describe('Card', () => {
  for (const theme of ['light', 'dark'])
    it(`anatomy in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = await render(
        <Card title="Title" footer="Footer" interactive>
          Body
        </Card>,
      );
      expect(container.querySelector('div')!.className).toBe('lyra-card lyra-card--interactive');
      expect(error).not.toHaveBeenCalled();
      expect((await axe.run(container)).violations).toEqual([]);
      error.mockRestore();
    });
});
