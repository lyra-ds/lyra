import '@lyra-ds/styles/styles.css';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { restoreReturnFocus } from './return-focus';

const nodes: HTMLElement[] = [];

function append<T extends HTMLElement>(node: T): T {
  document.body.appendChild(node);
  nodes.push(node);
  return node;
}

function button(label: string): HTMLButtonElement {
  const target = document.createElement('button');
  target.type = 'button';
  target.textContent = label;
  return append(target);
}

afterEach(() => {
  nodes.splice(0).forEach((node) => node.remove());
  vi.restoreAllMocks();
});

describe('restoreReturnFocus', () => {
  it('prefers an eligible current successor with preventScroll over the captured opener', () => {
    const opener = button('Opener');
    const successor = append(document.createElement('h2'));
    successor.tabIndex = -1;
    successor.textContent = 'Workflow heading';
    const focus = vi.spyOn(successor, 'focus');

    restoreReturnFocus({
      ownerDocument: document,
      opener,
      panel: null,
      overlay: null,
      returnFocusTo: () => successor,
    });

    expect(document.activeElement).toBe(successor);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('falls back to an eligible captured opener when the explicit candidate is ineligible', () => {
    const opener = button('Opener');
    const hidden = button('Hidden');
    hidden.hidden = true;
    const focus = vi.spyOn(opener, 'focus');

    restoreReturnFocus({
      ownerDocument: document,
      opener,
      panel: null,
      overlay: null,
      returnFocusTo: () => hidden,
    });

    expect(document.activeElement).toBe(opener);
    expect(focus).toHaveBeenCalledWith();
  });

  it('rejects every ineligible candidate consistently as an explicit target and captured fallback', () => {
    const panel = append(document.createElement('div'));
    const overlay = append(document.createElement('div'));
    overlay.append(panel);
    const panelChild = document.createElement('button');
    panel.append(panelChild);
    const overlayChild = document.createElement('button');
    overlay.append(overlayChild);
    const fieldset = append(document.createElement('fieldset'));
    fieldset.disabled = true;
    const disabled = document.createElement('button');
    fieldset.append(disabled);
    const hiddenAncestor = append(document.createElement('div'));
    hiddenAncestor.hidden = true;
    const hiddenByAncestor = document.createElement('button');
    hiddenAncestor.append(hiddenByAncestor);
    const inertAncestor = append(document.createElement('div'));
    inertAncestor.setAttribute('inert', '');
    const inert = document.createElement('button');
    inertAncestor.append(inert);
    const ariaHiddenAncestor = append(document.createElement('div'));
    ariaHiddenAncestor.setAttribute('aria-hidden', 'true');
    const ariaHidden = document.createElement('button');
    ariaHiddenAncestor.append(ariaHidden);
    const displayNone = button('Display none');
    displayNone.style.display = 'none';
    const visibilityHidden = button('Visibility hidden');
    visibilityHidden.style.visibility = 'hidden';
    const noRects = button('No rectangles');
    Object.defineProperty(noRects, 'getClientRects', { value: () => [] });
    const hiddenInput = append(document.createElement('input'));
    hiddenInput.type = 'hidden';
    const nonFocusable = append(document.createElement('div'));
    const disconnected = document.createElement('button');
    const foreignDocument = document.implementation.createHTMLDocument('foreign');
    const foreign = foreignDocument.createElement('button');
    foreignDocument.body.append(foreign);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('tabindex', '0');
    document.body.append(svg);

    for (const target of [
      document.body,
      document.documentElement,
      panelChild,
      overlayChild,
      disabled,
      hiddenByAncestor,
      inert,
      ariaHidden,
      displayNone,
      visibilityHidden,
      noRects,
      hiddenInput,
      nonFocusable,
      disconnected,
      foreign,
      svg,
    ]) {
      const focus = vi.spyOn(target, 'focus');
      restoreReturnFocus({
        ownerDocument: document,
        opener: target,
        panel,
        overlay,
        returnFocusTo: () => target,
      });
      expect(focus).not.toHaveBeenCalled();
      focus.mockRestore();
    }
    svg.remove();
  });

  it('preserves a thrown resolver object without focusing a target', () => {
    const opener = button('Opener');
    const thrown = { reason: 'current workflow is unavailable' };
    const focus = vi.spyOn(opener, 'focus');

    expect(() =>
      restoreReturnFocus({
        ownerDocument: document,
        opener,
        panel: null,
        overlay: null,
        returnFocusTo: () => {
          throw thrown;
        },
      }),
    ).toThrow(thrown);
    expect(focus).not.toHaveBeenCalled();
  });
});
