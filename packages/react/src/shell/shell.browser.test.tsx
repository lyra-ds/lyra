import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { expectNoAxeViolations } from '../internal/test-axe';
import '@lyra-ds/styles/styles.css';
import { Shell } from './index';

type VitestBrowserRunner = { iframeId: string; sessionId: string };

/** Resize the Browser Mode iframe without adding its transitive helper as a package dependency. */
function setViewport(width: number, height: number) {
  const runner = (window as typeof window & { __vitest_browser_runner__?: VitestBrowserRunner })
    .__vitest_browser_runner__;
  if (!runner) throw new Error('Vitest Browser Mode runner is unavailable.');

  const channel = new BroadcastChannel(`vitest:${runner.sessionId}`);
  channel.postMessage({ event: 'viewport', width, height, iframeId: runner.iframeId });

  return new Promise<void>((resolve, reject) => {
    channel.addEventListener('message', function handler(event) {
      if (event.data.iframeId !== runner.iframeId) return;
      if (event.data.event === 'viewport:done') {
        channel.removeEventListener('message', handler);
        channel.close();
        resolve();
      }
      if (event.data.event === 'viewport:fail') {
        channel.removeEventListener('message', handler);
        channel.close();
        reject(new Error(event.data.error));
      }
    });
  });
}

afterEach(async () => {
  await setViewport(1200, 800);
  cleanup();
});

describe('Shell', () => {
  it.each(['page', 'content'] as const)(
    'keeps the %s banner outside main and the skip link keyboard accessible',
    async (scroll) => {
      const { container } = await render(
        <div style={{ height: '300px' }}>
          <Shell
            scroll={scroll}
            banner="Tenant: Acme"
            sidebar={<nav aria-label="Primary">Navigation</nav>}
            sidebarAs="div"
            skipLink={{ label: 'Skip to content' }}
            mainId="events"
            topbar="Filters"
          >
            Events
          </Shell>
        </div>,
      );
      const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
      const banner = shell.querySelector<HTMLElement>('.lyra-shell__banner')!;
      const main = shell.querySelector<HTMLElement>('main')!;
      const link = shell.querySelector<HTMLAnchorElement>('.lyra-shell__skip-link')!;

      expect(banner.parentElement).toBe(shell);
      expect(banner.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(main.contains(banner)).toBe(false);
      expect(shell.querySelector('aside')).toBeNull();
      expect(shell.querySelectorAll('nav')).toHaveLength(1);
      expect(link.getAttribute('href')).toBe('#events');
      expect(getComputedStyle(link).clipPath).toBe('inset(50%)');
      link.focus();
      expect(getComputedStyle(link).position).toBe('fixed');
      link.click();
      expect(document.activeElement).toBe(main);
      expect(main.querySelector('.lyra-shell__topbar')?.textContent).toBe('Filters');
      if (scroll === 'content') {
        expect(getComputedStyle(shell).display).toBe('grid');
        expect(main.getBoundingClientRect().top).toBeCloseTo(
          shell.querySelector('.lyra-shell__sidebar')!.getBoundingClientRect().top,
          1,
        );
        expect(main.getBoundingClientRect().top).toBeGreaterThan(
          banner.getBoundingClientRect().top,
        );
      }
      await expectNoAxeViolations(container);
    },
  );

  describe('skip link activation', () => {
    async function renderSkip(href?: string) {
      const { container } = await render(
        <Shell skipLink={{ label: 'Skip', href }} mainId="events">
          Events
        </Shell>,
      );
      const link = container.querySelector<HTMLAnchorElement>('.lyra-shell__skip-link')!;
      const main = container.querySelector<HTMLElement>('main')!;
      link.focus();
      return { link, main };
    }

    /** Dispatch a click and cancel it afterwards so the test page never navigates. */
    function click(link: HTMLAnchorElement, init: MouseEventInit = {}) {
      const cancel = (event: Event) => event.preventDefault();
      document.addEventListener('click', cancel);
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
      document.removeEventListener('click', cancel);
    }

    it('focuses the target on a plain click and updates nothing else', async () => {
      const { link, main } = await renderSkip();
      link.click();
      expect(document.activeElement).toBe(main);
      expect(window.location.hash).toBe('#events');
      history.replaceState(null, '', window.location.pathname + window.location.search);
    });

    it('focuses the target on Enter', async () => {
      const { link, main } = await renderSkip();
      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      link.click();
      expect(document.activeElement).toBe(main);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    });

    it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }])(
      'does not move focus or scroll on a modified click %o',
      async (init) => {
        const { link, main } = await renderSkip();
        const scrollY = window.scrollY;
        click(link, init);
        expect(document.activeElement).toBe(link);
        expect(document.activeElement).not.toBe(main);
        expect(window.scrollY).toBe(scrollY);
      },
    );

    it('does not move focus on a non-primary button click', async () => {
      const { link, main } = await renderSkip();
      click(link, { button: 1 });
      expect(document.activeElement).not.toBe(main);
    });

    it('leaves a link to another document to native navigation', async () => {
      const { link, main } = await renderSkip('/different#events');
      const scrollY = window.scrollY;
      click(link);
      expect(document.activeElement).not.toBe(main);
      expect(window.scrollY).toBe(scrollY);
    });
  });

  it('renders a main landmark by default and omits empty rail and topbar elements', async () => {
    const screen = await render(<Shell>Document</Shell>);
    const { container } = screen;

    await expect.element(screen.getByRole('main')).toBeInTheDocument();
    expect(container.querySelector('main.lyra-shell__main')).not.toBeNull();
    expect(container.querySelector('.lyra-shell__sidebar')).toBeNull();
    expect(container.querySelector('.lyra-shell__topbar')).toBeNull();
    expect(container.querySelector('.lyra-shell__aside')).toBeNull();
    expect(container.querySelector('.lyra-shell')!.getAttribute('style')).toBeNull();
    await expectNoAxeViolations(container);
  });

  it('renders an embedded shell without a main landmark while preserving slots and attributes', async () => {
    const screen = await render(
      <Shell
        mainAs="div"
        sidebar="Navigation"
        sidebarAs="nav"
        sidebarLabel="Project navigation"
        topbar="Toolbar"
        aside="Context"
        asideLabel="Project context"
      >
        Document
      </Shell>,
    );
    const { container } = screen;
    const main = container.querySelector<HTMLElement>('.lyra-shell__main')!;

    await expect
      .element(screen.getByRole('navigation', { name: 'Project navigation' }))
      .toBeInTheDocument();
    await expect.element(screen.getByText('Toolbar')).toBeInTheDocument();
    await expect.element(screen.getByText('Document')).toBeInTheDocument();
    expect(container.querySelector('main')).toBeNull();
    expect(main.tagName).toBe('DIV');
    expect(main.className).toBe('lyra-shell__main');
    expect(container.querySelector('.lyra-shell__sidebar')?.getAttribute('aria-label')).toBe(
      'Project navigation',
    );
    expect(container.querySelector('.lyra-shell__aside')?.getAttribute('aria-label')).toBe(
      'Project context',
    );
    expect(main.querySelector('.lyra-shell__topbar')?.textContent).toBe('Toolbar');
    expect(main.querySelector('.lyra-shell__content')?.textContent).toBe('Document');
  });

  it('uses stylesheet custom-property defaults and emits only supplied dimensions', async () => {
    const { container, rerender } = await render(<Shell>Document</Shell>);
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;

    expect(getComputedStyle(shell).getPropertyValue('--shell-sidebar').trim()).toBe('220px');
    expect(getComputedStyle(shell).getPropertyValue('--shell-aside').trim()).toBe('200px');
    expect(getComputedStyle(shell).getPropertyValue('--shell-top').trim()).toBe('0px');

    await rerender(
      <Shell sidebarWidth={240} asideWidth={216} top={84}>
        Document
      </Shell>,
    );

    expect(Array.from(shell.style)).toEqual(['--shell-sidebar', '--shell-aside', '--shell-top']);
    expect(shell.style.getPropertyValue('--shell-sidebar')).toBe('240px');
    expect(shell.style.getPropertyValue('--shell-aside')).toBe('216px');
    expect(shell.style.getPropertyValue('--shell-top')).toBe('84px');
  });

  it('uses sticky, independently scrollable rails above the 1100px collapse', async () => {
    await setViewport(1200, 800);
    const { container } = await render(
      <Shell
        sidebar="Navigation"
        sidebarAs="nav"
        sidebarLabel="Documentation"
        aside="Contents"
        asideLabel="On this page"
        topbar="Toolbar"
      >
        Document
      </Shell>,
    );
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const sidebar = container.querySelector<HTMLElement>('.lyra-shell__sidebar')!;
    const aside = container.querySelector<HTMLElement>('.lyra-shell__aside')!;
    const topbar = container.querySelector<HTMLElement>('.lyra-shell__topbar')!;

    expect(shell.className).toContain('lyra-shell--page');
    expect(getComputedStyle(shell).display).toBe('grid');
    expect(getComputedStyle(topbar).display).toBe('flex');
    for (const rail of [sidebar, aside]) {
      expect(getComputedStyle(rail).position).toBe('sticky');
      expect(getComputedStyle(rail).overflowY).toBe('auto');
      expect(getComputedStyle(rail).overscrollBehaviorY).toBe('contain');
    }
    await expectNoAxeViolations(container);
  });

  it('hides the aside and collapses its grid track at 1100px', async () => {
    await setViewport(1000, 800);
    const { container } = await render(
      <Shell sidebar="Navigation" aside="Contents">
        Document
      </Shell>,
    );
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const aside = container.querySelector<HTMLElement>('.lyra-shell__aside')!;

    expect(getComputedStyle(aside).display).toBe('none');
    expect(getComputedStyle(shell).gridTemplateColumns.split(' ')).toHaveLength(2);
  });

  it('hides the aside and collapses its grid track for an aside-only shell at 1100px', async () => {
    await setViewport(1000, 800);
    const { container } = await render(<Shell aside="Contents">Document</Shell>);
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const aside = container.querySelector<HTMLElement>('.lyra-shell__aside')!;

    expect(getComputedStyle(aside).display).toBe('none');
    expect(getComputedStyle(shell).gridTemplateColumns.split(' ')).toHaveLength(1);
  });

  it('stacks the sidebar at 900px', async () => {
    await setViewport(800, 800);
    const { container } = await render(<Shell sidebar="Navigation">Document</Shell>);
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const sidebar = container.querySelector<HTMLElement>('.lyra-shell__sidebar')!;

    expect(getComputedStyle(shell).gridTemplateColumns.split(' ')).toHaveLength(1);
    expect(getComputedStyle(sidebar).position).toBe('static');
  });

  it('stacks the both-rails shell and makes its sidebar non-sticky at 900px', async () => {
    await setViewport(800, 800);
    const { container } = await render(
      <Shell sidebar="Navigation" aside="Contents">
        Document
      </Shell>,
    );
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const sidebar = container.querySelector<HTMLElement>('.lyra-shell__sidebar')!;

    expect(getComputedStyle(shell).gridTemplateColumns.split(' ')).toHaveLength(1);
    expect(getComputedStyle(sidebar).position).toBe('static');
  });

  it('uses the main region as the scroll container in content-scroll mode', async () => {
    const { container } = await render(
      <div style={{ height: '300px' }}>
        <Shell scroll="content" sidebar="Navigation" topbar="Toolbar">
          Document
        </Shell>
      </div>,
    );
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const main = container.querySelector<HTMLElement>('.lyra-shell__main')!;
    const content = container.querySelector<HTMLElement>('.lyra-shell__content')!;

    expect(shell.className).toContain('lyra-shell--content');
    expect(getComputedStyle(shell).display).toBe('flex');
    expect(getComputedStyle(main).display).toBe('flex');
    expect(getComputedStyle(content).overflowY).toBe('auto');
  });

  it('lays out content-scroll chrome with touching rails that fill the shell height', async () => {
    const { container } = await render(
      <div style={{ height: '300px' }}>
        <Shell scroll="content" sidebar="Navigation" topbar="Toolbar" aside="Context">
          Document
        </Shell>
      </div>,
    );
    const shell = container.querySelector<HTMLElement>('.lyra-shell')!;
    const sidebar = container.querySelector<HTMLElement>('.lyra-shell__sidebar')!;
    const main = container.querySelector<HTMLElement>('.lyra-shell__main')!;
    const aside = container.querySelector<HTMLElement>('.lyra-shell__aside')!;

    const shellRect = shell.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const asideRect = aside.getBoundingClientRect();

    expect(sidebarRect.right).toBeCloseTo(mainRect.left, 1);
    expect(mainRect.right).toBeCloseTo(asideRect.left, 1);
    expect(sidebarRect.height).toBeCloseTo(shellRect.height, 1);
    expect(mainRect.height).toBeCloseTo(shellRect.height, 1);
    expect(asideRect.height).toBeCloseTo(shellRect.height, 1);
    expect(shellRect.height).toBeCloseTo(300, 1);
    expect(getComputedStyle(shell).columnGap).toBe('0px');
    expect(getComputedStyle(sidebar).paddingRight).toBe('0px');
  });
});
