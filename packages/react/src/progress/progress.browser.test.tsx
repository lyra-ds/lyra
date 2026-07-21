import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Progress } from './index';
afterEach(cleanup);
describe('Progress', () => {
  for (const theme of ['light', 'dark'])
    for (const tone of [undefined, 'success', 'danger'] as const)
      it(`${tone ?? 'default'} in ${theme}`, async () => {
        document.documentElement.toggleAttribute('data-theme', theme === 'dark');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await render(
          <Progress value={120} tone={tone} aria-label="Upload progress" />,
        );
        expect(container.querySelector('[role=progressbar]')!.className).toBe(
          tone ? `lyra-progress lyra-progress--${tone}` : 'lyra-progress',
        );
        expect(error).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
        error.mockRestore();
      });
});
