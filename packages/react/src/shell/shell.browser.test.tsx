import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
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
  it('does not render empty rail or topbar elements for omitted slots', async () => {
    const screen = await render(<Shell>Document</Shell>);
    const { container } = screen;

    await expect.element(screen.getByRole('main')).toBeInTheDocument();
    expect(container.querySelector('.lyra-shell__sidebar')).toBeNull();
    expect(container.querySelector('.lyra-shell__topbar')).toBeNull();
    expect(container.querySelector('.lyra-shell__aside')).toBeNull();
    expect(container.querySelector('.lyra-shell')!.getAttribute('style')).toBeNull();
    expect((await axe.run(container)).violations).toEqual([]);
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
    expect((await axe.run(container)).violations).toEqual([]);
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
});
