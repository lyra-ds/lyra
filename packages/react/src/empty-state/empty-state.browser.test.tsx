import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { EmptyState } from './index';
afterEach(cleanup);
describe('EmptyState', () => {
  for (const theme of ['light', 'dark'])
    it(`full anatomy in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = await render(
        <EmptyState
          title="No projects"
          description="Create one to begin"
          action={<button type="button">Create</button>}
        />,
      );
      expect(container.querySelector('div')!.className).toBe('lyra-empty');
      expect(error).not.toHaveBeenCalled();
      await expectNoAxeViolations(container);
      error.mockRestore();
    });
});
