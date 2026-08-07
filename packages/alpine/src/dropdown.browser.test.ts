import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountDropdown(options = '{}'): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div x-data="lyraDropdown(${options})" class="lyra-dropdown">
      <button type="button" x-bind="trigger">Actions</button>
      <div x-bind="menu">
        <span class="lyra-menu__label">Actions</span>
        <button type="button" x-bind="item">Edit</button>
        <hr class="lyra-menu__sep">
        <button type="button" class="lyra-menu__item--danger" x-bind="item">Archive</button>
      </div>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

// Two bare microtasks raced Alpine's scheduler under CI load (two different assertions bit on
// GitHub runners). Synchronize with Alpine's own flush, then hop a frame (x-show shows via
// requestAnimationFrame) and a macrotask so every deferred DOM effect has landed.
async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function dropdown(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-dropdown');
  if (!element) throw new Error('Expected dropdown root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-dropdown__trigger');
  if (!element) throw new Error('Expected dropdown trigger');
  return element;
}

function menu(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="menu"]');
  if (!element) throw new Error('Expected dropdown menu');
  return element;
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraDropdown', () => {
  it('opens and closes from its trigger while preserving the menu item danger class', async () => {
    const host = mountDropdown();
    const control = trigger(host);
    const popup = menu(host);

    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(popup.style.display).toBe('none');
    expect(popup.classList).toContain('lyra-menu');
    expect(host.querySelector('.lyra-menu__item--danger')?.classList).toContain('lyra-menu__item');

    await userEvent.click(control);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('true');
    expect(popup.style.display).not.toBe('none');

    await userEvent.click(control);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(popup.style.display).toBe('none');
  });

  it('emits menu placement classes, including an upward flip when below space is unavailable', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div style="height: calc(100vh - 60px)"></div>
      <div x-data="lyraDropdown({ align: 'end' })" class="lyra-dropdown">
        <button type="button" x-bind="trigger">Actions</button>
        <!-- A one-item menu measures ~54px — the same as the room left below — so the flip
             verdict would hinge on the runner's font metrics. Fix the height to keep the
             menu unambiguously taller than the space under the trigger. -->
        <div x-bind="menu"><button type="button" x-bind="item" style="height: 120px">Edit</button></div>
      </div>
      <div style="height: 150vh"></div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    await userEvent.click(trigger(host));
    await flush();
    expect(menu(host).classList).toContain('lyra-menu--end');
    expect(menu(host).classList).toContain('lyra-menu--up');
  });

  it('sets the trigger ARIA trio and derives a menu id from the root id', () => {
    const host = mountDropdown();
    const root = dropdown(host);
    const control = trigger(host);
    const popup = menu(host);

    expect(control.getAttribute('aria-haspopup')).toBe('menu');
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(root.id).not.toBe('');
    expect(popup.id).toBe(`${root.id}-menu`);
    expect(control.getAttribute('aria-controls')).toBe(popup.id);
  });

  it('moves DOM focus through commands and restores the trigger after Escape', async () => {
    const host = mountDropdown();
    const control = trigger(host);
    control.focus();

    await userEvent.keyboard('{ArrowDown}');
    await flush();
    const commands = menu(host).querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    // Focus entry rides $nextTick, which can flush after the two-microtask flush() under CI
    // load — poll instead of asserting a single tick (same fix as the Dialog WR-03 test).
    await vi.waitFor(() => expect(document.activeElement).toBe(commands[0]), { timeout: 3000 });
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(commands[0]);
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(control);

    await userEvent.keyboard('{ArrowUp}');
    await flush();
    await vi.waitFor(() => expect(document.activeElement).toBe(commands[1]), { timeout: 3000 });
  });

  it('closes after a command selection with focus restored, while Tab keeps native focus order', async () => {
    const host = mountDropdown();
    const control = trigger(host);

    await userEvent.click(control);
    await flush();
    const command = menu(host).querySelector<HTMLButtonElement>('[role="menuitem"]');
    if (!command) throw new Error('Expected dropdown command');
    await userEvent.click(command);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(control);

    await userEvent.keyboard('{Enter}');
    await flush();
    const reopenedCommand = menu(host).querySelector<HTMLButtonElement>('[role="menuitem"]');
    if (!reopenedCommand) throw new Error('Expected reopened dropdown command');
    await userEvent.keyboard('{Tab}');
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).not.toBe(reopenedCommand);
  });

  it('closes when a mousedown lands outside and removes that listener after close and destroy', async () => {
    const addListener = vi.spyOn(document, 'addEventListener');
    const removeListener = vi.spyOn(document, 'removeEventListener');
    try {
      const host = mountDropdown();
      const control = trigger(host);
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      mountedHosts.push(outside);

      control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flush();
      expect(addListener.mock.calls.filter(([type]) => type === 'mousedown')).toHaveLength(1);

      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await flush();
      expect(control.getAttribute('aria-expanded')).toBe('false');
      expect(removeListener.mock.calls.filter(([type]) => type === 'mousedown')).toHaveLength(1);

      control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await flush();
      const root = dropdown(host);
      Alpine.destroyTree(root);
      root.remove();
      expect(removeListener.mock.calls.filter(([type]) => type === 'mousedown')).toHaveLength(2);
    } finally {
      addListener.mockRestore();
      removeListener.mockRestore();
    }
  });

  it('is axe clean when closed and open', async () => {
    const host = mountDropdown();
    await expectNoAxeViolations(host);
    await userEvent.click(trigger(host));
    await flush();
    await expectNoAxeViolations(host);
  });

  it('synchronizes open with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: false }">
        <div x-data="lyraDropdown()" x-modelable="open" x-model="outer" class="lyra-dropdown">
          <button type="button" x-bind="trigger">Actions</button>
          <div x-bind="menu"><button type="button" x-bind="item">Edit</button></div>
        </div>
        <button type="button" data-testid="external-open" x-on:click="outer = true">Open externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const control = trigger(host);
    const externalControl = host.querySelector<HTMLButtonElement>('[data-testid="external-open"]');
    if (!externalControl) throw new Error('Expected external state control');

    await userEvent.click(externalControl);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('true');

    await userEvent.click(control);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      false,
    );
  });
});
