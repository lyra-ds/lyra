import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { IconButton } from './index';

afterEach(cleanup);
describe('IconButton', () => {
  for (const theme of ['light', 'dark']) {
    for (const variant of ['primary', 'secondary', 'soft', 'ghost', 'danger'] as const) {
      it(`${variant} in ${theme}`, async () => {
        document.documentElement.toggleAttribute('data-theme', theme === 'dark');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await render(
          <IconButton label="Close" variant={variant}>
            <svg aria-hidden="true" />
          </IconButton>,
        );
        expect(container.querySelector('button')!.className).toBe(
          `lyra-btn lyra-btn--icon lyra-btn--${variant} lyra-btn--md`,
        );
        expect(error).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
        error.mockRestore();
      });
    }
  }
});
