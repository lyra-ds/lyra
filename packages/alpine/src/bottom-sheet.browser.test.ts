import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];
let bottomSheetReturnTarget: HTMLElement | null = null;

Alpine.plugin(lyra);
Alpine.data('bottomSheetReturnFocusWorkflow', () => ({
  returnTarget: () => bottomSheetReturnTarget,
}));

function mountBottomSheet(
  options = '{}',
  body = '<button type="button" data-testid="first">First</button><input aria-label="Middle"><button type="button" data-testid="last">Last</button>',
  wrapperAttributes = '',
): HTMLElement {
  const host = document.createElement('div');
  const wrapperOpen = wrapperAttributes ? `<div ${wrapperAttributes}>` : '';
  const wrapperClose = wrapperAttributes ? '</div>' : '';
  host.innerHTML = `
    ${wrapperOpen}
    <div x-data="lyraBottomSheet(${options})">
      <button type="button" data-testid="trigger" x-on:click="open = true">Open</button>
      <button type="button" data-testid="outside">Background</button>
      <div class="lyra-bottomsheet-overlay" x-bind="overlay">
        <div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="bottom-sheet-title" x-bind="panel">
          <div class="lyra-bottomsheet__header">
            <h2 id="bottom-sheet-title" class="lyra-bottomsheet__title">Test sheet</h2>
            <button class="lyra-bottomsheet__close" x-bind="close">×</button>
          </div>
          <div class="lyra-bottomsheet__body">${body}</div>
        </div>
      </div>
    </div>
    ${wrapperClose}
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
  const element = host.querySelector<HTMLElement>('[x-data^="lyraBottomSheet"]');
  if (!(element instanceof HTMLElement)) throw new Error('Expected bottom-sheet root');
  return element;
}

function overlay(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-bottomsheet-overlay');
  if (!element) throw new Error('Expected bottom-sheet overlay');
  return element;
}

function panel(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-bottomsheet');
  if (!element) throw new Error('Expected bottom-sheet panel');
  return element;
}

function trigger(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('[data-testid="trigger"]');
  if (!element) throw new Error('Expected trigger');
  return element;
}

async function openBottomSheet(host: HTMLElement): Promise<void> {
  const control = trigger(host);
  control.focus();
  await userEvent.click(control);
  await flush();
  expect(overlay(host).style.display).not.toBe('none');
}

async function openBottomSheetWithKeyboard(host: HTMLElement): Promise<void> {
  const control = trigger(host);
  control.focus();
  await userEvent.keyboard('{Enter}');
  await flush();
  expect(overlay(host).style.display).not.toBe('none');
}

function backdropDismiss(host: HTMLElement): void {
  const backdrop = overlay(host);
  backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  bottomSheetReturnTarget?.remove();
  bottomSheetReturnTarget = null;
});

describe('lyraBottomSheet', () => {
  it('preserves the consumer-served modal semantics and starts closed by default', () => {
    const host = mountBottomSheet();
    const sheet = panel(host);

    expect(overlay(host).style.display).toBe('none');
    expect(overlay(host).className).toBe('lyra-bottomsheet-overlay');
    expect(sheet.className).toBe('lyra-bottomsheet');
    expect(sheet.getAttribute('role')).toBe('dialog');
    expect(sheet.getAttribute('aria-modal')).toBe('true');
    expect(sheet.getAttribute('aria-labelledby')).toBe('bottom-sheet-title');
    expect(sheet.getAttribute('tabindex')).toBe('-1');
    expect(host.querySelector('.lyra-bottomsheet__title')?.id).toBe('bottom-sheet-title');
  });

  it('focuses the first focusable descendant after opening', async () => {
    const host = mountBottomSheet();
    await openBottomSheet(host);

    // React parity: the header's close button precedes the body in DOM order, so it is the
    // first focusable descendant (the React suite asserts exactly this).
    expect(document.activeElement).toBe(host.querySelector('.lyra-bottomsheet__close'));
  });

  it('focuses the panel and traps both Tab directions when it has no focusable descendants', async () => {
    const host = mountBottomSheet('{}', 'Plain text only');
    host.querySelector('.lyra-bottomsheet__close')?.remove();
    await openBottomSheet(host);
    const sheet = panel(host);

    expect(document.activeElement).toBe(sheet);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(sheet);
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(sheet);
  });

  it('wraps focus at both Tab-trap edges without reaching background content', async () => {
    const host = mountBottomSheet();
    await openBottomSheet(host);
    const first = host.querySelector<HTMLElement>('.lyra-bottomsheet__close');
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

  it('contains native Tab traversal after a keyboard-owned opening', async () => {
    const host = mountBottomSheet();
    await openBottomSheetWithKeyboard(host);
    const sheet = panel(host);
    const middle = host.querySelector<HTMLElement>('[aria-label="Middle"]');
    if (!middle) throw new Error('Expected middle field');

    sheet.focus();
    let reachedMiddle = false;
    for (let step = 0; step < 10; step += 1) {
      await userEvent.keyboard('{Tab}');
      reachedMiddle ||= document.activeElement === middle;
      expect(sheet.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toHaveAttribute('data-lyra-focus-trap-boundary');
    }
    expect(reachedMiddle).toBe(true);

    sheet.focus();
    reachedMiddle = false;
    for (let step = 0; step < 10; step += 1) {
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      reachedMiddle ||= document.activeElement === middle;
      expect(sheet.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toHaveAttribute('data-lyra-focus-trap-boundary');
    }
    expect(reachedMiddle).toBe(true);
  });

  it('closes from Escape on the panel and restores focus to its opener', async () => {
    const host = mountBottomSheet(
      '{ returnFocusTo: returnTarget }',
      undefined,
      'x-data="bottomSheetReturnFocusWorkflow"',
    );
    const opener = trigger(host);
    bottomSheetReturnTarget = opener;
    await openBottomSheet(host);

    await userEvent.keyboard('{Escape}');
    await flush();
    expect(document.activeElement).toBe(opener);
    expect(overlay(host).classList).toContain('lyra-bottomsheet-overlay--closing');
  });

  it('keeps the captured keyboard opener fallback when no destination is configured', async () => {
    const host = mountBottomSheet();
    const control = trigger(host);
    await openBottomSheetWithKeyboard(host);
    await userEvent.keyboard('{Escape}');
    await flush();

    expect(document.activeElement).toBe(control);
  });

  it('uses an outer Alpine workflow successor after a pointer-opened accepted close', async () => {
    bottomSheetReturnTarget = document.createElement('h2');
    bottomSheetReturnTarget.tabIndex = -1;
    bottomSheetReturnTarget.textContent = 'Bottom sheet successor';
    document.body.append(bottomSheetReturnTarget);
    const focus = vi.spyOn(bottomSheetReturnTarget, 'focus');
    const host = mountBottomSheet(
      '{ returnFocusTo: returnTarget }',
      undefined,
      'x-data="bottomSheetReturnFocusWorkflow"',
    );

    await openBottomSheet(host);
    await userEvent.keyboard('{Escape}');
    await flush();

    expect(document.activeElement).toBe(bottomSheetReturnTarget);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('dismisses through the close button and dispatches lyra:close', async () => {
    const host = mountBottomSheet();
    const events: Event[] = [];
    root(host).addEventListener('lyra:close', (event) => events.push(event));
    await openBottomSheet(host);

    await userEvent.click(host.querySelector<HTMLButtonElement>('.lyra-bottomsheet__close')!);
    await flush();
    expect(events).toHaveLength(1);
    expect((Alpine.$data(root(host)) as { open: boolean }).open).toBe(false);
  });

  it('only dismisses a backdrop press-and-release that both occur on the overlay', async () => {
    const host = mountBottomSheet();
    await openBottomSheet(host);
    const sheet = panel(host);
    const backdrop = overlay(host);

    sheet.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    expect(backdrop.style.display).not.toBe('none');
    expect(backdrop.classList).not.toContain('lyra-bottomsheet-overlay--closing');

    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    sheet.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    expect(backdrop.style.display).not.toBe('none');
    expect(backdrop.classList).not.toContain('lyra-bottomsheet-overlay--closing');

    backdropDismiss(host);
    await flush();
    expect(backdrop.classList).toContain('lyra-bottomsheet-overlay--closing');
  });

  it('keeps closing classes until panel animation end and releases scroll during that exit', async () => {
    const host = mountBottomSheet();
    await openBottomSheet(host);
    expect(document.body.style.overflow).toBe('hidden');

    backdropDismiss(host);
    await flush();
    expect(overlay(host).classList).toContain('lyra-bottomsheet-overlay--closing');
    expect(panel(host).classList).toContain('lyra-bottomsheet--closing');
    expect(document.body.style.overflow).toBe('');

    panel(host).dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await flush();
    expect(overlay(host).style.display).toBe('none');
  });

  it('synchronizes open with x-modelable and x-model in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: false }">
        <div x-data="lyraBottomSheet()" x-modelable="open" x-model="outer">
          <div class="lyra-bottomsheet-overlay" x-bind="overlay">
            <div class="lyra-bottomsheet" role="dialog" aria-modal="true" tabindex="-1" aria-label="Modelable sheet" x-bind="panel">
              <button class="lyra-bottomsheet__close" x-bind="close">×</button>
            </div>
          </div>
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
    expect(host.querySelector<HTMLElement>('.lyra-bottomsheet-overlay')?.style.display).not.toBe(
      'none',
    );
    await userEvent.click(host.querySelector<HTMLButtonElement>('[x-bind="close"]')!);
    await flush();
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      false,
    );
  });

  it('is axe clean while closed and open', async () => {
    const host = mountBottomSheet();
    await expectNoAxeViolations(host);
    await openBottomSheet(host);
    await expectNoAxeViolations(host);
  });
});
