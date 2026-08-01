import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import axe from 'axe-core';
import '@lyra-ds/styles/styles.css';
import { Navbar } from './index';

type VitestBrowserRunner = { iframeId: string; sessionId: string };

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

describe('Navbar', () => {
  it('omits every optional slot wrapper when slots are absent', async () => {
    const { container } = await render(<Navbar />);

    await expect.element(container.querySelector('header')!).toBeInTheDocument();
    expect(container.querySelector('.lyra-navbar__brand')).toBeNull();
    expect(container.querySelector('.lyra-navbar__nav')).toBeNull();
    expect(container.querySelector('.lyra-navbar__actions')).toBeNull();
    expect((await axe.run(container)).violations).toEqual([]);
  });

  it('renders a labelled navigation landmark when the nav slot is supplied', async () => {
    const screen = await render(<Navbar navLabel="Documentation" nav={<a href="/docs">Docs</a>} />);

    await expect
      .element(screen.getByRole('navigation', { name: 'Documentation' }))
      .toBeInTheDocument();
  });

  it('uses the stylesheet sticky default and allows sticky to opt out', async () => {
    const { container, rerender } = await render(<Navbar />);
    const navbar = container.querySelector<HTMLElement>('.lyra-navbar')!;

    expect(getComputedStyle(navbar).position).toBe('sticky');
    expect(navbar.className).not.toContain('lyra-navbar--static');

    await rerender(<Navbar sticky={false} />);
    expect(navbar.className).toContain('lyra-navbar--static');
    expect(getComputedStyle(navbar).position).toBe('static');
  });

  it('wraps the navigation onto its own visible row without horizontal overflow at 375px', async () => {
    await setViewport(375, 800);
    const { container } = await render(
      <Navbar
        brand={<a href="/">Brand</a>}
        navLabel="Primary"
        nav={
          <>
            <a href="/docs">Documentation</a>
            <a href="/components">Components</a>
          </>
        }
        actions={
          <>
            <button type="button">Search</button>
            <button type="button">Theme</button>
          </>
        }
      />,
    );
    const navbar = container.querySelector<HTMLElement>('.lyra-navbar')!;
    const nav = container.querySelector<HTMLElement>('.lyra-navbar__nav')!;

    expect(getComputedStyle(nav).order).toBe('3');
    expect(nav.getBoundingClientRect().top).toBeGreaterThan(
      navbar.firstElementChild!.getBoundingClientRect().top,
    );
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await expect.element(nav.querySelector('a')!).toBeInTheDocument();
  });
});
