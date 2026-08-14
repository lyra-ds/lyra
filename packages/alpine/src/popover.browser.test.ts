import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountPopover({
  options = '{}',
  position,
}: {
  options?: string;
  position?: string;
} = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div
      x-data="lyraPopover(${options})"
      class="lyra-popover-anchor"
      ${position ? `style="position: fixed; ${position}"` : ''}
    >
      <button x-bind="trigger">Options</button>
      <div class="lyra-popover" x-bind="panel">
        <button type="button">Panel action</button>
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
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-popover-anchor');
  if (!element) throw new Error('Expected popover root');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[x-bind="trigger"]');
  if (!element) throw new Error('Expected popover trigger');
  return element;
}

function panel(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[x-bind="panel"]');
  if (!element) throw new Error('Expected popover panel');
  return element;
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraPopover', () => {
  it('seeds modelable open state and the panel label from options', () => {
    const host = mountPopover({ options: "{ defaultOpen: true, ariaLabel: 'Filters' }" });
    const control = trigger(host);
    const popup = panel(host);

    expect(control.getAttribute('aria-expanded')).toBe('true');
    expect(popup.style.display).not.toBe('none');
    expect(popup.getAttribute('aria-label')).toBe('Filters');
  });

  it('wires the trigger ARIA trio to its panel and opens from click', async () => {
    const host = mountPopover();
    const control = trigger(host);
    const popup = panel(host);

    expect(control.getAttribute('type')).toBe('button');
    expect(control.getAttribute('aria-haspopup')).toBe('dialog');
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(popup.id).toBe(`${root(host).id}-panel`);
    expect(control.getAttribute('aria-controls')).toBe(popup.id);
    expect(popup.getAttribute('role')).toBe('dialog');
    expect(popup.getAttribute('aria-label')).toBe('Popover');
    expect(popup.style.display).toBe('none');

    await userEvent.click(control);
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('true');
    expect(popup.style.display).not.toBe('none');
  });

  it('toggles from Enter and Space unless an earlier handler prevents the key', async () => {
    const host = mountPopover();
    const control = trigger(host);

    control.focus();
    await userEvent.keyboard('{Enter}');
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('true');

    await userEvent.keyboard(' ');
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');

    const preventToggle = (event: Event): void => event.preventDefault();
    root(host).addEventListener('keydown', preventToggle, true);
    try {
      const preventedEnter = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
      });
      control.dispatchEvent(preventedEnter);
      await flush();
      expect(preventedEnter.defaultPrevented).toBe(true);
      expect(control.getAttribute('aria-expanded')).toBe('false');

      const preventedSpace = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: ' ',
      });
      control.dispatchEvent(preventedSpace);
      await flush();
      expect(preventedSpace.defaultPrevented).toBe(true);
      expect(control.getAttribute('aria-expanded')).toBe('false');
    } finally {
      root(host).removeEventListener('keydown', preventToggle, true);
    }
  });

  it('keeps an inside mousedown open and closes on a document mousedown outside', async () => {
    const host = mountPopover();
    const control = trigger(host);
    const popup = panel(host);
    const inside = popup.querySelector<HTMLButtonElement>('button');
    if (!inside) throw new Error('Expected panel action');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    mountedHosts.push(outside);

    await userEvent.click(control);
    await flush();
    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('true');

    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await flush();
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(popup.style.display).toBe('none');
  });

  it('closes on document Escape, prevents it, and restores trigger focus', async () => {
    const host = mountPopover();
    const control = trigger(host);
    const escape = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    });

    await userEvent.click(control);
    await flush();
    document.dispatchEvent(escape);
    await flush();

    expect(escape.defaultPrevented).toBe(true);
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(control);
  });

  it('resolves automatic placement from a forced real-layout flip', async () => {
    const host = mountPopover({ position: 'bottom: 0; left: 40vw;' });
    const control = trigger(host);
    const popup = panel(host);

    await userEvent.click(control);
    await flush();

    const rect = control.getBoundingClientRect();
    const roomBelow = window.innerHeight - rect.bottom - 8;
    const roomAbove = rect.top - 8;
    expect(popup.offsetHeight).toBeGreaterThan(roomBelow);
    expect(roomAbove).toBeGreaterThan(roomBelow);
    expect(popup.classList).toContain('lyra-popover--top');
    expect(popup.classList).toContain('lyra-popover--align-start');
  });

  it('honours explicit side and alignment over measured placement', async () => {
    const host = mountPopover({
      options: "{ side: 'bottom', align: 'center' }",
      position: 'bottom: 0; left: 40vw;',
    });
    const control = trigger(host);
    const popup = panel(host);

    await userEvent.click(control);
    await flush();
    expect(popup.classList).toContain('lyra-popover--bottom');
    expect(popup.classList).toContain('lyra-popover--align-center');
  });

  it('sets the requested inline panel width', () => {
    const host = mountPopover({ options: '{ width: 280 }' });
    expect(panel(host).style.width).toBe('280px');
  });

  it('is axe clean while closed and open', async () => {
    const host = mountPopover();
    await expectNoAxeViolations(host);

    await userEvent.click(trigger(host));
    await flush();
    await expectNoAxeViolations(host);
  });

  it('synchronizes open with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: false }">
        <div x-data="lyraPopover()" x-modelable="open" x-model="outer" class="lyra-popover-anchor">
          <button x-bind="trigger">Options</button>
          <div class="lyra-popover" x-bind="panel">Panel content</div>
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
