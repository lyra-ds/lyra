import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Avatar } from './index';
afterEach(cleanup);
describe('Avatar', () => {
  for (const theme of ['light', 'dark'])
    for (const size of ['sm', 'md', 'lg', 'xl'] as const)
      it(`${size} in ${theme}`, async () => {
        document.documentElement.toggleAttribute('data-theme', theme === 'dark');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await render(
          <Avatar name="Ada Lovelace" size={size} status="online" />,
        );
        expect(container.querySelector('span')!.className).toBe(`lyra-avatar lyra-avatar--${size}`);
        expect(error).not.toHaveBeenCalled();
        expect((await axe.run(container)).violations).toEqual([]);
        error.mockRestore();
      });
});
