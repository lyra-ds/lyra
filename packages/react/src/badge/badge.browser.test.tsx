import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Badge } from './index';
afterEach(cleanup);
describe('Badge', () => {
  for (const theme of ['light', 'dark'])
    for (const tone of ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const)
      it(`${tone} in ${theme}`, async () => {
        document.documentElement.toggleAttribute('data-theme', theme === 'dark');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await render(
          <Badge tone={tone} dot>
            Status
          </Badge>,
        );
        expect(container.querySelector('span')!.className).toBe(`lyra-badge lyra-badge--${tone}`);
        expect(error).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
        error.mockRestore();
      });
});
