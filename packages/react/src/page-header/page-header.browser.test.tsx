import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { PageHeader } from './index';

afterEach(cleanup);

describe('PageHeader', () => {
  it('renders an h1 title by default', async () => {
    const screen = await render(<PageHeader title="Projects" />);
    const { container } = screen;

    await expect
      .element(screen.getByRole('heading', { level: 1, name: 'Projects' }))
      .toBeInTheDocument();
    expect(container.querySelector('h1.lyra-pageheader__title')).not.toBeNull();
    expect(container.querySelector('.lyra-pageheader__eyebrow')).toBeNull();
    expect(container.querySelector('.lyra-pageheader__desc')).toBeNull();
    expect(container.querySelector('.lyra-pageheader__actions')).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('renders a section title with its existing classes, attributes, and slots', async () => {
    const screen = await render(
      <PageHeader
        titleAs="h2"
        aria-label="Billing section"
        eyebrow="Account"
        title="Billing"
        description="Manage invoices."
        actions={<button type="button">Download invoice</button>}
      >
        <nav aria-label="Billing sections">Overview</nav>
      </PageHeader>,
    );
    const { container } = screen;
    const header = container.querySelector<HTMLElement>('.lyra-pageheader')!;
    const title = container.querySelector<HTMLElement>('.lyra-pageheader__title')!;

    await expect
      .element(screen.getByRole('heading', { level: 2, name: 'Billing' }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole('button', { name: 'Download invoice' }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole('navigation', { name: 'Billing sections' }))
      .toBeInTheDocument();
    expect(container.querySelector('h1')).toBeNull();
    expect(title.tagName).toBe('H2');
    expect(title.className).toBe('lyra-pageheader__title');
    expect(header.getAttribute('aria-label')).toBe('Billing section');
    expect(header.querySelector('.lyra-pageheader__eyebrow')?.textContent).toBe('Account');
    expect(header.querySelector('.lyra-pageheader__desc')?.textContent).toBe('Manage invoices.');
    expect(header.querySelector('.lyra-pageheader__actions button')?.textContent).toBe(
      'Download invoice',
    );
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
    await expectNoAxeViolations(container);
  });
});
