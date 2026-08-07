import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountTooltip({
  placement = 'top',
  describedBy,
  position,
}: {
  placement?: 'top' | 'bottom' | 'left' | 'right';
  describedBy?: string;
  position?: string;
} = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div ${position ? `style="position: fixed; ${position}"` : ''} x-data="lyraTooltip({ tip: 'More information', placement: '${placement}' })" class="lyra-tooltip" x-bind="root">
      <button type="button" ${describedBy ? `aria-describedby="${describedBy}"` : ''} x-bind="target">Info</button>
      <span role="tooltip" hidden x-bind="bubble">More information</span>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

// Synchronize with Alpine's watcher flush, the placement measurement queued in $nextTick, and
// the next browser frame that applies dynamic bindings and generated pseudo-element layout.
async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-tooltip');
  if (!element) throw new Error('Expected tooltip root');
  return element;
}

function target(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('button');
  if (!element) throw new Error('Expected tooltip target');
  return element;
}

function bubble(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="tooltip"]');
  if (!element) throw new Error('Expected tooltip bubble');
  return element;
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraTooltip', () => {
  it('wires its hidden bubble id into aria-describedby without replacing an existing value', () => {
    const host = mountTooltip({ describedBy: 'external-description' });
    const control = target(host);
    const hiddenBubble = bubble(host);

    expect(root(host).getAttribute('data-tip')).toBe('More information');
    expect(hiddenBubble.hidden).toBe(true);
    expect(hiddenBubble.id).not.toBe('');
    expect(control.getAttribute('aria-describedby')).toBe(
      `external-description ${hiddenBubble.id}`,
    );
  });

  it('opens and closes from hover and focus transitions', async () => {
    const host = mountTooltip();
    const tooltip = root(host);
    const control = target(host);

    await userEvent.hover(control);
    await flush();
    expect(tooltip.getAttribute('data-state')).toBe('open');

    await userEvent.unhover(control);
    await flush();
    expect(tooltip.getAttribute('data-state')).toBe('closed');

    control.focus();
    await flush();
    expect(tooltip.getAttribute('data-state')).toBe('open');

    control.blur();
    await flush();
    expect(tooltip.getAttribute('data-state')).toBe('closed');
  });

  it('closes a hover-opened tooltip from document Escape without moving focus', async () => {
    const host = mountTooltip();
    const tooltip = root(host);
    const control = target(host);
    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' });

    tooltip.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await flush();
    expect(tooltip.getAttribute('data-state')).toBe('open');
    expect(document.activeElement).not.toBe(control);

    document.dispatchEvent(escape);
    await flush();
    expect(tooltip.getAttribute('data-state')).toBe('closed');
    expect(document.activeElement).not.toBe(control);
  });

  it('closes from Escape on its focused target while preserving focus and preventing the key', async () => {
    const host = mountTooltip();
    const tooltip = root(host);
    const control = target(host);
    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' });

    control.focus();
    await flush();
    expect(tooltip.getAttribute('data-state')).toBe('open');

    control.dispatchEvent(escape);
    await flush();
    expect(escape.defaultPrevented).toBe(true);
    expect(tooltip.getAttribute('data-state')).toBe('closed');
    expect(document.activeElement).toBe(control);
  });

  it('keeps top when it fits and flips it to bottom when the real pseudo-element would clip', async () => {
    const fittingHost = mountTooltip({ position: 'top: 45vh; left: 40vw;' });
    const fittingTooltip = root(fittingHost);
    target(fittingHost).focus();
    await vi.waitFor(() => expect(fittingTooltip.className).toBe('lyra-tooltip'));

    const clippedHost = mountTooltip({ position: 'top: 0; left: 40vw;' });
    const clippedTooltip = root(clippedHost);
    const clippedTarget = target(clippedHost);
    const box = clippedTarget.getBoundingClientRect();
    const bubbleHeight = parseFloat(getComputedStyle(clippedTooltip, '::after').height);
    expect(box.top).toBeLessThan(bubbleHeight + 6);

    clippedTarget.focus();
    await vi.waitFor(() => {
      expect(clippedTooltip.className).toBe('lyra-tooltip lyra-tooltip--bottom');
    });
  });

  it('honours an explicit right placement when it fits', async () => {
    const host = mountTooltip({ placement: 'right', position: 'top: 45vh; left: 40vw;' });
    const tooltip = root(host);

    target(host).focus();
    await vi.waitFor(() => {
      expect(tooltip.className).toBe('lyra-tooltip lyra-tooltip--right');
    });
  });

  it('is axe clean while closed and open', async () => {
    const host = mountTooltip();
    await expectNoAxeViolations(host);

    target(host).focus();
    await flush();
    await expectNoAxeViolations(host);
  });
});
