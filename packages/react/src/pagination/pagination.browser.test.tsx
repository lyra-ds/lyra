import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Pagination } from './index';
const themes = ['light', 'dark'] as const;
function setTheme(theme: (typeof themes)[number]): void {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}
afterEach(async () => {
  await cleanup();
  setTheme('light');
});
describe('Pagination', () => {
  for (const theme of themes)
    it(`renders normal page buttons and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const onChange = vi.fn();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const { container } = await render(<Pagination page={5} total={10} onChange={onChange} />);
        expect(container.querySelector('nav')!.className).toBe('lyra-pagination');
        expect(container.querySelector('.lyra-page--active')!.className).toBe(
          'lyra-page lyra-page--active',
        );
        expect(container.querySelector('.lyra-page--gap')!.className).toBe(
          'lyra-page lyra-page--gap',
        );
        const buttons = container.querySelectorAll<HTMLButtonElement>('button');
        expect([...buttons].every((button) => button.tabIndex === 0 || button.disabled)).toBe(true);
        buttons[2].click();
        expect(onChange).toHaveBeenCalledWith(4);
        expect(spy).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        spy.mockRestore();
      }
    });

  it('uses "Previous page" as the default accessible name for the previous button', async () => {
    const { container } = await render(<Pagination page={2} total={3} />);
    expect(container.querySelectorAll('button')[0]!.getAttribute('aria-label')).toBe(
      'Previous page',
    );
  });

  it('uses previousLabel as the accessible name for the previous button', async () => {
    const { container } = await render(
      <Pagination page={2} total={3} previousLabel="Página anterior" />,
    );
    expect(container.querySelectorAll('button')[0]!.getAttribute('aria-label')).toBe(
      'Página anterior',
    );
  });

  it('uses "Next page" as the default accessible name for the next button', async () => {
    const { container } = await render(<Pagination page={2} total={3} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons[buttons.length - 1]!.getAttribute('aria-label')).toBe('Next page');
  });

  it('uses nextLabel as the accessible name for the next button', async () => {
    const { container } = await render(
      <Pagination page={2} total={3} nextLabel="Próxima página" />,
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[buttons.length - 1]!.getAttribute('aria-label')).toBe('Próxima página');
  });
});
