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

function mountLogicalAlignmentDropdown({
  align,
  direction,
  nestedDirection,
}: {
  align?: 'start' | 'end';
  direction: 'ltr' | 'rtl';
  nestedDirection?: 'ltr' | 'rtl';
}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div dir="${direction}">
      ${nestedDirection ? `<div dir="${nestedDirection}">` : ''}
        <div
          x-data="lyraDropdown({ defaultOpen: true${align ? `, align: '${align}'` : ''} })"
          class="lyra-dropdown"
          style="left: 300px; position: fixed; top: 160px"
        >
          <button type="button" x-bind="trigger" style="height: 32px; width: 120px">Actions</button>
          <div x-bind="menu"><button type="button" x-bind="item">Edit</button></div>
        </div>
      ${nestedDirection ? '</div>' : ''}
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
}

async function waitForEntryAnimation(element: HTMLElement): Promise<void> {
  await Promise.all(element.getAnimations().map((animation) => animation.finished));
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

function mountTypeaheadDropdown(): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div x-data="{ outer: true }">
      <div x-data="lyraDropdown({ defaultOpen: true })" x-modelable="open" x-model="outer" class="lyra-dropdown">
        <button type="button" x-bind="trigger">Actions</button>
        <div x-bind="menu">
          <span class="lyra-menu__label">Archive group</span>
          <button type="button" x-bind="item"><span aria-hidden="true">Archive icon</span>Edit</button>
          <hr class="lyra-menu__sep">
          <button type="button" x-bind="item">Archive</button>
          <button type="button" x-bind="item" aria-disabled="true">Add</button>
          <button type="button" x-bind="item">Apply</button>
          <button type="button" x-bind="item">Ångström</button>
        </div>
      </div>
      <button type="button" data-testid="external-close" x-on:click="outer = false">Close externally</button>
      <button type="button" data-testid="external-open" x-on:click="outer = true">Open externally</button>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
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

  it.each([
    { name: 'inherited LTR default start', direction: 'ltr', edge: 'left' },
    { name: 'inherited RTL default start', direction: 'rtl', edge: 'right' },
    { name: 'inherited LTR explicit start', direction: 'ltr', align: 'start', edge: 'left' },
    { name: 'inherited LTR explicit end', direction: 'ltr', align: 'end', edge: 'right' },
    { name: 'inherited RTL explicit start', direction: 'rtl', align: 'start', edge: 'right' },
    { name: 'inherited RTL explicit end', direction: 'rtl', align: 'end', edge: 'left' },
    {
      name: 'nested LTR default start within RTL',
      direction: 'rtl',
      nestedDirection: 'ltr',
      edge: 'left',
    },
  ] as const)(
    'aligns $name logically after its entry animation',
    async ({ direction, nestedDirection, align, edge }) => {
      const host = mountLogicalAlignmentDropdown({ align, direction, nestedDirection });
      await flush();
      const popup = menu(host);

      await waitForEntryAnimation(popup);

      expect(popup.getBoundingClientRect()[edge]).toBeCloseTo(
        dropdown(host).getBoundingClientRect()[edge],
      );
    },
  );

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
    expect(document.activeElement).toBe(commands[0]);
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
    expect(document.activeElement).toBe(commands[1]);
  });

  it('typeaheads through rendered command labels without selecting or closing the menu', async () => {
    const host = mountTypeaheadDropdown();
    const control = trigger(host);
    const commands = menu(host).querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    commands[0]?.focus();

    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('p');
    expect(document.activeElement).toBe(commands[3]);

    await userEvent.keyboard('{Escape}{Enter}');
    commands[0]?.focus();
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[1]);
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[2]);

    await userEvent.keyboard('{Escape}{Enter}');
    commands[4]?.focus();
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(commands[1]);

    await userEvent.keyboard('{Escape}{Enter}');
    commands[0]?.focus();
    // Synthetic: native browser keyboard input does not reliably emit Unicode keydown events.
    commands[0]?.dispatchEvent(
      new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'å' }),
    );
    expect(document.activeElement).toBe(commands[4]);
    expect(control.getAttribute('aria-expanded')).toBe('true');

    await userEvent.keyboard('z');
    expect(document.activeElement).toBe(commands[4]);
    expect(control.getAttribute('aria-expanded')).toBe('true');
  });

  it('expires and clears the typeahead buffer when closed or destroyed', async () => {
    const host = mountTypeaheadDropdown();
    const commands = menu(host).querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    commands[0]?.focus();

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      // Synthetic: this live-DOM event lets the local fake clock prove the exact expiry boundary.
      commands[0]?.dispatchEvent(
        new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'a' }),
      );
      expect(document.activeElement).toBe(commands[1]);
      await vi.advanceTimersByTimeAsync(500);
      vi.useRealTimers();
      commands[1]?.focus();
      await userEvent.keyboard('e');
      expect(document.activeElement).toBe(commands[0]);

      const externalClose = host.querySelector<HTMLButtonElement>('[data-testid="external-close"]');
      const externalOpen = host.querySelector<HTMLButtonElement>('[data-testid="external-open"]');
      if (!externalClose || !externalOpen) throw new Error('Expected external controls');
      externalClose.focus();
      await userEvent.keyboard('{Enter}');
      await flush();
      externalOpen.focus();
      await userEvent.keyboard('{Enter}');
      await flush();
      commands[0]?.focus();
      await userEvent.keyboard('a');
      expect(document.activeElement).toBe(commands[1]);

      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      Alpine.destroyTree(dropdown(host));
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not typeahead from canceled, modified, composing, or space input', async () => {
    const host = mountTypeaheadDropdown();
    const commands = menu(host).querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    commands[0]?.focus();

    for (const options of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { isComposing: true },
    ]) {
      commands[0]?.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'a',
          ...options,
        }),
      );
      expect(document.activeElement).toBe(commands[0]);
    }

    const canceled = new window.KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'a',
    });
    canceled.preventDefault();
    commands[0]?.dispatchEvent(canceled);
    expect(document.activeElement).toBe(commands[0]);

    await userEvent.keyboard(' ');
    await flush();
    expect(trigger(host).getAttribute('aria-expanded')).toBe('false');
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
