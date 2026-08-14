import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

type SidebarOptions = {
  defaultCollapsed?: boolean;
  width?: number;
  labels?: { collapse: string; expand: string };
  serverRenderedRail?: boolean;
};

function sidebarMarkup({
  defaultCollapsed = false,
  width = 260,
  labels = { collapse: 'Collapse sidebar', expand: 'Expand sidebar' },
  serverRenderedRail = false,
}: SidebarOptions = {}): string {
  return `
    <nav
      class="lyra-appsidebar${serverRenderedRail ? ' lyra-appsidebar--rail' : ''}"
      aria-label="Application navigation"
      x-data="lyraAppSidebar({ defaultCollapsed: ${defaultCollapsed}, width: ${width}, labels: { collapse: '${labels.collapse}', expand: '${labels.expand}' } })"
      x-bind="root"
    >
      <div class="lyra-appsidebar__brand"><a href="/" aria-label="Lyra home">Lyra</a></div>
      <div class="lyra-appsidebar__groups">
        <div class="lyra-sbgroup" x-data="lyraSidebarGroup()" x-bind="root">
          <div class="lyra-sbgroup__label">Workspace</div>
          <div class="lyra-sbgroup__items">
            <a class="lyra-sbgroup__item lyra-sbgroup__item--active" href="/overview" aria-current="page" title="Overview" aria-label="Overview"><span aria-hidden="true">O</span><span class="lyra-sbgroup__item-label">Overview</span></a>
            <a class="lyra-sbgroup__item" href="/settings" title="Settings" aria-label="Settings"><span aria-hidden="true">S</span><span class="lyra-sbgroup__item-label">Settings</span></a>
          </div>
        </div>
      </div>
      <div class="lyra-appsidebar__footer"><a href="/account">Account</a></div>
      <button class="lyra-appsidebar__toggle" x-bind="toggle">
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path data-testid="collapse-chevron" d="m15 18-6-6 6-6" x-show="!collapsed"></path>
          <path data-testid="expand-chevron" d="m9 18 6-6-6-6" x-show="collapsed"></path>
        </svg>
      </button>
    </nav>
  `;
}

function mountAppSidebar(options: SidebarOptions = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = sidebarMarkup(options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

async function flushShow(): Promise<void> {
  await Alpine.nextTick();
  // x-show commits visibility through Alpine's transition frame after the reactive flush.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-appsidebar');
  if (!element) throw new Error('Expected app sidebar root');
  return element;
}

function toggle(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-appsidebar__toggle');
  if (!element) throw new Error('Expected app sidebar toggle');
  return element;
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraAppSidebar', () => {
  it('seeds a rail and removes a server-rendered rail class when expanded', async () => {
    const host = mountAppSidebar({ defaultCollapsed: true, serverRenderedRail: true });
    await flush();

    expect(root(host).classList).toContain('lyra-appsidebar--rail');
    expect(root(host).style.getPropertyValue('--appsidebar-width')).toBe('64px');

    await userEvent.click(toggle(host));
    await flush();

    expect(root(host).classList).not.toContain('lyra-appsidebar--rail');
    expect(root(host).style.getPropertyValue('--appsidebar-width')).toBe('260px');
  });

  it('adds a rail class when collapsed markup is served ordinarily', async () => {
    const host = mountAppSidebar({ defaultCollapsed: true, serverRenderedRail: false });
    await flush();

    expect(root(host).classList).toContain('lyra-appsidebar--rail');
  });

  it('switches the sidebar width between expanded and rail values', async () => {
    const host = mountAppSidebar();
    await flush();

    expect(root(host).style.getPropertyValue('--appsidebar-width')).toBe('260px');
    expect(root(host).style.width).toBe('var(--appsidebar-width)');

    await userEvent.click(toggle(host));
    await flush();

    expect(root(host).style.getPropertyValue('--appsidebar-width')).toBe('64px');

    await userEvent.click(toggle(host));
    await flush();

    expect(root(host).style.getPropertyValue('--appsidebar-width')).toBe('260px');
  });

  it('honours a custom expanded width', async () => {
    const host = mountAppSidebar({ width: 320 });
    await flush();

    expect(root(host).style.getPropertyValue('--appsidebar-width')).toBe('320px');

    await userEvent.click(toggle(host));
    await flush();

    expect(root(host).style.getPropertyValue('--appsidebar-width')).toBe('64px');
  });

  it('swaps default and customized toggle labels', async () => {
    const defaultHost = mountAppSidebar();
    await flush();

    expect(toggle(defaultHost).getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(toggle(defaultHost).title).toBe('Collapse sidebar');

    await userEvent.click(toggle(defaultHost));
    await flush();

    expect(toggle(defaultHost).getAttribute('aria-label')).toBe('Expand sidebar');
    expect(toggle(defaultHost).title).toBe('Expand sidebar');

    const customHost = mountAppSidebar({
      labels: { collapse: 'Minimize navigation', expand: 'Restore navigation' },
    });
    await flush();

    expect(toggle(customHost).getAttribute('aria-label')).toBe('Minimize navigation');
    await userEvent.click(toggle(customHost));
    await flush();
    expect(toggle(customHost).getAttribute('aria-label')).toBe('Restore navigation');
    expect(toggle(customHost).title).toBe('Restore navigation');
  });

  it('dispatches the new collapsed state in a bubbling collapse event', async () => {
    const host = mountAppSidebar();
    const received: Array<{ collapsed: boolean }> = [];
    host.addEventListener('lyra:collapse', (event) => {
      received.push((event as CustomEvent<{ collapsed: boolean }>).detail);
    });
    await flush();

    await userEvent.click(toggle(host));
    await flush();

    expect(received).toEqual([{ collapsed: true }]);
  });

  it('swaps the served chevron paths with the collapsed state', async () => {
    const host = mountAppSidebar();
    await flush();
    const collapseChevron = host.querySelector<SVGPathElement>('[data-testid="collapse-chevron"]');
    const expandChevron = host.querySelector<SVGPathElement>('[data-testid="expand-chevron"]');
    if (!collapseChevron || !expandChevron) throw new Error('Expected served chevrons');

    expect(collapseChevron.getAttribute('x-show')).toBe('!collapsed');
    expect(expandChevron.getAttribute('x-show')).toBe('collapsed');
    expect(getComputedStyle(collapseChevron).display).not.toBe('none');
    expect(getComputedStyle(expandChevron).display).toBe('none');

    await userEvent.click(toggle(host));
    await flushShow();

    expect(getComputedStyle(collapseChevron).display).toBe('none');
    expect(getComputedStyle(expandChevron).display).not.toBe('none');
  });

  it('synchronizes collapsed with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: true }">
        ${sidebarMarkup({ serverRenderedRail: true }).replace(
          'x-bind="root"',
          'x-modelable="collapsed" x-model="outer" x-bind="root"',
        )}
        <button type="button" data-testid="external-expand" x-on:click="outer = false">Expand externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    await flush();

    expect(root(host).classList).toContain('lyra-appsidebar--rail');
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-expand"]');
    if (!external) throw new Error('Expected external expand control');
    await userEvent.click(external);
    await flush();

    expect(root(host).classList).not.toContain('lyra-appsidebar--rail');
    expect((Alpine.$data(root(host)) as { collapsed: boolean }).collapsed).toBe(false);

    await userEvent.click(toggle(host));
    await flush();

    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      true,
    );
  });

  it('is axe clean while expanded and in rail mode', async () => {
    const host = mountAppSidebar();
    await flush();

    await expectNoAxeViolations(root(host));

    await userEvent.click(toggle(host));
    await flush();

    await expectNoAxeViolations(root(host));
  });
});
