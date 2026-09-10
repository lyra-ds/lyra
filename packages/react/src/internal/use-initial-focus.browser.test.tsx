import { afterEach, describe, expect, it } from 'vitest';
import { getInitialFocusTarget } from './use-initial-focus';

function createPanel(): HTMLDivElement {
  const panel = document.createElement('div');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.tabIndex = -1;
  document.body.appendChild(panel);
  return panel;
}

type InvalidTargetFactory = (panel: HTMLElement) => HTMLElement | null;

const invalidTargetFactories: [string, InvalidTargetFactory][] = [
  ['null', () => null],
  ['detached', () => document.createElement('button')],
  [
    'outside',
    () => {
      const target = document.createElement('button');
      target.dataset.initialFocusTest = '';
      document.body.appendChild(target);
      return target;
    },
  ],
  ['body', () => document.body],
  ['foreign document', () => document.implementation.createHTMLDocument().createElement('button')],
  [
    'hidden',
    (panel) => {
      const target = document.createElement('button');
      target.hidden = true;
      panel.appendChild(target);
      return target;
    },
  ],
  [
    'disabled fieldset',
    (panel) => {
      const fieldset = document.createElement('fieldset');
      const target = document.createElement('button');
      fieldset.disabled = true;
      fieldset.appendChild(target);
      panel.appendChild(fieldset);
      return target;
    },
  ],
  [
    'inert',
    (panel) => {
      const target = document.createElement('button');
      const container = document.createElement('div');
      container.setAttribute('inert', '');
      container.appendChild(target);
      panel.appendChild(container);
      return target;
    },
  ],
  [
    'aria-hidden',
    (panel) => {
      const target = document.createElement('button');
      const container = document.createElement('div');
      container.setAttribute('aria-hidden', 'true');
      container.appendChild(target);
      panel.appendChild(container);
      return target;
    },
  ],
  [
    'nonfocusable',
    (panel) => {
      const target = document.createElement('p');
      panel.appendChild(target);
      return target;
    },
  ],
];

afterEach(() => {
  document.querySelectorAll('[data-initial-focus-test]').forEach((element) => element.remove());
});

describe('getInitialFocusTarget', () => {
  it('skips hidden and disabled default candidates for the first eligible task control', () => {
    const panel = createPanel();
    panel.dataset.initialFocusTest = '';
    const hidden = document.createElement('button');
    hidden.hidden = true;
    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    const disabled = document.createElement('button');
    const visible = document.createElement('button');
    hidden.textContent = 'Hidden action';
    disabled.textContent = 'Disabled action';
    visible.textContent = 'Continue';
    fieldset.append(disabled);
    panel.append(hidden, fieldset, visible);

    expect(getInitialFocusTarget(panel)).toBe(visible);
  });

  it('skips generic negative-tabindex regions when selecting the default task control', () => {
    const panel = createPanel();
    panel.dataset.initialFocusTest = '';
    const nonTaskRegion = document.createElement('div');
    const field = document.createElement('input');
    nonTaskRegion.tabIndex = -2;
    field.setAttribute('aria-label', 'Task field');
    panel.append(nonTaskRegion, field);

    expect(getInitialFocusTarget(panel)).toBe(field);
  });

  it.each(['-2', ' -2', '\t-2'])(
    'filters a generic default with numeric negative tabindex %j',
    (value) => {
      const panel = createPanel();
      panel.dataset.initialFocusTest = '';
      const region = document.createElement('div');
      region.setAttribute('tabindex', value);
      const field = document.createElement('input');
      panel.append(region, field);

      expect(region.tabIndex).toBe(-2);
      expect(getInitialFocusTarget(panel)).toBe(field);
      expect(getInitialFocusTarget(panel, () => region)).toBe(region);
    },
  );

  it('preserves numeric zero and native task controls in default selection', () => {
    const panel = createPanel();
    panel.dataset.initialFocusTest = '';
    const region = document.createElement('div');
    region.setAttribute('tabindex', '-0');
    const field = document.createElement('input');
    field.tabIndex = -1;
    panel.append(region, field);

    expect(region.tabIndex).toBe(0);
    expect(getInitialFocusTarget(panel)).toBe(region);
    region.remove();
    expect(getInitialFocusTarget(panel)).toBe(field);
  });

  it('accepts a declared heading but rejects a target in a nested modal', () => {
    const panel = createPanel();
    panel.dataset.initialFocusTest = '';
    const heading = document.createElement('h2');
    heading.tabIndex = -1;
    const nested = createPanel();
    const nestedButton = document.createElement('button');
    nested.append(nestedButton);
    panel.append(heading, nested);

    expect(getInitialFocusTarget(panel, () => heading)).toBe(heading);
    expect(getInitialFocusTarget(panel, () => nestedButton)).toBe(panel);
  });

  it.each(invalidTargetFactories)(
    'falls back to the panel for a %s declared target',
    (_name, createTarget) => {
      const panel = createPanel();
      panel.dataset.initialFocusTest = '';
      const target = createTarget(panel);

      expect(getInitialFocusTarget(panel, () => target)).toBe(panel);
    },
  );
});
