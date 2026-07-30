import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Grid } from './index';

afterEach(cleanup);

describe('Grid', () => {
  it('uses stylesheet defaults without an inline style attribute', async () => {
    const { container } = await render(<Grid>Content</Grid>);
    const grid = container.querySelector<HTMLElement>('.lyra-grid')!;

    expect(grid.getAttribute('style')).toBeNull();
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it('maps numeric columns and gap steps to custom properties', async () => {
    const { container } = await render(
      <Grid columns={3} gap={6}>
        Content
      </Grid>,
    );
    const grid = container.querySelector<HTMLElement>('.lyra-grid')!;

    expect(grid.style.getPropertyValue('--lyra-grid-columns')).toBe('repeat(3, minmax(0, 1fr))');
    expect(grid.style.getPropertyValue('--lyra-grid-gap')).toBe('var(--space-6)');
  });

  it('uses string column templates and string gaps verbatim', async () => {
    const { container } = await render(
      <Grid columns="2fr 1fr" gap="2rem">
        Content
      </Grid>,
    );
    const grid = container.querySelector<HTMLElement>('.lyra-grid')!;

    expect(grid.style.getPropertyValue('--lyra-grid-columns')).toBe('2fr 1fr');
    expect(grid.style.getPropertyValue('--lyra-grid-gap')).toBe('2rem');
  });

  it('gives minItem precedence over columns', async () => {
    const { container } = await render(
      <Grid columns={4} minItem={240}>
        Content
      </Grid>,
    );
    const grid = container.querySelector<HTMLElement>('.lyra-grid')!;

    expect(grid.style.getPropertyValue('--lyra-grid-columns')).toBe(
      'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
    );
  });
});
