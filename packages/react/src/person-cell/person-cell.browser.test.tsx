import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { PersonCell } from './index';

afterEach(cleanup);

describe('PersonCell', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`composes Avatar, name, and detail accessibly in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(
          <PersonCell name="Ada Lovelace" detail="ada@example.com" data-testid="person" />,
        );
        expect(container.querySelector('[data-testid=person]')!.className).toBe('lyra-personcell');
        expect(container.querySelector('.lyra-avatar')!.textContent).toBe('AL');
        expect(container.querySelector('.lyra-personcell__name')!.textContent).toBe('Ada Lovelace');
        expect(container.querySelector('.lyra-personcell__detail')!.textContent).toBe(
          'ada@example.com',
        );
        expect(errorSpy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        errorSpy.mockRestore();
        document.documentElement.removeAttribute('data-theme');
      }
    });
  }
});
