import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Alert } from './index';
afterEach(cleanup);
describe('Alert', () => {
  for (const theme of ['light', 'dark'])
    for (const tone of ['info', 'success', 'warning', 'danger'] as const)
      it(`${tone} in ${theme}`, async () => {
        document.documentElement.toggleAttribute('data-theme', theme === 'dark');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await render(
          <Alert tone={tone} title="Notice">
            Message
          </Alert>,
        );
        expect(container.querySelector('[role=status]')!.className).toBe(
          `lyra-alert lyra-alert--${tone}`,
        );
        expect(error).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
        error.mockRestore();
      });
});
