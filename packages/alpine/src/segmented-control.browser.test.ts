import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function segmentedMarkup(value: string, serverRenderedActive = false): string {
  return `
    <div
      class="lyra-segmented"
      role="radiogroup"
      aria-label="Language"
      x-data="lyraSegmentedControl({ value: '${value}' })"
    >
      <button type="button" role="radio" class="lyra-segmented__option${serverRenderedActive && value === 'en' ? ' lyra-segmented__option--active' : ''}" data-value="en" x-bind="option">EN</button>
      <button type="button" role="radio" class="lyra-segmented__option" data-value="pt" disabled x-bind="option">PT</button>
      <button type="button" role="radio" class="lyra-segmented__option" data-value="fr" x-bind="option">FR</button>
      <button type="button" role="radio" class="lyra-segmented__option" data-value="es" x-bind="option">ES</button>
    </div>
  `;
}

function mountSegmentedControl({
  value = 'en',
  serverRenderedActive = false,
}: {
  value?: string;
  serverRenderedActive?: boolean;
} = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = segmentedMarkup(value, serverRenderedActive);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
}

function group(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="radiogroup"]');
  if (!element) throw new Error('Expected segmented-control radiogroup');
  return element;
}

function options(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraSegmentedControl', () => {
  it('derives radio state and a single roving tab stop from served markup', () => {
    const host = mountSegmentedControl();
    const controls = options(host);

    expect(group(host).getAttribute('aria-label')).toBe('Language');
    expect(controls).toHaveLength(4);
    expect(controls[0].getAttribute('aria-checked')).toBe('true');
    expect(controls[0].getAttribute('tabindex')).toBe('0');
    for (const control of controls.slice(1)) {
      expect(control.getAttribute('aria-checked')).toBe('false');
      expect(control.getAttribute('tabindex')).toBe('-1');
    }
    expect(controls[1].disabled).toBe(true);
  });

  it('selects on click and dispatches the selected value', async () => {
    const host = mountSegmentedControl();
    const controls = options(host);
    const changes: string[] = [];
    group(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    await userEvent.click(controls[2]);
    await flush();

    expect(controls[2].getAttribute('aria-checked')).toBe('true');
    expect(controls[2].getAttribute('tabindex')).toBe('0');
    expect(changes).toEqual(['fr']);
  });

  it('moves focus and selection circularly with arrows, skipping disabled options', async () => {
    const host = mountSegmentedControl();
    const controls = options(host);

    controls[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    await flush();
    expect(document.activeElement).toBe(controls[2]);
    expect(controls[2].getAttribute('aria-checked')).toBe('true');

    await userEvent.keyboard('{ArrowRight}');
    await flush();
    expect(document.activeElement).toBe(controls[3]);

    await userEvent.keyboard('{ArrowRight}');
    await flush();
    expect(document.activeElement).toBe(controls[0]);

    await userEvent.keyboard('{ArrowLeft}');
    await flush();
    expect(document.activeElement).toBe(controls[3]);
    expect(controls[3].getAttribute('aria-checked')).toBe('true');
  });

  it('moves Home and End to the first and last enabled options', async () => {
    const host = mountSegmentedControl({ value: 'fr' });
    const controls = options(host);

    controls[2].focus();
    await userEvent.keyboard('{Home}');
    await flush();
    expect(document.activeElement).toBe(controls[0]);
    expect(controls[0].getAttribute('aria-checked')).toBe('true');

    await userEvent.keyboard('{End}');
    await flush();
    expect(document.activeElement).toBe(controls[3]);
    expect(controls[3].getAttribute('aria-checked')).toBe('true');
  });

  it('removes an active modifier that the server rendered after selection changes', async () => {
    const host = mountSegmentedControl({ serverRenderedActive: true });
    const controls = options(host);

    expect(controls[0].classList).toContain('lyra-segmented__option--active');
    await userEvent.click(controls[2]);
    await flush();

    expect(controls[0].classList).not.toContain('lyra-segmented__option--active');
    expect(controls[2].classList).toContain('lyra-segmented__option--active');
  });

  it('updates from an external x-model write without emitting a change event', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: 'en' }">
        <div class="lyra-segmented" role="radiogroup" aria-label="Language" x-data="lyraSegmentedControl({ value: 'en' })" x-modelable="value" x-model="outer">
          <button type="button" role="radio" class="lyra-segmented__option" data-value="en" x-bind="option">EN</button>
          <button type="button" role="radio" class="lyra-segmented__option" data-value="pt" disabled x-bind="option">PT</button>
          <button type="button" role="radio" class="lyra-segmented__option" data-value="fr" x-bind="option">FR</button>
          <button type="button" role="radio" class="lyra-segmented__option" data-value="es" x-bind="option">ES</button>
        </div>
        <button type="button" data-testid="external-value" x-on:click="outer = 'fr'">Set FR</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const controls = options(host);
    const changes: string[] = [];
    group(host).addEventListener('lyra:change', (event) => {
      changes.push((event as CustomEvent<{ value: string }>).detail.value);
    });
    const externalControl = host.querySelector<HTMLButtonElement>('[data-testid="external-value"]');
    if (!externalControl) throw new Error('Expected external value control');

    await userEvent.click(externalControl);
    await flush();

    expect(controls[0].getAttribute('aria-checked')).toBe('false');
    expect(controls[0].getAttribute('tabindex')).toBe('-1');
    expect(controls[2].getAttribute('aria-checked')).toBe('true');
    expect(controls[2].getAttribute('tabindex')).toBe('0');
    expect(changes).toEqual([]);
  });

  it('synchronizes x-modelable state in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: 'en' }">
        <div class="lyra-segmented" role="radiogroup" aria-label="Language" x-data="lyraSegmentedControl({ value: 'en' })" x-modelable="value" x-model="outer">
          <button type="button" role="radio" class="lyra-segmented__option" data-value="en" x-bind="option">EN</button>
          <button type="button" role="radio" class="lyra-segmented__option" data-value="pt" disabled x-bind="option">PT</button>
          <button type="button" role="radio" class="lyra-segmented__option" data-value="fr" x-bind="option">FR</button>
          <button type="button" role="radio" class="lyra-segmented__option" data-value="es" x-bind="option">ES</button>
        </div>
        <button type="button" data-testid="external-value" x-on:click="outer = 'es'">Set ES</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const controls = options(host);
    const externalControl = host.querySelector<HTMLButtonElement>('[data-testid="external-value"]');
    if (!externalControl) throw new Error('Expected external value control');

    await userEvent.click(externalControl);
    await flush();
    expect(controls[3].getAttribute('aria-checked')).toBe('true');

    await userEvent.click(controls[2]);
    await flush();
    expect(controls[2].getAttribute('aria-checked')).toBe('true');
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: string }).outer).toBe(
      'fr',
    );
  });

  it('is axe clean', async () => {
    const host = mountSegmentedControl();
    await expectNoAxeViolations(host);
  });
});
