import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { cleanup, render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { AppSidebar } from './index';
import { SidebarGroup } from '../sidebar-group';
import { Shell } from '../shell';
import { WorkspaceSwitcher } from '../workspace-switcher';

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

function RouterLink({ to, children, ...props }: ComponentProps<'a'> & { to: string }) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}

function setTheme(theme: 'light' | 'dark'): void {
  document.documentElement.toggleAttribute('data-theme', theme === 'dark');
}

function expectPopoverEdgesOutsideSidebarClipping(popover: HTMLElement): void {
  const popoverRect = popover.getBoundingClientRect();
  let ancestor = popover.parentElement;

  while (ancestor) {
    if (
      ancestor.matches(
        '.lyra-appsidebar__brand, .lyra-appsidebar, .lyra-shell__sidebar, .lyra-shell',
      )
    ) {
      const ancestorRect = ancestor.getBoundingClientRect();
      const style = getComputedStyle(ancestor);
      const exceedsInlineEdge =
        popoverRect.left < ancestorRect.left - 0.5 || popoverRect.right > ancestorRect.right + 0.5;
      const exceedsBlockEdge =
        popoverRect.top < ancestorRect.top - 0.5 || popoverRect.bottom > ancestorRect.bottom + 0.5;

      expect(
        exceedsInlineEdge && style.overflowX !== 'visible',
        `${ancestor.className} clips the popover inline edge: popover ${popoverRect.left},${popoverRect.right}; ancestor ${ancestorRect.left},${ancestorRect.right}; overflow-x ${style.overflowX}`,
      ).toBe(false);
      expect(
        exceedsBlockEdge && style.overflowY !== 'visible',
        `${ancestor.className} clips the popover block edge: popover ${popoverRect.top},${popoverRect.bottom}; ancestor ${ancestorRect.top},${ancestorRect.bottom}; overflow-y ${style.overflowY}`,
      ).toBe(false);
    }
    ancestor = ancestor.parentElement;
  }
}

afterEach(async () => {
  await cleanup();
  await page.viewport(1200, 800);
  setTheme('light');
  document.documentElement.removeAttribute('dir');
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
    await vi.waitFor(() => expect(sidebar.getBoundingClientRect().width).toBeCloseTo(64, 1));
    expect(
      getComputedStyle(container.querySelector<HTMLElement>('.lyra-sbgroup__item-label')!).display,
    ).toBe('none');
    expect(container.querySelector('.lyra-sbgroup__item')?.getAttribute('title')).toBe('Overview');
    expect(
      container.querySelector('.lyra-sbgroup__item + .lyra-sbgroup__item')?.getAttribute('title'),
    ).toBe('Settings');
    await expectNoAxeViolations(container);
  });

  it('sizes a content-scroll Shell rail to the sidebar and keeps a brand WorkspaceSwitcher inside it', async () => {
    const workspaces = [
      { id: 'acme', name: 'Acme', plan: 'Pro', members: 5 },
      { id: 'lyra', name: 'Lyra', plan: 'Free', members: 2 },
    ];
    const { container } = await render(
      <div style={{ height: '400px' }}>
        <Shell
          scroll="content"
          sidebar={
            <AppSidebar
              brand={<WorkspaceSwitcher workspaces={workspaces} current="acme" />}
              groups={groups}
              collapsible
            />
          }
          sidebarAs="nav"
          sidebarLabel="Application navigation"
          topbar="Toolbar"
        >
          Document
        </Shell>
      </div>,
    );
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const rail = container.querySelector<HTMLElement>('.lyra-shell__sidebar')!;
    const sidebar = container.querySelector<HTMLElement>('.lyra-appsidebar')!;
    const brand = container.querySelector<HTMLElement>('.lyra-appsidebar__brand')!;
    const switcher = container.querySelector<HTMLElement>('.lyra-wssw')!;

    expect(sidebar.getBoundingClientRect().width).toBeCloseTo(260, 1);
    expect(rail.getBoundingClientRect().width).toBeCloseTo(
      sidebar.getBoundingClientRect().width,
      1,
    );
    expect(sidebar.getBoundingClientRect().height).toBeCloseTo(
      shell.getBoundingClientRect().height,
      1,
    );
    expect(switcher.getBoundingClientRect().right).toBeLessThanOrEqual(
      brand.getBoundingClientRect().right + 0.5,
    );
    expect(brand.scrollWidth).toBeLessThanOrEqual(brand.clientWidth);

    await userEvent.click(container.querySelector<HTMLButtonElement>('.lyra-appsidebar__toggle')!);
    await vi.waitFor(() => expect(sidebar.getBoundingClientRect().width).toBeCloseTo(64, 1));
    expect(rail.getBoundingClientRect().width).toBeCloseTo(64, 1);
    expect(getComputedStyle(brand).flexDirection).toBe('row');
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const dir of ['ltr', 'rtl'] as const) {
      it(`keeps a WorkspaceSwitcher compact, operable, and in the 320px viewport in ${theme} ${dir}`, async () => {
        await page.viewport(320, 640);
        setTheme(theme);
        document.documentElement.dir = dir;
        const workspaces = [
          { id: 'acme', name: 'Acme', plan: 'Pro', members: 5 },
          { id: 'lyra', name: 'Lyra', plan: 'Free', members: 2 },
        ];
        const { container } = await render(
          <div style={{ height: '400px' }}>
            <Shell
              scroll="content"
              sidebar={
                <AppSidebar
                  collapsible
                  brand={<WorkspaceSwitcher workspaces={workspaces} current="acme" />}
                />
              }
            >
              Document
            </Shell>
          </div>,
        );
        const rail = container.querySelector<HTMLElement>('.lyra-shell__sidebar')!;
        const sidebar = container.querySelector<HTMLElement>('.lyra-appsidebar')!;
        const brand = container.querySelector<HTMLElement>('.lyra-appsidebar__brand')!;
        const trigger = container.querySelector<HTMLButtonElement>('.lyra-wssw__trigger')!;

        expect(sidebar.getBoundingClientRect().width).toBeCloseTo(260, 1);
        await userEvent.click(
          container.querySelector<HTMLButtonElement>('.lyra-appsidebar__toggle')!,
        );
        await vi.waitFor(() => expect(sidebar.getBoundingClientRect().width).toBeCloseTo(64, 1));
        expect(rail.getBoundingClientRect().width).toBeCloseTo(64, 1);
        expect(brand.scrollWidth).toBeLessThanOrEqual(brand.clientWidth);
        expect(trigger.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
        expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
        expect(
          getComputedStyle(container.querySelector<HTMLElement>('.lyra-wssw__id')!).position,
        ).toBe('absolute');
        await expect.element(trigger).toHaveAccessibleName(/Acme/);

        trigger.focus();
        await userEvent.keyboard('{Enter}');
        const popover = container.querySelector<HTMLElement>('.lyra-wssw__pop')!;
        const popoverRect = popover.getBoundingClientRect();
        expect(popoverRect.width).toBeGreaterThanOrEqual(200);
        expect(popoverRect.left).toBeGreaterThanOrEqual(0);
        expect(popoverRect.right).toBeLessThanOrEqual(320);
        expect(popover.scrollWidth).toBeLessThanOrEqual(popover.clientWidth);
        expectPopoverEdgesOutsideSidebarClipping(popover);

        await userEvent.keyboard('{Escape}');
        expect(container.querySelector('.lyra-wssw__pop')).toBeNull();
        expect(document.activeElement).toBe(trigger);
      });
    }
  }

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

  it('renders data links with native new-tab behavior and composes router links', async () => {
    const selected = vi.fn();
    const screen = await render(
      <AppSidebar
        collapsed
        labels={{ collapse: 'Recolher barra lateral', expand: 'Expandir barra lateral' }}
        collapsible
        onSelect={selected}
        groups={[
          {
            items: [
              {
                id: 'home',
                label: 'Início',
                href: '/inicio',
                active: true,
                target: '_blank',
                rel: 'noopener',
              },
              { id: 'router', label: 'Rotas', asChild: <RouterLink to="/rotas" target="_blank" /> },
              { id: 'action', label: 'Ação' },
            ],
          },
        ]}
      />,
    );
    const native = screen.getByRole('link', { name: 'Início' });
    await expect.element(native).toHaveAttribute('href', '/inicio');
    await expect.element(native).toHaveAttribute('aria-current', 'page');
    await expect.element(native).toHaveAttribute('target', '_blank');
    await expect
      .element(screen.getByRole('link', { name: 'Rotas' }))
      .toHaveAttribute('href', '/rotas');
    await expect.element(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument();
    await expect
      .element(screen.getByRole('button', { name: 'Expandir barra lateral' }))
      .toBeInTheDocument();
    await userEvent.click(native);
    expect(selected).toHaveBeenCalledWith('home', expect.objectContaining({ id: 'home' }));
    await expectNoAxeViolations(screen.container);
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
