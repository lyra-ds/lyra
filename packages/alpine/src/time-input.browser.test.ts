import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function timeInputMarkup(options = '{}'): string {
  return `
    <div class="lyra-field">
      <label class="lyra-label" for="start-time">Start time</label>
      <div class="lyra-timeinput" x-data="lyraTimeInput(${options})">
        <input id="start-time" type="text" class="lyra-input" x-bind="input">
        <span class="lyra-timeinput__steppers">
          <span class="lyra-timeinput__steppers">
            <button class="lyra-timeinput__step" aria-label="Later" x-bind="up"></button>
            <button class="lyra-timeinput__step" aria-label="Earlier" x-bind="down"></button>
          </span>
        </span>
      </div>
    </div>
  `;
}

function mountTimeInput(options = '{}'): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = timeInputMarkup(options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

function input(host: HTMLElement): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('#start-time');
  if (!element) throw new Error('Expected time input');
  return element;
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-timeinput');
  if (!element) throw new Error('Expected time input root');
  return element;
}

function steppers(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('.lyra-timeinput__step'));
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
}

async function setText(element: HTMLInputElement, value: string): Promise<void> {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
}

async function blur(element: HTMLInputElement): Promise<void> {
  element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  await flush();
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraTimeInput', () => {
  it('normalizes tolerant time formats on blur and Enter', async () => {
    const host = mountTimeInput();
    const element = input(host);

    await setText(element, '9');
    await blur(element);
    expect(element.value).toBe('09:00');

    await setText(element, '0930');
    await blur(element);
    expect(element.value).toBe('09:30');

    await setText(element, '9:5');
    await blur(element);
    expect(element.value).toBe('09:05');

    await setText(element, '9h30');
    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
    element.dispatchEvent(enter);
    await flush();
    expect(enter.defaultPrevented).toBe(false);
    expect(element.value).toBe('09:30');
  });

  it('preserves invalid text and applies invalid ARIA and styling', async () => {
    const host = mountTimeInput("{ defaultValue: '09:00' }");
    const element = input(host);

    await setText(element, '9:5:99');
    await blur(element);
    expect(element.value).toBe('9:5:99');
    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(element.classList).toContain('lyra-input--error');

    await setText(element, 'garbage');
    await blur(element);
    expect(element.value).toBe('garbage');
    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(element.classList).toContain('lyra-input--error');
  });

  it('applies consumer-driven invalid styling', () => {
    const host = mountTimeInput('{ invalid: true }');
    const element = input(host);

    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(element.classList).toContain('lyra-input--error');
  });

  it('clears to null and dispatches an interaction change event', async () => {
    const host = mountTimeInput("{ defaultValue: '09:00' }");
    const changes: Array<string | null> = [];
    root(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string | null }>).detail.value);
    });
    const element = input(host);

    await setText(element, '');
    await blur(element);

    expect((Alpine.$data(root(host)) as { selected: string | null }).selected).toBeNull();
    expect(element.value).toBe('');
    expect(element.getAttribute('aria-valuenow')).toBeNull();
    expect(element.getAttribute('aria-valuetext')).toBeNull();
    expect(changes).toEqual([null]);
  });

  it('clamps normalization and stepping to inclusive min and max limits', async () => {
    const host = mountTimeInput("{ defaultValue: '09:00', step: 15, min: '09:00', max: '10:00' }");
    const element = input(host);

    await setText(element, '8:15');
    await blur(element);
    expect(element.value).toBe('09:00');

    await setText(element, '10:00');
    await blur(element);
    const up = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowUp' });
    element.dispatchEvent(up);
    await flush();
    expect(up.defaultPrevented).toBe(true);
    expect(element.value).toBe('10:00');

    const down = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowDown',
      shiftKey: true,
    });
    element.dispatchEvent(down);
    await flush();
    expect(down.defaultPrevented).toBe(true);
    expect(element.value).toBe('09:00');
  });

  it('steps with Arrow keys, Shift, and served stepper buttons', async () => {
    const host = mountTimeInput("{ defaultValue: '09:00', step: 15 }");
    const element = input(host);
    const [up, down] = steppers(host);

    const arrowUp = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowUp',
    });
    element.dispatchEvent(arrowUp);
    await flush();
    expect(arrowUp.defaultPrevented).toBe(true);
    expect(element.value).toBe('09:15');

    const shiftDown = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowDown',
      shiftKey: true,
    });
    element.dispatchEvent(shiftDown);
    await flush();
    expect(element.value).toBe('08:15');

    expect(up.getAttribute('type')).toBe('button');
    expect(up.getAttribute('tabindex')).toBe('-1');
    expect(down.getAttribute('type')).toBe('button');
    expect(down.getAttribute('tabindex')).toBe('-1');
    await userEvent.click(up);
    await flush();
    expect(element.value).toBe('08:30');
    await userEvent.click(down);
    await flush();
    expect(element.value).toBe('08:15');
  });

  it('tracks selected time in spinbutton ARIA and removes it when cleared', async () => {
    const host = mountTimeInput(
      "{ defaultValue: '09:30', valueText: (hours, minutes) => hours + 'h ' + minutes + 'm' }",
    );
    const element = input(host);

    expect(element.getAttribute('role')).toBe('spinbutton');
    expect(element.getAttribute('inputmode')).toBe('numeric');
    expect(element.getAttribute('autocomplete')).toBe('off');
    expect(element.getAttribute('aria-valuemin')).toBe('0');
    expect(element.getAttribute('aria-valuemax')).toBe('1439');
    expect(element.getAttribute('aria-valuenow')).toBe('570');
    expect(element.getAttribute('aria-valuetext')).toBe('9h 30m');

    await setText(element, '');
    await blur(element);
    expect(element.getAttribute('aria-valuenow')).toBeNull();
    expect(element.getAttribute('aria-valuetext')).toBeNull();
  });

  it('resets text from an external x-model write without dispatching', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: '09:00' }">
        <div class="lyra-timeinput" x-data="lyraTimeInput({ defaultValue: '09:00' })" x-modelable="selected" x-model="outer">
          <label class="lyra-label" for="model-time">Start time</label>
          <input id="model-time" type="text" class="lyra-input" x-bind="input">
          <span class="lyra-timeinput__steppers">
            <button class="lyra-timeinput__step" aria-label="Later" x-bind="up"></button>
            <button class="lyra-timeinput__step" aria-label="Earlier" x-bind="down"></button>
          </span>
        </div>
        <button type="button" data-testid="external-value" x-on:click="outer = '10:30'">Set time</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const component = host.querySelector<HTMLElement>('.lyra-timeinput');
    const element = host.querySelector<HTMLInputElement>('#model-time');
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-value"]');
    if (!component || !element || !external) throw new Error('Expected model fixture controls');
    const changes: Array<string | null> = [];
    component.addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string | null }>).detail.value);
    });

    await setText(element, 'not a time');
    await blur(element);
    await userEvent.click(external);
    await flush();

    expect(element.value).toBe('10:30');
    expect(element.getAttribute('aria-invalid')).toBeNull();
    expect(changes).toEqual([]);
  });

  it('synchronizes selected with x-model in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: '09:00' }">
        <div class="lyra-timeinput" x-data="lyraTimeInput({ defaultValue: '09:00', step: 15 })" x-modelable="selected" x-model="outer">
          <label class="lyra-label" for="two-way-time">Start time</label>
          <input id="two-way-time" type="text" class="lyra-input" x-bind="input">
          <span class="lyra-timeinput__steppers">
            <button class="lyra-timeinput__step" aria-label="Later" x-bind="up"></button>
            <button class="lyra-timeinput__step" aria-label="Earlier" x-bind="down"></button>
          </span>
        </div>
        <button type="button" data-testid="external-value" x-on:click="outer = '10:30'">Set time</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const component = host.querySelector<HTMLElement>('.lyra-timeinput');
    const element = host.querySelector<HTMLInputElement>('#two-way-time');
    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-value"]');
    const up = host.querySelector<HTMLButtonElement>('.lyra-timeinput__step');
    if (!component || !element || !external || !up)
      throw new Error('Expected two-way model fixture controls');

    await userEvent.click(external);
    await flush();
    expect(element.value).toBe('10:30');

    await userEvent.click(up);
    await flush();
    expect(element.value).toBe('10:45');
    expect((Alpine.$data(component.parentElement as HTMLElement) as { outer: string }).outer).toBe(
      '10:45',
    );
  });

  it('is axe clean with a consumer-served label', async () => {
    const host = mountTimeInput("{ defaultValue: '09:00' }");
    await expectNoAxeViolations(host);
  });
});
