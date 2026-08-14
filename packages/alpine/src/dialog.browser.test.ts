import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountDialog(
  options = '{}',
  body = '<button type="button" data-testid="first">First</button><input aria-label="Middle"><button type="button" data-testid="last">Last</button>',
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div x-data="lyraDialog(${options})">
      <button type="button" data-testid="trigger" x-on:click="open = true">Open</button>
      <button type="button" data-testid="outside">Background</button>
      <div class="lyra-dialog-overlay" x-bind="overlay">
        <div class="lyra-dialog" x-bind="panel">
          <div class="lyra-dialog__header">
            <h2 class="lyra-dialog__title" x-bind="title">Test dialog</h2>
            <button class="lyra-dialog__close" x-bind="close">×</button>
          </div>
          <div class="lyra-dialog__body">${body}</div>
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
  if (!(element instanceof HTMLElement)) throw new Error('Expected dialog root');
  return element;
}

function overlay(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-dialog-overlay');
  if (!element) throw new Error('Expected dialog overlay');
  return element;
}

function panel(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-dialog');
  if (!element) throw new Error('Expected dialog panel');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[data-testid="trigger"]');
  if (!element) throw new Error('Expected trigger');
  return element;
}

async function openDialog(host: HTMLElement): Promise<void> {
  const control = trigger(host);
  control.focus();
  await userEvent.click(control);
  await flush();
  expect(overlay(host).style.display).not.toBe('none');
}

// Alpine flushes watchers/effects on a microtask, so state driven by the dismissal (focus
// restore, closing classes) is observable only after flush() — mirror of awaiting React effects.
async function backdropDismiss(host: HTMLElement): Promise<void> {
  const backdrop = overlay(host);
  backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

describe('lyraDialog', () => {
  it('keeps consumer markup intact and wires dialog ARIA to the generated title id', async () => {
    const host = mountDialog();
    const dialog = panel(host);
    const heading = host.querySelector<HTMLElement>('.lyra-dialog__title');
    if (!heading) throw new Error('Expected title');

    expect(overlay(host).style.display).toBe('none');
    expect(dialog.classList).toContain('lyra-dialog');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.id).toBe(`${root(host).id}-title`);
    expect(dialog.getAttribute('tabindex')).toBe('-1');

    await openDialog(host);
    expect(overlay(host).style.display).not.toBe('none');
  });

  it('uses an explicit labelId when supplied', () => {
    const host = mountDialog("{ labelId: 'delete-title' }");
    expect(host.querySelector('.lyra-dialog__title')?.id).toBe('delete-title');
    expect(panel(host).getAttribute('aria-labelledby')).toBe('delete-title');
  });

  it('focuses the first focusable, including one nested deeply in the body', async () => {
    const host = mountDialog(
      '{}',
      '<div><section><button type="button" data-testid="deep">Deep</button></section></div>',
    );
    host.querySelector('.lyra-dialog__close')?.remove();
    await openDialog(host);
    expect(document.activeElement).toBe(host.querySelector('[data-testid="deep"]'));
  });

  it('traps Tab at both edges and never reaches background content', async () => {
    const host = mountDialog();
    await openDialog(host);
    const first = host.querySelector<HTMLElement>('.lyra-dialog__close');
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
    const host = mountDialog('{}', 'Plain text only');
    await openDialog(host);
    const dialog = panel(host);
    host.querySelector('.lyra-dialog__close')?.remove();
    dialog.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(dialog);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(dialog);

    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = 'Added later';
    dialog.appendChild(action);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(action);
    dialog.focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(action);
  });

  it('closes through Esc, backdrop press-and-release, and the close button while restoring focus', async () => {
    const host = mountDialog();
    const control = trigger(host);
    await openDialog(host);
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(control);
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });

    await openDialog(host);
    await backdropDismiss(host);
    expect(document.activeElement).toBe(control);
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });

    await openDialog(host);
    await userEvent.click(host.querySelector<HTMLButtonElement>('.lyra-dialog__close')!);
    expect(document.activeElement).toBe(control);
  });

  it('honors disabled close options and never closes for panel interactions or a panel-to-backdrop drag', async () => {
    const escDisabled = mountDialog('{ closeOnEsc: false }');
    await openDialog(escDisabled);
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(overlay(escDisabled).style.display).not.toBe('none');
    // Each sub-case unmounts before the next: an open dialog's fixed overlay covers the
    // viewport and would intercept the next sub-case's trigger click.
    unmount(escDisabled);

    const overlayDisabled = mountDialog('{ closeOnOverlayClick: false }');
    await openDialog(overlayDisabled);
    await backdropDismiss(overlayDisabled);
    expect(overlay(overlayDisabled).style.display).not.toBe('none');
    unmount(overlayDisabled);

    const host = mountDialog();
    await openDialog(host);
    panel(host).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    panel(host).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    overlay(host).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(overlay(host).style.display).not.toBe('none');
  });

  it('keeps closing classes through exit, unlocks scroll immediately, and removes the overlay by the fallback', async () => {
    document.body.style.paddingRight = '17px';
    const existingPadding = parseFloat(getComputedStyle(document.body).paddingRight);
    const host = mountDialog();
    await openDialog(host);
    const delta = window.innerWidth - document.documentElement.clientWidth;
    expect(document.body.style.overflow).toBe('hidden');
    expect(parseFloat(getComputedStyle(document.body).paddingRight)).toBeCloseTo(
      existingPadding + delta,
      1,
    );

    await backdropDismiss(host);
    expect(overlay(host).classList).toContain('lyra-dialog-overlay--closing');
    expect(panel(host).classList).toContain('lyra-dialog--closing');
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.paddingRight).toBe('17px');
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });
  });

  it('only finalizes presence for the panel animation, never a bubbled child animation', async () => {
    const host = mountDialog();
    await openDialog(host);
    await backdropDismiss(host);
    const child = host.querySelector<HTMLElement>('[data-testid="first"]');
    if (!child) throw new Error('Expected animated child');

    child.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await flush();
    expect(overlay(host).style.display).not.toBe('none');

    panel(host).dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await vi.waitFor(() => expect(overlay(host).style.display).toBe('none'), { timeout: 3000 });
  });

  it('cancels an exit on reopen and focuses again before a subsequent restore', async () => {
    const host = mountDialog();
    const control = trigger(host);
    await openDialog(host);
    await userEvent.keyboard('{Escape}');
    control.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flush();
    expect(overlay(host).classList).not.toContain('lyra-dialog-overlay--closing');
    expect(panel(host).contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(control);
  });

  it('is axe clean while closed and open', async () => {
    const host = mountDialog();
    await expectNoAxeViolations(host);
    await openDialog(host);
    await expectNoAxeViolations(host);
  });

  it('synchronizes its controllable open state with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: false }">
        <div x-data="lyraDialog()" x-modelable="open" x-model="outer">
          <div class="lyra-dialog-overlay" x-bind="overlay"><div class="lyra-dialog" x-bind="panel"><h2 x-bind="title">Title</h2><button type="button" x-bind="close">×</button></div></div>
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
    expect(host.querySelector<HTMLElement>('.lyra-dialog-overlay')?.style.display).not.toBe('none');
    await userEvent.click(host.querySelector<HTMLButtonElement>('[x-bind="close"]')!);
    await flush();
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      false,
    );
  });
});
