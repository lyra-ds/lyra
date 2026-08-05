import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Stat } from './index';
afterEach(cleanup);
describe('Stat', () => {
  for (const theme of ['light', 'dark'])
    for (const direction of ['up', 'down', 'flat'] as const)
      it(`${direction} in ${theme}`, async () => {
        document.documentElement.toggleAttribute('data-theme', theme === 'dark');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await render(
          <Stat label="Revenue" value="48" delta="12%" direction={direction} />,
        );
        expect(container.querySelector('div')!.className).toBe('lyra-stat');
        expect(container.querySelector('.lyra-stat__delta')!.className).toBe(
          `lyra-stat__delta lyra-stat__delta--${direction}`,
        );
        expect(error).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
        error.mockRestore();
      });
});
