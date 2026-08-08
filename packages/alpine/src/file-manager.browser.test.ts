import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function fileManagerMarkup({
  options = '{}',
  modelable,
  serverRenderedGridActive = false,
}: {
  options?: string;
  modelable?: string;
  serverRenderedGridActive?: boolean;
} = {}): string {
  return `
    <div ${modelable ? "x-data=\"{ outerView: 'list', outerQuery: '' }\"" : ''}>
      <div class="lyra-fm" x-data="lyraFileManager(${options})" ${modelable ?? ''}>
        <div class="lyra-fm__toolbar">
          <div class="lyra-fm__search">
            <input type="search" aria-label="Search files" x-bind="search">
          </div>
          <div class="lyra-fm__views" role="group" aria-label="View mode">
            <button class="lyra-fm__view" aria-label="List view" x-bind="listButton">List</button>
            <button class="lyra-fm__view${serverRenderedGridActive ? ' lyra-fm__view--on' : ''}" aria-label="Grid view" x-bind="gridButton">Grid</button>
          </div>
        </div>
        <ul class="lyra-fm__list" x-bind="list">
          <li class="lyra-fm__row" data-name="Projects">Projects</li>
          <li class="lyra-fm__row" data-name="report.PDF">report.PDF</li>
          <li class="lyra-fm__row" data-name="Notes">Notes</li>
        </ul>
        <div class="lyra-fm__grid" x-bind="grid">
          <div class="lyra-fm__card" data-name="Projects">Projects</div>
          <div class="lyra-fm__card" data-name="report.PDF">report.PDF</div>
          <div class="lyra-fm__card" data-name="Notes">Notes</div>
        </div>
        <p class="lyra-fm__empty" x-bind="empty">No files found.</p>
      </div>
      ${
        modelable
          ? `
            <button type="button" data-testid="external-view" x-on:click="outerView = 'grid'">Set grid</button>
            <button type="button" data-testid="external-query" x-on:click="outerQuery = 'notes'">Set notes</button>
          `
          : ''
      }
    </div>
  `;
}

function mountFileManager(options: Parameters<typeof fileManagerMarkup>[0] = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = fileManagerMarkup(options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-fm');
  if (!element) throw new Error('Expected file manager root');
  return element;
}

function search(host: HTMLElement): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('input[type="search"]');
  if (!element) throw new Error('Expected file search input');
  return element;
}

function viewButton(host: HTMLElement, view: 'list' | 'grid'): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>(
    `[aria-label="${view === 'list' ? 'List' : 'Grid'} view"]`,
  );
  if (!element) throw new Error(`Expected ${view} view button`);
  return element;
}

function tree(host: HTMLElement, view: 'list' | 'grid'): HTMLElement {
  const element = host.querySelector<HTMLElement>(
    view === 'list' ? '.lyra-fm__list' : '.lyra-fm__grid',
  );
  if (!element) throw new Error(`Expected ${view} tree`);
  return element;
}

function items(host: HTMLElement, view: 'list' | 'grid'): HTMLElement[] {
  return Array.from(tree(host, view).querySelectorAll<HTMLElement>('[data-name]'));
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
}

async function setQuery(host: HTMLElement, value: string): Promise<void> {
  const input = search(host);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraFileManager', () => {
  it('filters both served trees case-insensitively without removing their items', async () => {
    const host = mountFileManager({ options: "{ defaultQuery: 'pro' }" });
    await flush();

    expect(search(host).value).toBe('pro');
    for (const view of ['list', 'grid'] as const) {
      expect(items(host, view)).toHaveLength(3);
      expect(items(host, view).map((item) => item.hidden)).toEqual([false, true, true]);
    }

    await setQuery(host, ' RePoRt ');
    for (const view of ['list', 'grid'] as const) {
      expect(items(host, view)).toHaveLength(3);
      expect(items(host, view).map((item) => item.hidden)).toEqual([true, false, true]);
    }

    await setQuery(host, '');
    for (const view of ['list', 'grid'] as const) {
      expect(items(host, view).map((item) => item.hidden)).toEqual([false, false, false]);
    }
  });

  it('shows the served empty state only when the current tree has no matches', async () => {
    const host = mountFileManager();
    const empty = host.querySelector<HTMLElement>('.lyra-fm__empty');
    if (!empty) throw new Error('Expected empty state');

    // x-show reveals on a deferred frame (wave-1 lesson): wait for each transition to LAND
    // before triggering the next, or the pending reveal can arrive after the later hide.
    await setQuery(host, 'missing');
    await vi.waitFor(() => expect(getComputedStyle(empty).display).not.toBe('none'));

    await setQuery(host, 'notes');
    await vi.waitFor(() => expect(getComputedStyle(empty).display).toBe('none'));
  });

  it('switches the served view bindings and removes a server-rendered active modifier', async () => {
    const host = mountFileManager({ serverRenderedGridActive: true });
    const listButton = viewButton(host, 'list');
    const gridButton = viewButton(host, 'grid');
    await flush();

    expect(listButton.getAttribute('type')).toBe('button');
    expect(gridButton.getAttribute('type')).toBe('button');
    expect(listButton.getAttribute('aria-pressed')).toBe('true');
    expect(gridButton.getAttribute('aria-pressed')).toBe('false');
    expect(listButton.classList).toContain('lyra-fm__view--on');
    expect(gridButton.classList).not.toContain('lyra-fm__view--on');
    expect(getComputedStyle(tree(host, 'list')).display).not.toBe('none');
    expect(getComputedStyle(tree(host, 'grid')).display).toBe('none');

    await userEvent.click(gridButton);
    await flush();

    expect(listButton.getAttribute('aria-pressed')).toBe('false');
    expect(gridButton.getAttribute('aria-pressed')).toBe('true');
    expect(listButton.classList).not.toContain('lyra-fm__view--on');
    expect(gridButton.classList).toContain('lyra-fm__view--on');
    expect(getComputedStyle(tree(host, 'list')).display).toBe('none');
    expect(getComputedStyle(tree(host, 'grid')).display).not.toBe('none');
  });

  it('emits an interaction-only view event and synchronizes view with x-modelable', async () => {
    const host = mountFileManager({ modelable: 'x-modelable="view" x-model="outerView"' });
    const events: Array<{ view: 'list' | 'grid' }> = [];
    root(host).addEventListener('lyra:view', (event) => {
      events.push((event as CustomEvent<{ view: 'list' | 'grid' }>).detail);
    });
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-view"]');
    if (!external) throw new Error('Expected external view control');

    await userEvent.click(external);
    await flush();
    expect(viewButton(host, 'grid').getAttribute('aria-pressed')).toBe('true');
    expect(events).toEqual([]);

    await userEvent.click(viewButton(host, 'list'));
    await flush();
    expect(events).toEqual([{ view: 'list' }]);
    expect(
      (Alpine.$data(host.firstElementChild as HTMLElement) as { outerView: string }).outerView,
    ).toBe('list');
  });

  it('synchronizes query with x-modelable in both directions', async () => {
    const host = mountFileManager({ modelable: 'x-modelable="query" x-model="outerQuery"' });
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-query"]');
    if (!external) throw new Error('Expected external query control');

    await userEvent.click(external);
    await flush();
    expect(search(host).value).toBe('notes');
    expect(items(host, 'list').map((item) => item.hidden)).toEqual([true, true, false]);

    await setQuery(host, 'projects');
    expect(
      (Alpine.$data(host.firstElementChild as HTMLElement) as { outerQuery: string }).outerQuery,
    ).toBe('projects');
  });

  it('is axe clean in both list and grid views', async () => {
    const host = mountFileManager();
    await expectNoAxeViolations(root(host));

    await userEvent.click(viewButton(host, 'grid'));
    await flush();
    await expectNoAxeViolations(root(host));
  });
});
