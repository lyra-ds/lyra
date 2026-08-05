import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Spinner } from './index';
afterEach(cleanup);
describe('Spinner', () => {
  for (const theme of ['light', 'dark'])
    for (const size of ['sm', 'md', 'lg'] as const)
      it(`${size} in ${theme}`, async () => {
        document.documentElement.toggleAttribute('data-theme', theme === 'dark');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { container } = await render(<Spinner size={size} />);
        expect(container.querySelector('span')!.className).toBe(
          `lyra-spinner lyra-spinner--${size}`,
        );
        expect(error).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
        error.mockRestore();
      });

  it('uses "Loading" as the default accessible name', async () => {
    const { container } = await render(<Spinner />);
    expect(container.querySelector('span')!.getAttribute('aria-label')).toBe('Loading');
  });

  it('uses a consumer-provided accessible name instead of "Loading"', async () => {
    const { container } = await render(<Spinner aria-label="Carregando" />);
    expect(container.querySelector('span')!.getAttribute('aria-label')).toBe('Carregando');
  });
});
