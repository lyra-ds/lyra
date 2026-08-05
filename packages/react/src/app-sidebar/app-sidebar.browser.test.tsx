import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { AppSidebar } from './index';
import { SidebarGroup } from '../sidebar-group';

const groups = [
  {
    heading: 'Workspace',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: <span aria-hidden="true">O</span>,
        active: true,
      },
      { id: 'settings', label: 'Settings', icon: <span aria-hidden="true">S</span> },
    ],
  },
];

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

afterEach(async () => {
  await cleanup();
  setTheme('light');
});

describe('AppSidebar', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`renders the expanded composed shape and is axe clean in ${theme}`, async () => {
      setTheme(theme);
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const screen = await render(
          <AppSidebar
            aria-label="Application navigation"
            brand={<a href="/">Lyra</a>}
            groups={groups}
            footer={<a href="/account">Account</a>}
          />,
        );
        const { container } = screen;
        const sidebar = container.querySelector<HTMLElement>('.lyra-appsidebar')!;

        await expect
          .element(screen.getByRole('navigation', { name: 'Application navigation' }))
          .toBeInTheDocument();
        await expect.element(screen.getByRole('link', { name: 'Lyra' })).toBeInTheDocument();
        expect(sidebar.className).toBe('lyra-appsidebar');
        expect(sidebar.style.getPropertyValue('--appsidebar-width')).toBe('260px');
        expect(getComputedStyle(sidebar).width).toBe('260px');
        expect(container.querySelector('.lyra-appsidebar__groups')).not.toBeNull();
        expect(container.querySelector('.lyra-appsidebar__footer')).not.toBeNull();
        expect(
          container.querySelector('.lyra-sbgroup__item--active')?.getAttribute('aria-current'),
        ).toBe('page');
        expect(error).not.toHaveBeenCalled();
        await expectNoAxeViolations(container);
      } finally {
        error.mockRestore();
      }
    });
  }

  it('uses a 64px icon rail with native item tooltips and a controllable toggle', async () => {
    const onCollapsedChange = vi.fn();
    const { container } = await render(
      <AppSidebar groups={groups} collapsible onCollapsedChange={onCollapsedChange} />,
    );
    const sidebar = container.querySelector<HTMLElement>('.lyra-appsidebar')!;
    const toggle = container.querySelector<HTMLButtonElement>('.lyra-appsidebar__toggle')!;

    await userEvent.click(toggle);

    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(sidebar.className).toContain('lyra-appsidebar--rail');
    expect(sidebar.style.getPropertyValue('--appsidebar-width')).toBe('64px');
    // width transitions (transition: width in the additive rule) — the custom
    // property flips instantly, the computed width animates to it.
    await vi.waitFor(() => expect(getComputedStyle(sidebar).width).toBe('64px'));
    expect(
      getComputedStyle(container.querySelector<HTMLElement>('.lyra-sbgroup__item-label')!).display,
    ).toBe('none');
    expect(container.querySelector('.lyra-sbgroup__item')?.getAttribute('title')).toBe('Overview');
    expect(
      container.querySelector('.lyra-sbgroup__item + .lyra-sbgroup__item')?.getAttribute('title'),
    ).toBe('Settings');
    await expectNoAxeViolations(container);
  });

  it('reports a controlled toggle without changing its own collapsed state', async () => {
    const onCollapsedChange = vi.fn();
    const { container } = await render(
      <AppSidebar
        groups={groups}
        collapsible
        collapsed={false}
        onCollapsedChange={onCollapsedChange}
      />,
    );
    const sidebar = container.querySelector<HTMLElement>('.lyra-appsidebar')!;
    const toggle = container.querySelector<HTMLButtonElement>('.lyra-appsidebar__toggle')!;

    await userEvent.click(toggle);

    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(sidebar.className).not.toContain('lyra-appsidebar--rail');
    expect(sidebar.style.getPropertyValue('--appsidebar-width')).toBe('260px');
  });

  it('preserves arbitrary SidebarGroup children as real anchors', async () => {
    const screen = await render(
      <AppSidebar aria-label="Documentation navigation">
        <SidebarGroup label="Documentation">
          <a className="lyra-sbgroup__item" href="/guides">
            <span className="lyra-sbgroup__item-label">Guides</span>
          </a>
        </SidebarGroup>
      </AppSidebar>,
    );

    const link = screen.getByRole('link', { name: 'Guides' });
    await expect.element(link).toBeInTheDocument();
    await expect.element(link).toHaveAttribute('href', '/guides');
  });

  it('keeps composed links named and tooltip-backed in the icon rail', async () => {
    const screen = await render(
      <AppSidebar collapsed aria-label="Documentation navigation">
        <SidebarGroup label="Documentation">
          <a className="lyra-sbgroup__item" href="/guides">
            <span className="lyra-sbgroup__item-label">Guides</span>
          </a>
        </SidebarGroup>
      </AppSidebar>,
    );

    const link = screen.getByRole('link', { name: 'Guides' });
    await expect.element(link).toHaveAttribute('title', 'Guides');
    await expect.element(link).toHaveAttribute('aria-label', 'Guides');
    await expectNoAxeViolations(screen.container);
  });
});
