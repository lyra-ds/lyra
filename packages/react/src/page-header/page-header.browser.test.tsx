import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { PageHeader } from './index';

afterEach(cleanup);

describe('PageHeader', () => {
  it('renders a title-only header', async () => {
    const screen = await render(<PageHeader title="Projects" />);
    const { container } = screen;

    await expect
      .element(screen.getByRole('heading', { level: 1, name: 'Projects' }))
      .toBeInTheDocument();
    expect(container.querySelector('.lyra-pageheader__eyebrow')).toBeNull();
    expect(container.querySelector('.lyra-pageheader__desc')).toBeNull();
    expect(container.querySelector('.lyra-pageheader__actions')).toBeNull();
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it('renders every optional slot and places children below the primary row', async () => {
    const screen = await render(
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Manage active work."
        actions={<button type="button">Create project</button>}
      >
        <nav aria-label="Project sections">Tabs</nav>
      </PageHeader>,
    );
    const { container } = screen;
    const header = container.querySelector<HTMLElement>('.lyra-pageheader')!;

    await expect.element(screen.getByText('Workspace')).toBeInTheDocument();
    await expect.element(screen.getByText('Manage active work.')).toBeInTheDocument();
    await expect
      .element(screen.getByRole('button', { name: 'Create project' }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole('navigation', { name: 'Project sections' }))
      .toBeInTheDocument();
    expect(header.lastElementChild?.tagName).toBe('NAV');
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
