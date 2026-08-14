import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountDrawer(
  options = '{}',
  body = '<button type="button" data-testid="first">First</button><input aria-label="Middle"><button type="button" data-testid="last">Last</button>',
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div x-data="lyraDrawer(${options})">
      <button type="button" data-testid="trigger" x-on:click="open = true">Open</button>
      <button type="button" data-testid="outside">Background</button>
      <div class="lyra-drawer-overlay" x-bind="overlay">
        <div class="lyra-drawer" x-bind="panel">
          <div class="lyra-drawer__header">
            <h2 class="lyra-drawer__title" x-bind="title">Test drawer</h2>
            <button class="lyra-drawer__close" x-bind="close">×</button>
          </div>
          <div class="lyra-drawer__body">${body}</div>
        </div>
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
  const element = host.firstElementChild;
  if (!(element instanceof HTMLElement)) throw new Error('Expected drawer root');
  return element;
}

function overlay(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-drawer-overlay');
  if (!element) throw new Error('Expected drawer overlay');
  return element;
}

function panel(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-drawer');
  if (!element) throw new Error('Expected drawer panel');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[data-testid="trigger"]');
  if (!element) throw new Error('Expected trigger');
  return element;
}

async function openDrawer(host: HTMLElement): Promise<void> {
  const control = trigger(host);
  control.focus();
  await userEvent.click(control);
  await flush();
  expect(overlay(host).style.display).not.toBe('none');
}

async function dismissWithBackdrop(host: HTMLElement): Promise<void> {
  overlay(host).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flush();
}

function unmount(host: HTMLElement): void {
  Alpine.destroyTree(host);
  host.remove();
  mountedHosts.splice(mountedHosts.indexOf(host), 1);
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('lyraDrawer', () => {
  it('keeps consumer markup intact and wires panel ARIA to the generated title id', async () => {
    const host = mountDrawer();
    const drawer = panel(host);
    const heading = host.querySelector<HTMLElement>('.lyra-drawer__title');
    if (!heading) throw new Error('Expected title');

    expect(overlay(host).style.display).toBe('none');
    expect(overlay(host).className).toBe('lyra-drawer-overlay');
    expect(drawer.className).toBe('lyra-drawer');
    expect(drawer.getAttribute('role')).toBe('dialog');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(drawer.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.id).toBe(`${root(host).id}-title`);
    expect(drawer.getAttribute('tabindex')).toBe('-1');

    await openDrawer(host);
    expect(overlay(host).style.display).not.toBe('none');
  });

  it('uses an explicit labelId when supplied', () => {
    const host = mountDrawer("{ labelId: 'details-title' }");
    expect(host.querySelector('.lyra-drawer__title')?.id).toBe('details-title');
    expect(panel(host).getAttribute('aria-labelledby')).toBe('details-title');
  });

  it('focuses the first focusable, including one nested deeply in the body', async () => {
    const host = mountDrawer(
      '{}',
      '<div><section><button type="button" data-testid="deep">Deep</button></section></div>',
    );
    host.querySelector('.lyra-drawer__close')?.remove();
    await openDrawer(host);
    expect(document.activeElement).toBe(host.querySelector('[data-testid="deep"]'));
  });

  it('traps Tab at both edges and never reaches background content', async () => {
    const host = mountDrawer();
    await openDrawer(host);
    const first = host.querySelector<HTMLElement>('.lyra-drawer__close');
    const last = host.querySelector<HTMLElement>('[data-testid="last"]');
    const outside = host.querySelector<HTMLElement>('[data-testid="outside"]');
    if (!first || !last || !outside) throw new Error('Expected focus targets');

    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(first);
    first.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(last);
    expect(document.activeElement).not.toBe(outside);
  });

  it('contains zero-candidate focus and routes panel focus into either end of the live list', async () => {
    const host = mountDrawer('{}', 'Plain text only');
    await openDrawer(host);
    const drawer = panel(host);
    host.querySelector('.lyra-drawer__close')?.remove();
    drawer.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(drawer);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(drawer);

    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = 'Added later';
    drawer.appendChild(action);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(action);
    drawer.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(action);
  });

  it('closes through Escape, backdrop click, and the close button while restoring focus', async () => {
    const host = mountDrawer();
    const control = trigger(host);
    await openDrawer(host);
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(control);
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });

    await openDrawer(host);
    await dismissWithBackdrop(host);
    expect(document.activeElement).toBe(control);
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });

    await openDrawer(host);
    await userEvent.click(host.querySelector<HTMLButtonElement>('.lyra-drawer__close')!);
    expect(document.activeElement).toBe(control);
  });

  it('does not close for panel interactions but closes on a backdrop click without mousedown tracking', async () => {
    const host = mountDrawer();
    await openDrawer(host);
    panel(host).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(overlay(host).style.display).not.toBe('none');

    await dismissWithBackdrop(host);
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });
  });

  it('keeps closing classes through exit, unlocks scroll immediately, and removes the overlay by the fallback', async () => {
    document.body.style.paddingRight = '17px';
    const existingPadding = parseFloat(getComputedStyle(document.body).paddingRight);
    const host = mountDrawer();
    await openDrawer(host);
    const delta = window.innerWidth - document.documentElement.clientWidth;
    expect(document.body.style.overflow).toBe('hidden');
    expect(parseFloat(getComputedStyle(document.body).paddingRight)).toBeCloseTo(
      existingPadding + delta,
      1,
    );

    await dismissWithBackdrop(host);
    expect(overlay(host).className).toBe('lyra-drawer-overlay lyra-drawer-overlay--closing');
    expect(panel(host).className).toBe('lyra-drawer lyra-drawer--closing');
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('17px');
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });
  });

  it('only finalizes presence for the panel animation, never a bubbled child animation', async () => {
    const host = mountDrawer();
    await openDrawer(host);
    await dismissWithBackdrop(host);
    const child = host.querySelector<HTMLElement>('[data-testid="first"]');
    if (!child) throw new Error('Expected animated child');

    child.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await flush();
    expect(overlay(host).style.display).not.toBe('none');

    panel(host).dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });
  });

  it('cancels an exit on reopen and focuses again before a subsequent restore', async () => {
    const host = mountDrawer();
    const control = trigger(host);
    await openDrawer(host);
    await userEvent.keyboard('{Escape}');
    control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(overlay(host).classList).not.toContain('lyra-drawer-overlay--closing');
    await vi.waitFor(() => expect(panel(host).contains(document.activeElement)).toBe(true), {
      timeout: 3000,
    });
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(control);
  });

  it('is axe clean while closed and open', async () => {
    const host = mountDrawer();
    await expectNoAxeViolations(host);
    await openDrawer(host);
    await expectNoAxeViolations(host);
  });

  it('synchronizes its controllable open state with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: false }">
        <div x-data="lyraDrawer()" x-modelable="open" x-model="outer">
          <div class="lyra-drawer-overlay" x-bind="overlay"><div class="lyra-drawer" x-bind="panel"><h2 x-bind="title">Title</h2><button type="button" x-bind="close">×</button></div></div>
        </div>
        <button type="button" data-testid="external-open" x-on:click="outer = true">Open externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-open"]');
    if (!external) throw new Error('Expected external control');

    await userEvent.click(external);
    await flush();
    const drawerOverlay = host.querySelector<HTMLElement>('.lyra-drawer-overlay');
    if (!drawerOverlay) throw new Error('Expected drawer overlay');
    expect(drawerOverlay.style.display).not.toBe('none');
    await userEvent.click(host.querySelector<HTMLButtonElement>('[x-bind="close"]')!);
    await flush();
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      false,
    );
  });
});
