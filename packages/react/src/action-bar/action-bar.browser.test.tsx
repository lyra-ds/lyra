import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { ActionBar } from './index';

afterEach(async () => {
  await cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('ActionBar', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`appears, announces its selection count, and is axe clean in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const screen = await render(
          <ActionBar
            count={2}
            actions={<button type="button">Archive</button>}
            onClear={() => {}}
          />,
        );
        expect(screen.container.querySelector('.lyra-actionbar')!.className).toBe('lyra-actionbar');
        await expect.element(screen.getByRole('status')).toHaveTextContent('2 selected');
        await expect
          .element(screen.getByRole('button', { name: 'Clear selection' }))
          .toBeInTheDocument();
        expect(errorSpy).not.toHaveBeenCalled();
        expect((await axe.run(screen.container)).violations).toEqual([]);
      } finally {
        errorSpy.mockRestore();
      }
    });
  }

  it('hides for zero selections or when closed, and clears with a translated label', async () => {
    const clear = vi.fn();
    const hidden = await render(<ActionBar count={0} />);
    expect(hidden.container.firstElementChild).toBeNull();

    await cleanup();
    const closed = await render(<ActionBar count={3} open={false} />);
    expect(closed.container.firstElementChild).toBeNull();

    await cleanup();
    const shown = await render(
      <ActionBar count={1} label="selecionado" clearLabel="Limpar seleção" onClear={clear} />,
    );
    await userEvent.click(shown.getByRole('button', { name: 'Limpar seleção' }));
    expect(clear).toHaveBeenCalledOnce();
    await expect.element(shown.getByRole('status')).toHaveTextContent('1 selecionado');
  });
});
