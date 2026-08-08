import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountSidebarGroup({
  defaultCollapsed = false,
  serverRenderedCollapsed = false,
}: {
  defaultCollapsed?: boolean;
  serverRenderedCollapsed?: boolean;
} = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div class="lyra-sbgroup${serverRenderedCollapsed ? ' lyra-sbgroup--collapsed' : ''}" x-data="lyraSidebarGroup({ defaultCollapsed: ${defaultCollapsed} })" x-bind="root">
      <button class="lyra-sbgroup__label lyra-sbgroup__label--btn" x-bind="label">Projects</button>
      <template x-if="!collapsed">
        <div class="lyra-sbgroup__items">
          <button class="lyra-sbgroup__item lyra-sbgroup__item--active" aria-current="page" data-id="inbox" x-bind="item">Inbox</button>
          <button class="lyra-sbgroup__item" data-id="archive" x-bind="item">Archive</button>
        </div>
      </template>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-sbgroup');
  if (!element) throw new Error('Expected sidebar group root');
  return element;
}

function label(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-sbgroup__label--btn');
  if (!element) throw new Error('Expected sidebar group label');
  return element;
}

function items(host: HTMLElement): HTMLElement | null {
  return host.querySelector<HTMLElement>('.lyra-sbgroup__items');
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraSidebarGroup', () => {
  it('seeds collapsed state and toggles ARIA, modifier class, and template-mounted items', async () => {
    const host = mountSidebarGroup({ serverRenderedCollapsed: true });
    await flush();

    expect(root(host).classList).not.toContain('lyra-sbgroup--collapsed');
    expect(label(host).type).toBe('button');
    expect(label(host).getAttribute('aria-expanded')).toBe('true');
    expect(items(host)).toBeInstanceOf(HTMLElement);

    await userEvent.click(label(host));
    await flush();

    expect(root(host).classList).toContain('lyra-sbgroup--collapsed');
    expect(label(host).getAttribute('aria-expanded')).toBe('false');
    expect(items(host)).toBeNull();

    await userEvent.click(label(host));
    await flush();

    expect(root(host).classList).not.toContain('lyra-sbgroup--collapsed');
    expect(label(host).getAttribute('aria-expanded')).toBe('true');
    expect(items(host)).toBeInstanceOf(HTMLElement);
  });

  it('uses defaultCollapsed to seed an initially unmounted item list', async () => {
    const host = mountSidebarGroup({ defaultCollapsed: true });
    await flush();

    expect(root(host).classList).toContain('lyra-sbgroup--collapsed');
    expect(label(host).getAttribute('aria-expanded')).toBe('false');
    expect(items(host)).toBeNull();
  });

  it('dispatches a bubbling select event with the clicked item id', async () => {
    const host = mountSidebarGroup();
    const received: Array<{ id: string }> = [];
    root(host).addEventListener('lyra:select', (event) => {
      received.push((event as CustomEvent<{ id: string }>).detail);
    });
    await flush();

    const inbox = host.querySelector<HTMLButtonElement>('[data-id="inbox"]');
    if (!inbox) throw new Error('Expected inbox item');
    expect(inbox.type).toBe('button');
    await userEvent.click(inbox);
    await flush();

    expect(received).toEqual([{ id: 'inbox' }]);
  });

  it('synchronizes collapsed with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: true }">
        <div class="lyra-sbgroup" x-data="lyraSidebarGroup()" x-modelable="collapsed" x-model="outer" x-bind="root">
          <button class="lyra-sbgroup__label lyra-sbgroup__label--btn" x-bind="label">Projects</button>
          <template x-if="!collapsed"><div class="lyra-sbgroup__items"><button class="lyra-sbgroup__item" data-id="inbox" x-bind="item">Inbox</button></div></template>
        </div>
        <button type="button" data-testid="external-expand" x-on:click="outer = false">Expand externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    await flush();

    expect(root(host).classList).toContain('lyra-sbgroup--collapsed');
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-expand"]');
    if (!external) throw new Error('Expected external control');
    await userEvent.click(external);
    await flush();

    expect(root(host).classList).not.toContain('lyra-sbgroup--collapsed');
    expect((Alpine.$data(root(host)) as { collapsed: boolean }).collapsed).toBe(false);

    await userEvent.click(label(host));
    await flush();

    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      true,
    );
  });

  it('is axe clean expanded and collapsed', async () => {
    const host = mountSidebarGroup();
    await flush();
    await expectNoAxeViolations(host);

    await userEvent.click(label(host));
    await flush();
    await expectNoAxeViolations(host);
  });
});
