import '@lyra-ds/styles/styles.css';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { attachFocusTrap } from './focus-trap';

const BOUNDARY_SELECTOR = '[data-lyra-focus-trap-boundary]';
const mountedHosts: HTMLElement[] = [];
const focusTrapCleanups: Array<() => void> = [];

function mountFocusTrap(): {
  host: HTMLElement;
  panel: HTMLElement;
  start: HTMLInputElement;
  middle: HTMLInputElement;
  last: HTMLButtonElement;
} {
  const host = document.createElement('div');
  host.innerHTML = `
    <button type="button">External previous</button>
    <div aria-label="Focus trap panel" role="dialog" tabindex="-1">
      <input aria-label="Start field">
      <input aria-label="Middle field">
      <button type="button">Last action</button>
    </div>
    <button type="button">External next</button>
  `;
  document.body.appendChild(host);
  mountedHosts.push(host);

  const panel = host.querySelector<HTMLElement>('[role="dialog"]');
  const start = host.querySelector<HTMLInputElement>('[aria-label="Start field"]');
  const middle = host.querySelector<HTMLInputElement>('[aria-label="Middle field"]');
  if (!panel || !start || !middle) throw new Error('Expected focus trap fixture');
  const last = panel.querySelector<HTMLButtonElement>('[type="button"]');
  if (!last) throw new Error('Expected focus trap fixture');

  focusTrapCleanups.push(attachFocusTrap(panel));
  return { host, panel, start, middle, last };
}

function expectFocusInside(panel: HTMLElement): void {
  expect(panel.contains(panel.ownerDocument.activeElement)).toBe(true);
  expect(panel.ownerDocument.activeElement).not.toHaveAttribute('data-lyra-focus-trap-boundary');
}

afterEach(() => {
  for (const cleanup of focusTrapCleanups.splice(0)) cleanup();
  for (const host of mountedHosts.splice(0)) host.remove();
});

describe('attachFocusTrap', () => {
  it('contains native forward and reverse Tab traversal after reaching the Middle field', async () => {
    const { middle, panel } = mountFocusTrap();

    panel.focus();
    let reachedMiddle = false;
    for (let step = 0; step < 8; step += 1) {
      await userEvent.keyboard('{Tab}');
      reachedMiddle ||= panel.ownerDocument.activeElement === middle;
      expectFocusInside(panel);
    }
    expect(reachedMiddle).toBe(true);

    panel.focus();
    reachedMiddle = false;
    for (let step = 0; step < 8; step += 1) {
      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      reachedMiddle ||= panel.ownerDocument.activeElement === middle;
      expectFocusInside(panel);
    }
    expect(reachedMiddle).toBe(true);
  });

  it('honors a descendant-cancelled Tab before arming a boundary', async () => {
    const { last } = mountFocusTrap();
    const cancelTab = (event: KeyboardEvent): void => {
      if (event.key === 'Tab') event.preventDefault();
    };
    last.addEventListener('keydown', cancelTab);

    last.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(last);

    last.removeEventListener('keydown', cancelTab);
  });

  it('re-reads live eligible candidates and disposes boundary resources across cleanup and reattach', async () => {
    const { host, panel } = mountFocusTrap();
    const firstCleanup = focusTrapCleanups.pop();
    if (!firstCleanup) throw new Error('Expected focus trap cleanup');
    const formerBoundary = host.querySelector<HTMLElement>(BOUNDARY_SELECTOR);
    if (!formerBoundary) throw new Error('Expected focus boundary');

    firstCleanup();
    expect(host.querySelectorAll(BOUNDARY_SELECTOR)).toHaveLength(0);

    const outside = host.querySelector<HTMLButtonElement>('button');
    if (!outside) throw new Error('Expected external control');
    outside.focus();
    formerBoundary.focus();
    expect(document.activeElement).toBe(outside);

    panel.innerHTML = `
      <button disabled type="button">Disabled action</button>
      <button hidden type="button">Hidden action</button>
      <input aria-label="Eligible dynamic field">
    `;
    focusTrapCleanups.push(attachFocusTrap(panel));
    expect(host.querySelectorAll(BOUNDARY_SELECTOR)).toHaveLength(2);

    panel.focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toHaveAttribute('aria-label', 'Eligible dynamic field');
  });
});
