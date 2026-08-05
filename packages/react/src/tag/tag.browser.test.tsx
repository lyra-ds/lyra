import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Tag } from './index';
afterEach(cleanup);
describe('Tag', () => {
  for (const theme of ['light', 'dark'])
    it(`classes, remove callback, and axe in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const remove = vi.fn();
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = await render(<Tag onRemove={remove}>Filter</Tag>);
      expect(container.querySelector('span')!.className).toBe('lyra-tag');
      (container.querySelector('button') as HTMLButtonElement).click();
      expect(remove).toHaveBeenCalledOnce();
      expect(error).not.toHaveBeenCalled();
      await expectNoAxeViolations(container);
      error.mockRestore();
    });

  it('uses "Remove" as the default accessible name for the remove button', async () => {
    const { container } = await render(<Tag onRemove={() => {}}>Filter</Tag>);
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe('Remove');
  });

  it('uses removeLabel as the accessible name for the remove button', async () => {
    const { container } = await render(
      <Tag onRemove={() => {}} removeLabel="Remover">
        Filter
      </Tag>,
    );
    expect(container.querySelector('button')!.getAttribute('aria-label')).toBe('Remover');
  });
});
