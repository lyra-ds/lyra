import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];
let nextWorkspaceSwitcherId = 0;

Alpine.plugin(lyra);

function mountWorkspaceSwitcher({
  defaultOpen = false,
  position,
}: {
  defaultOpen?: boolean;
  position?: string;
} = {}): HTMLElement {
  const host = document.createElement('div');
  const id = `workspace-switcher-${++nextWorkspaceSwitcherId}`;
  host.innerHTML = `
    <div
      id="${id}"
      x-data="lyraWorkspaceSwitcher({ defaultOpen: ${defaultOpen} })"
      class="lyra-wssw"
      ${position ? `style="position: fixed; ${position}"` : ''}
    >
      <button class="lyra-wssw__trigger" aria-controls="${id}-listbox" x-bind="trigger">
        <span class="lyra-wssw__id"><span class="lyra-wssw__name">Acme</span></span>
      </button>
      <div
        id="${id}-listbox"
        class="lyra-wssw__pop"
        role="listbox"
        aria-labelledby="${id}-listbox-label"
        x-bind="popover"
      >
        <span id="${id}-listbox-label" class="lyra-wssw__pop-label">Workspaces</span>
        <button class="lyra-wssw__item" role="option" aria-selected="false" data-id="acme" x-bind="option">Acme</button>
        <button class="lyra-wssw__item" role="option" aria-selected="true" data-id="lyra" x-bind="option">Lyra</button>
        <button class="lyra-wssw__item" role="option" aria-selected="false" data-id="orbit" x-bind="option">Orbit</button>
      </div>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-wssw');
  if (!element) throw new Error('Expected workspace switcher root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-wssw__trigger');
  if (!element) throw new Error('Expected workspace switcher trigger');
  return element;
}

function popover(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="listbox"]');
  if (!element) throw new Error('Expected workspace switcher popover');
  return element;
}

function options(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(popover(host).querySelectorAll<HTMLButtonElement>('[role="option"]'));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraWorkspaceSwitcher', () => {
  it('toggles from click and binds the trigger to the served listbox', async () => {
    const host = mountWorkspaceSwitcher();
    const control = trigger(host);
    const listbox = popover(host);

    expect(control.type).toBe('button');
    expect(control.getAttribute('aria-haspopup')).toBe('listbox');
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(control.getAttribute('aria-controls')).toBe(listbox.id);
    expect(listbox.getAttribute('aria-labelledby')).toBe(`${root(host).id}-listbox-label`);
    expect(listbox.style.display).toBe('none');

    await userEvent.click(control);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('true');
    expect(listbox.style.display).not.toBe('none');

    await userEvent.click(control);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(listbox.style.display).toBe('none');
  });

  it('focuses the selected, first, or last option when the trigger opens from its keys', async () => {
    const host = mountWorkspaceSwitcher();
    const control = trigger(host);

    control.focus();
    await userEvent.keyboard('{Enter}');
    await flush();
    await vi.waitFor(() => expect(document.activeElement).toBe(options(host)[1]), {
      timeout: 3000,
    });

    await userEvent.keyboard('{Escape}');
    await flush();
    await userEvent.keyboard(' ');
    await flush();
    await vi.waitFor(() => expect(document.activeElement).toBe(options(host)[1]), {
      timeout: 3000,
    });

    await userEvent.keyboard('{Escape}');
    await flush();
    await userEvent.keyboard('{ArrowDown}');
    await flush();
    await vi.waitFor(() => expect(document.activeElement).toBe(options(host)[0]), {
      timeout: 3000,
    });

    await userEvent.keyboard('{Escape}');
    await flush();
    await userEvent.keyboard('{ArrowUp}');
    await flush();
    await vi.waitFor(() => expect(document.activeElement).toBe(options(host)[2]), {
      timeout: 3000,
    });
  });

  it('roves option focus circularly, supports Home and End, and restores the trigger on Escape', async () => {
    const host = mountWorkspaceSwitcher();
    const control = trigger(host);

    await userEvent.click(control);
    await flush();
    await vi.waitFor(() => expect(document.activeElement).toBe(options(host)[1]), {
      timeout: 3000,
    });

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options(host)[2]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(options(host)[0]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(options(host)[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(options(host)[0]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(options(host)[2]);

    await userEvent.keyboard('{Escape}');
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(control);
  });

  it('closes on Tab without preventing it or restoring trigger focus', async () => {
    const host = mountWorkspaceSwitcher();
    const control = trigger(host);

    await userEvent.click(control);
    await flush();
    const selected = options(host)[1];
    selected.focus();
    const tab = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' });
    selected.dispatchEvent(tab);
    await flush();

    expect(tab.defaultPrevented).toBe(false);
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(selected);
  });

  it('closes on an outside mousedown without restoring focus', async () => {
    const host = mountWorkspaceSwitcher();
    const control = trigger(host);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    mountedHosts.push(outside);

    await userEvent.click(control);
    await flush();
    options(host)[1].focus();
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flush();

    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(options(host)[1]);
  });

  it('dispatches the selected id, closes, restores focus, and leaves served selection unchanged', async () => {
    const host = mountWorkspaceSwitcher();
    const control = trigger(host);
    const received: Array<{ id: string }> = [];
    root(host).addEventListener('lyra:change', (event) => {
      received.push((event as CustomEvent<{ id: string }>).detail);
    });

    await userEvent.click(control);
    await flush();
    await userEvent.click(options(host)[2]);
    await flush();

    expect(received).toEqual([{ id: 'orbit' }]);
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(control);
    expect(options(host).map((option) => option.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('flips upward only when real layout leaves less room below than above', async () => {
    const cramped = mountWorkspaceSwitcher({ position: 'bottom: 0; left: 40vw;' });
    await userEvent.click(trigger(cramped));
    await flush();

    const crampedTrigger = trigger(cramped);
    const crampedPopover = popover(cramped);
    const crampedRect = crampedTrigger.getBoundingClientRect();
    const crampedBelow = window.innerHeight - crampedRect.bottom - 6;
    const crampedAbove = crampedRect.top - 6;
    expect(crampedPopover.offsetHeight).toBeGreaterThan(crampedBelow);
    expect(crampedAbove).toBeGreaterThan(crampedBelow);
    expect(crampedPopover.classList).toContain('lyra-wssw__pop--up');

    const roomy = mountWorkspaceSwitcher();
    await userEvent.click(trigger(roomy));
    await flush();
    expect(popover(roomy).classList).not.toContain('lyra-wssw__pop--up');
  });

  it('synchronizes open with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: false }">
        <div id="modelable-workspace-switcher" x-data="lyraWorkspaceSwitcher()" x-modelable="open" x-model="outer" class="lyra-wssw">
          <button class="lyra-wssw__trigger" aria-controls="modelable-workspace-switcher-listbox" x-bind="trigger">Current workspace</button>
          <div id="modelable-workspace-switcher-listbox" class="lyra-wssw__pop" role="listbox" aria-labelledby="modelable-workspace-switcher-listbox-label" x-bind="popover">
            <span id="modelable-workspace-switcher-listbox-label" class="lyra-wssw__pop-label">Workspaces</span>
            <button class="lyra-wssw__item" role="option" aria-selected="false" data-id="acme" x-bind="option">Acme</button>
            <button class="lyra-wssw__item" role="option" aria-selected="true" data-id="lyra" x-bind="option">Lyra</button>
            <button class="lyra-wssw__item" role="option" aria-selected="false" data-id="orbit" x-bind="option">Orbit</button>
          </div>
        </div>
        <button type="button" data-testid="external-open" x-on:click="outer = true">Open externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const control = trigger(host);
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-open"]');
    if (!external) throw new Error('Expected external state control');

    await userEvent.click(external);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('true');

    await userEvent.click(control);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      false,
    );
  });

  it('is axe clean while closed and open', async () => {
    const host = mountWorkspaceSwitcher();
    await expectNoAxeViolations(host);

    await userEvent.click(trigger(host));
    await flush();
    await expectNoAxeViolations(host);
  });
});
