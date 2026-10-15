import { StrictMode, createRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { AppSidebar, AppSidebarOffcanvas, AppSidebarTrigger } from './index';
import { Shell } from '../shell';
import { SidebarGroup } from '../sidebar-group';
import { WorkspaceSwitcher } from '../workspace-switcher';
import { Drawer } from '../drawer';
import '@lyra-ds/styles/styles.css';

afterEach(async () => {
  await cleanup();
  await page.viewport(1200, 800);
});

const groups = [
  {
    heading: 'Workspace',
    items: Array.from({ length: 40 }, (_, i) => ({
      id: String(i),
      label: `Project ${i} with a long readable navigation label`,
      href: `#project-${i}`,
      icon: (
        <svg aria-hidden="true" width="16" height="16">
          <path d="M2 2h12v12H2z" />
        </svg>
      ),
      badge: '1200',
      active: i === 0,
    })),
  },
];

function longSidebar() {
  return (
    <AppSidebar
      aria-label="Application"
      width={240}
      groups={groups}
      density="compact"
      brand={
        <WorkspaceSwitcher
          workspaces={[
            { id: 'acme', name: 'Acme' },
            { id: 'studio', name: 'Design studio' },
          ]}
        />
      }
      footer={<button>Account settings</button>}
    />
  );
}

describe('sidebar adapter layout and existing modal integration', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    it(`animates from the ${dir} start edge and keeps only groups scrolling`, async () => {
      await page.viewport(390, 844);
      const panel = createRef<HTMLDivElement>();
      const screen = await render(
        <AppSidebarOffcanvas
          ref={panel}
          style={{ animationDuration: '100s' }}
          dir={dir}
          open
          title="Workspace"
          onClose={() => {}}
        >
          {longSidebar()}
        </AppSidebarOffcanvas>,
      );
      await expect.element(screen.getByRole('dialog', { name: 'Workspace' })).toBeVisible();
      const node = panel.current!;
      const animation = node
        .getAnimations()
        .find((value) => value.effect instanceof KeyframeEffect);
      expect(animation).toBeDefined();
      if (animation) {
        animation.pause();
        animation.currentTime = 0;
        const entering = node.getBoundingClientRect();
        if (dir === 'ltr') expect(entering.right).toBeLessThanOrEqual(1);
        else expect(entering.left).toBeGreaterThanOrEqual(389);
        animation.finish();
      }
      const rect = node.getBoundingClientRect();
      expect(rect.width).toBeLessThanOrEqual(390);
      expect(dir === 'ltr' ? rect.left : 390 - rect.right).toBeCloseTo(0, 0);
      const close = screen.getByRole('button', { name: 'Close' }).element().getBoundingClientRect();
      expect(close.width).toBeGreaterThanOrEqual(44);
      expect(close.height).toBeGreaterThanOrEqual(44);
      const nav = screen.getByRole('navigation', { name: 'Application' }).element();
      expect(nav.getBoundingClientRect().width).toBeCloseTo(node.clientWidth, 0);
      const brand = nav.querySelector<HTMLElement>('.lyra-appsidebar__brand')!;
      const footer = nav.querySelector<HTMLElement>('.lyra-appsidebar__footer')!;
      const scroll = nav.querySelector<HTMLElement>('.lyra-appsidebar__groups')!;
      const brandTop = brand.getBoundingClientRect().top;
      const footerTop = footer.getBoundingClientRect().top;
      expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
      scroll.scrollTop = 300;
      expect(brand.getBoundingClientRect().top).toBe(brandTop);
      expect(footer.getBoundingClientRect().top).toBe(footerTop);
      const workspace = screen.getByRole('button', { name: /Acme/ });
      await workspace.click();
      const option = screen.getByRole('button', { name: /Design studio/ });
      await expect.element(option).toBeVisible();
      const optionRect = option.element().getBoundingClientRect();
      expect(optionRect.left).toBeGreaterThanOrEqual(0);
      expect(optionRect.right).toBeLessThanOrEqual(390);
      expect(
        document
          .elementFromPoint(
            optionRect.left + optionRect.width / 2,
            optionRect.top + optionRect.height / 2,
          )
          ?.closest('button'),
      ).toBe(option.element());
      await option.click();
      await screen.rerender(
        <AppSidebarOffcanvas
          ref={panel}
          style={{ animationDuration: '100s' }}
          dir={dir}
          open={false}
          title="Workspace"
          onClose={() => {}}
        >
          {longSidebar()}
        </AppSidebarOffcanvas>,
      );
      if (panel.current) {
        expect(panel.current.closest('[inert]')).not.toBeNull();
        const exit = panel.current.getAnimations()[0];
        expect(exit).toBeDefined();
        if (exit) {
          exit.pause();
          exit.currentTime = Number(exit.effect!.getTiming().duration);
          const exiting = panel.current.getBoundingClientRect();
          if (dir === 'ltr') expect(exiting.right).toBeLessThanOrEqual(1);
          else expect(exiting.left).toBeGreaterThanOrEqual(389);
          exit.finish();
        }
      }
      await expect
        .element(screen.getByRole('navigation', { name: 'Application' }))
        .not.toBeInTheDocument();
    });
  }

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`bounds actual panel and child geometry to live visual viewport offsets in ${dir}`, async () => {
      await page.viewport(390, 844);
      const viewport = window.visualViewport!;
      // Deterministic viewport inputs; assertions measure the rendered public panel, not CSS variables.
      const width = vi.spyOn(viewport, 'width', 'get').mockReturnValue(195);
      const height = vi.spyOn(viewport, 'height', 'get').mockReturnValue(422);
      const left = vi.spyOn(viewport, 'offsetLeft', 'get').mockReturnValue(144);
      const top = vi.spyOn(viewport, 'offsetTop', 'get').mockReturnValue(60);
      const panel = createRef<HTMLDivElement>();
      const nav = createRef<HTMLElement>();
      const example = (open: boolean) => (
        <StrictMode>
          <AppSidebarOffcanvas
            ref={panel}
            dir={dir}
            open={open}
            title="Viewport navigation"
            onClose={() => {}}
            style={{ animationDuration: '0s' }}
          >
            <AppSidebar ref={nav} width={240} aria-label="Viewport application" groups={groups} />
          </AppSidebarOffcanvas>
        </StrictMode>
      );
      try {
        const screen = await render(example(true));
        const assertGeometry = () => {
          const box = panel.current!.getBoundingClientRect();
          expect(box.width).toBeCloseTo(Math.min(288, viewport.width), 0);
          expect(box.height).toBeCloseTo(viewport.height, 0);
          expect(box.left).toBeGreaterThanOrEqual(viewport.offsetLeft);
          expect(box.top).toBe(viewport.offsetTop);
          expect(box.right).toBeLessThanOrEqual(viewport.offsetLeft + viewport.width);
          expect(box.bottom).toBeLessThanOrEqual(viewport.offsetTop + viewport.height);
          expect(dir === 'ltr' ? box.left : box.right).toBeCloseTo(
            viewport.offsetLeft + (dir === 'rtl' ? viewport.width : 0),
            0,
          );
          expect(nav.current!.getBoundingClientRect().width).toBeCloseTo(
            panel.current!.clientWidth,
            0,
          );
          const close = screen
            .getByRole('button', { name: 'Close' })
            .element()
            .getBoundingClientRect();
          expect(close.left).toBeGreaterThanOrEqual(box.left);
          expect(close.right).toBeLessThanOrEqual(box.right);
          expect(close.top).toBeGreaterThanOrEqual(box.top);
          expect(close.bottom).toBeLessThanOrEqual(box.bottom);
        };
        await expect
          .element(screen.getByRole('dialog', { name: 'Viewport navigation' }))
          .toBeVisible();
        assertGeometry();
        left.mockReturnValue(100);
        top.mockReturnValue(90);
        viewport.dispatchEvent(new Event('scroll'));
        assertGeometry();
        width.mockReturnValue(310);
        height.mockReturnValue(360);
        left.mockReturnValue(30);
        viewport.dispatchEvent(new Event('resize'));
        assertGeometry();
        const detached = panel.current!;
        const finalStyle = detached.getAttribute('style');
        await screen.rerender(example(false));
        await expect
          .element(screen.getByRole('navigation', { name: 'Viewport application' }))
          .not.toBeInTheDocument();
        expect(panel.current).toBeNull();
        expect(nav.current).toBeNull();
        left.mockReturnValue(50);
        viewport.dispatchEvent(new Event('scroll'));
        expect(detached.getAttribute('style')).toBe(finalStyle);
        await screen.rerender(example(true));
        await expect
          .element(screen.getByRole('dialog', { name: 'Viewport navigation' }))
          .toBeVisible();
        assertGeometry();
        await screen.unmount();
      } finally {
        vi.restoreAllMocks();
      }
    });
  }

  it('preserves nested Drawer ownership, focus trap and return to the topbar', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      const [nested, setNested] = useState(false);
      return (
        <>
          <AppSidebarTrigger
            controls="panel"
            collapsed={!open}
            hotkey
            onCollapsedChange={(value) => setOpen(!value)}
          />
          <AppSidebarOffcanvas
            id="panel"
            title="Navigation"
            open={open}
            onClose={() => setOpen(false)}
          >
            <AppSidebar aria-label="Application">
              <button onClick={() => setNested(true)}>Open task</button>
              <Drawer open={nested} title="Task" onClose={() => setNested(false)}>
                <button>Task action</button>
              </Drawer>
            </AppSidebar>
          </AppSidebarOffcanvas>
        </>
      );
    }
    const screen = await render(<Example />);
    screen.getByRole('button', { name: 'Toggle sidebar' }).element().focus();
    await userEvent.keyboard('{Enter}');
    screen.getByRole('button', { name: 'Open task' }).element().focus();
    await userEvent.keyboard('{Enter}');
    screen.getByRole('button', { name: 'Task action' }).element().focus();
    await userEvent.keyboard('{Control>}b{/Control}');
    await expect.element(screen.getByRole('dialog', { name: 'Task', exact: true })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(screen.getByRole('button', { name: 'Open task' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect.element(screen.getByRole('button', { name: 'Toggle sidebar' })).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('keeps defaults independent while compact rows and aliases stay local', async () => {
    const style = {
      '--appsidebar-accent': 'rgb(20, 40, 60)',
      '--appsidebar-accent-foreground': 'rgb(240, 241, 242)',
    } as CSSProperties;
    const screen = await render(
      <>
        <Shell
          mainAs="div"
          scroll="content"
          style={{ height: 300 }}
          sidebar={<AppSidebar density="compact" width={296} style={style} groups={groups} />}
        >
          Content
        </Shell>
        <SidebarGroup items={[{ id: 'outside', label: 'Independent' }]} />
      </>,
    );
    const outside = screen.getByRole('button', { name: 'Independent' }).element();
    expect(getComputedStyle(outside).minHeight).toBe('36px');
    const first = screen
      .getByRole('link', { name: 'Project 0 with a long readable navigation label' })
      .element();
    expect(getComputedStyle(first).minHeight).toBe(
      matchMedia('(pointer: coarse), (any-pointer: coarse)').matches ? '44px' : '32px',
    );
    expect(getComputedStyle(first).backgroundColor).toBe('rgb(20, 40, 60)');
    expect(getComputedStyle(first).color).toBe('rgb(240, 241, 242)');
    const nav = first.closest('nav')!;
    expect(nav.getBoundingClientRect().width).toBe(296);
    expect(first.scrollWidth).toBeLessThanOrEqual(first.clientWidth);
  });
});
