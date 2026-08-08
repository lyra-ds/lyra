import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountTabs({
  active = 'one',
  variant = 'line',
  customIds = false,
  serverRenderedActive = false,
}: {
  active?: string;
  variant?: 'line' | 'pills';
  customIds?: boolean;
  serverRenderedActive?: boolean;
} = {}): HTMLElement {
  const host = document.createElement('div');
  const listClasses = variant === 'pills' ? 'lyra-tabs lyra-tabs--pills' : 'lyra-tabs';
  const staticActiveClass = serverRenderedActive && active === 'one' ? ' lyra-tab--active' : '';
  host.innerHTML = `
    <div x-data="lyraTabs({ active: '${active}' })">
      <div class="${listClasses}" x-bind="list">
        <button ${customIds ? 'id="custom-one-tab"' : ''} type="button" class="lyra-tab${staticActiveClass}" data-value="one" x-bind="tab">One <span class="lyra-tab__count">2</span></button>
        <button type="button" class="lyra-tab" data-value="two" x-bind="tab">Two</button>
        <button type="button" class="lyra-tab" data-value="three" x-bind="tab">Three</button>
      </div>
      <div ${customIds ? 'id="custom-one-panel"' : ''} data-value="one" x-bind="panel">One panel</div>
      <div data-value="two" x-bind="panel">Two panel</div>
      <div data-value="three" x-bind="panel">Three panel</div>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

// Bare microtasks race Alpine's scheduler on loaded CI runners (bit three suites in a row on
// GitHub Actions). Synchronize with Alpine's own flush, then hop a frame (x-show shows via
// requestAnimationFrame) and a macrotask so every deferred DOM effect has landed.
async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function root(host: HTMLElement): HTMLElement {
  const element = host.firstElementChild;
  if (!(element instanceof HTMLElement)) throw new Error('Expected tabs root');
  return element;
}

function list(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[role="tablist"]');
  if (!element) throw new Error('Expected tablist');
  return element;
}

function tabs(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
}

function panels(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraTabs', () => {
  it('preserves consumer classes and wires generated and supplied ids through tab ARIA', () => {
    const host = mountTabs({ active: 'two', customIds: true });
    const tablist = list(host);
    const controls = tabs(host);
    const tabPanels = panels(host);

    expect(root(host).id).not.toBe('');
    expect(tablist.className).toBe('lyra-tabs');
    expect(tablist.getAttribute('role')).toBe('tablist');
    expect(controls[0].classList).toContain('lyra-tab');
    expect(controls[0].querySelector('.lyra-tab__count')?.className).toBe('lyra-tab__count');
    expect(controls[0].id).toBe('custom-one-tab');
    expect(controls[1].id).toBe(`${root(host).id}-tab-1`);
    expect(tabPanels[0].id).toBe('custom-one-panel');
    expect(tabPanels[1].id).toBe(`${root(host).id}-panel-1`);

    for (const [index, control] of controls.entries()) {
      expect(control.getAttribute('role')).toBe('tab');
      expect(control.getAttribute('type')).toBe('button');
      expect(control.getAttribute('aria-controls')).toBe(tabPanels[index].id);
      expect(control.getAttribute('aria-selected')).toBe(index === 1 ? 'true' : 'false');
      expect(control.getAttribute('tabindex')).toBe(index === 1 ? '0' : '-1');
    }
    for (const [index, panel] of tabPanels.entries()) {
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(panel.getAttribute('aria-labelledby')).toBe(controls[index].id);
      expect(panel.getAttribute('tabindex')).toBe('0');
      expect(panel.hidden).toBe(index !== 1);
    }
    expect(controls[1].classList).toContain('lyra-tab--active');
    expect(controls[0].classList).not.toContain('lyra-tab--active');
  });

  it('treats the first tab as active when the controlled value has no matching tab', () => {
    const host = mountTabs({ active: 'missing' });
    const controls = tabs(host);
    const tabPanels = panels(host);

    expect(controls[0].getAttribute('aria-selected')).toBe('true');
    expect(controls[0].getAttribute('tabindex')).toBe('0');
    expect(controls[0].classList).toContain('lyra-tab--active');
    expect(tabPanels[0].hidden).toBe(false);
    expect(tabPanels[1].hidden).toBe(true);
  });

  it('activates the clicked tab and toggles its panel visibility', async () => {
    const host = mountTabs();
    const controls = tabs(host);
    const tabPanels = panels(host);

    await userEvent.click(controls[2]);
    await flush();

    expect(controls[2].getAttribute('aria-selected')).toBe('true');
    expect(controls[2].getAttribute('tabindex')).toBe('0');
    expect(controls[2].classList).toContain('lyra-tab--active');
    expect(controls[0].getAttribute('aria-selected')).toBe('false');
    expect(tabPanels[2].hidden).toBe(false);
    expect(tabPanels[0].hidden).toBe(true);
  });

  it('deactivates a tab whose active class was rendered by the server', async () => {
    const host = mountTabs({ active: 'one', serverRenderedActive: true });
    const controls = tabs(host);

    expect(controls[0].classList).toContain('lyra-tab--active');
    await userEvent.click(controls[1]);
    await flush();

    expect(controls[0].classList).not.toContain('lyra-tab--active');
    expect(controls[0].getAttribute('aria-selected')).toBe('false');
    expect(controls[1].classList).toContain('lyra-tab--active');
  });

  it('roves focus with automatic activation, arrows, wrap, Home, and End', async () => {
    const host = mountTabs();
    const controls = tabs(host);

    controls[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(controls[1]);
    expect(controls[1].getAttribute('aria-selected')).toBe('true');

    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(controls[2]);
    expect(controls[2].getAttribute('aria-selected')).toBe('true');

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(controls[0]);
    expect(controls[0].getAttribute('aria-selected')).toBe('true');

    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(controls[2]);
    expect(controls[2].getAttribute('aria-selected')).toBe('true');

    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(controls[0]);
    expect(controls[0].getAttribute('aria-selected')).toBe('true');
  });

  it('leaves a default-prevented keydown unchanged', async () => {
    const host = mountTabs();
    const controls = tabs(host);
    const prevent = (event: Event): void => event.preventDefault();
    // At the event target, capture and bubble listeners fire in REGISTRATION order — a capture
    // listener on the tab itself would still run after Alpine's earlier-registered handler. Only
    // an ancestor's capture-phase listener is guaranteed to preventDefault first.
    list(host).addEventListener('keydown', prevent, { capture: true });
    controls[0].focus();

    // cancelable: true is required — preventDefault() is a no-op on a non-cancelable synthetic
    // event, so defaultPrevented would stay false inside the component's handler.
    controls[0].dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' }),
    );
    await flush();

    expect(document.activeElement).toBe(controls[0]);
    expect(controls[0].getAttribute('aria-selected')).toBe('true');
    expect(controls[1].getAttribute('aria-selected')).toBe('false');
    list(host).removeEventListener('keydown', prevent, { capture: true });
  });

  it('is axe clean for consumer-rendered line and pills variants', async () => {
    for (const variant of ['line', 'pills'] as const) {
      const host = mountTabs({ variant });
      expect(list(host).classList).toContain('lyra-tabs');
      if (variant === 'pills') expect(list(host).classList).toContain('lyra-tabs--pills');
      else expect(list(host).classList).not.toContain('lyra-tabs--pills');
      await expectNoAxeViolations(host);
    }
  });

  it('synchronizes active with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: 'one' }">
        <div x-data="lyraTabs({ active: 'one' })" x-modelable="active" x-model="outer">
          <div class="lyra-tabs" x-bind="list">
            <button type="button" class="lyra-tab" data-value="one" x-bind="tab">One</button>
            <button type="button" class="lyra-tab" data-value="two" x-bind="tab">Two</button>
            <button type="button" class="lyra-tab" data-value="three" x-bind="tab">Three</button>
          </div>
          <div data-value="one" x-bind="panel">One panel</div>
          <div data-value="two" x-bind="panel">Two panel</div>
          <div data-value="three" x-bind="panel">Three panel</div>
        </div>
        <button type="button" data-testid="external-active" x-on:click="outer = 'three'">Set three</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const externalControl = host.querySelector<HTMLButtonElement>(
      '[data-testid="external-active"]',
    );
    if (!externalControl) throw new Error('Expected external active control');
    await userEvent.click(externalControl);
    await flush();
    expect(tabs(host)[2].getAttribute('aria-selected')).toBe('true');

    await userEvent.click(tabs(host)[1]);
    await flush();
    expect(tabs(host)[1].getAttribute('aria-selected')).toBe('true');
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: string }).outer).toBe(
      'two',
    );
  });
});
