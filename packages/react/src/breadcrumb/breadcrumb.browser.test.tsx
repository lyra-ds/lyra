import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Breadcrumb } from './index';
afterEach(cleanup);
describe('Breadcrumb', () => {
  for (const theme of ['light', 'dark'])
    it(`items in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = await render(
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Current' }]} />,
      );
      expect(container.querySelector('nav')!.className).toBe('lyra-breadcrumb');
      expect(container.querySelector('.lyra-breadcrumb__sep')).not.toBeNull();
      expect(error).not.toHaveBeenCalled();
      expect((await axe.run(container)).violations).toEqual([]);
      error.mockRestore();
    });
});
