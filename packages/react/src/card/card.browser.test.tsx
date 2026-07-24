import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Card } from './index';
afterEach(cleanup);
describe('Card', () => {
  for (const theme of ['light', 'dark'])
    it(`anatomy in ${theme}`, async () => {
      document.documentElement.toggleAttribute('data-theme', theme === 'dark');
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = await render(
        <Card
          title="Title"
          actions={<button type="button">Act</button>}
          footer="Footer"
          interactive
        >
          Body
        </Card>,
      );
      expect(container.querySelector('div')!.className).toBe('lyra-card lyra-card--interactive');
      // Actions are grouped by the .lyra-card__actions class, not an inline flex style.
      expect(container.querySelector('.lyra-card__actions')).not.toBeNull();
      expect(error).not.toHaveBeenCalled();
      expect((await axe.run(container)).violations).toEqual([]);
      error.mockRestore();
    });

  it('asChild renders the child element carrying the card classes', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = await render(
      <Card asChild interactive>
        <a href="/components/card">Card</a>
      </Card>,
    );
    const anchor = container.querySelector('a')!;
    expect(container.querySelector('div')).toBeNull();
    expect(anchor.className).toBe('lyra-card lyra-card--interactive lyra-card--padded');
    expect(anchor.getAttribute('href')).toBe('/components/card');
    expect(error).not.toHaveBeenCalled();
    expect((await axe.run(container)).violations).toEqual([]);
    error.mockRestore();
  });
});
