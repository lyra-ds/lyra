import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountAccordion({
  defaultOpen,
  multiple = false,
  customIds = false,
}: {
  defaultOpen?: 'one' | 'two';
  multiple?: boolean;
  customIds?: boolean;
} = {}): HTMLElement {
  const defaultOpenOption = defaultOpen === undefined ? '' : `defaultOpen: '${defaultOpen}',`;
  const host = document.createElement('div');
  host.innerHTML = `
    <div class="lyra-accordion" x-data="lyraAccordion({ ${defaultOpenOption} multiple: ${multiple} })">
      <div class="lyra-acc__item" data-value="one" x-bind="item">
        <button ${customIds ? 'id="custom-one-trigger"' : ''} class="lyra-acc__trigger" x-bind="trigger">One <span class="lyra-acc__chevron" aria-hidden="true"></span></button>
        <div class="lyra-acc__panel-wrap" x-bind="panelWrap"><div class="lyra-acc__panel-clip"><div ${customIds ? 'id="custom-one-panel"' : ''} class="lyra-acc__panel" x-bind="panel">One panel <button type="button" data-testid="one-action">One action</button></div></div></div>
      </div>
      <div class="lyra-acc__item" data-value="two" x-bind="item">
        <button class="lyra-acc__trigger" x-bind="trigger">Two <span class="lyra-acc__chevron" aria-hidden="true"></span></button>
        <div class="lyra-acc__panel-wrap" x-bind="panelWrap"><div class="lyra-acc__panel-clip"><div class="lyra-acc__panel" x-bind="panel">Two panel <button type="button" data-testid="two-action">Two action</button></div></div></div>
      </div>
    </div>
    <button type="button" data-testid="after">After</button>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

// Bare microtasks race Alpine's scheduler on loaded CI runners (see #122). Synchronize with
// Alpine's own flush, then hop a frame and a macrotask so every deferred DOM effect has landed.
async function flush(): Promise<void> {
  await Alpine.nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-accordion');
  if (!element) throw new Error('Expected accordion root');
  return element;
}

function items(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('.lyra-acc__item'));
}

function triggers(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('.lyra-acc__trigger'));
}

function panelWraps(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('.lyra-acc__panel-wrap'));
}

function panels(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('.lyra-acc__panel'));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraAccordion', () => {
  it('preserves consumer markup and wires generated and supplied ids through accordion ARIA', () => {
    const host = mountAccordion({ defaultOpen: 'two', customIds: true });
    const controls = triggers(host);
    const wraps = panelWraps(host);
    const content = panels(host);

    expect(root(host).id).not.toBe('');
    expect(items(host)[0].className).toBe('lyra-acc__item');
    expect(items(host)[1].className).toBe('lyra-acc__item lyra-acc__item--open');
    expect(controls[0].className).toBe('lyra-acc__trigger');
    expect(controls[0].querySelector('.lyra-acc__chevron')?.className).toBe('lyra-acc__chevron');
    expect(controls[0].id).toBe('custom-one-trigger');
    expect(controls[1].id).toBe(`${root(host).id}-trigger-1`);
    expect(content[0].id).toBe('custom-one-panel');
    expect(content[1].id).toBe(`${root(host).id}-panel-1`);

    for (const [index, control] of controls.entries()) {
      expect(control.type).toBe('button');
      expect(control.getAttribute('aria-expanded')).toBe(index === 1 ? 'true' : 'false');
      expect(control.getAttribute('aria-controls')).toBe(content[index].id);
      expect(content[index].getAttribute('aria-labelledby')).toBe(control.id);
      expect(wraps[index].hasAttribute('inert')).toBe(index !== 1);
    }
  });

  it('swaps the sole open item and keeps every panel mounted for the CSS height transition', async () => {
    const host = mountAccordion({ defaultOpen: 'one' });
    const controls = triggers(host);
    const wraps = panelWraps(host);

    expect(panels(host)).toHaveLength(2);
    expect(getComputedStyle(wraps[1]).transitionProperty).toContain('grid-template-rows');
    controls[1].focus();
    await userEvent.keyboard(' ');
    await flush();

    expect(items(host)[0].classList).not.toContain('lyra-acc__item--open');
    expect(items(host)[1].classList).toContain('lyra-acc__item--open');
    expect(wraps[0].hasAttribute('inert')).toBe(true);
    expect(wraps[1].hasAttribute('inert')).toBe(false);
    expect(panels(host)).toHaveLength(2);
  });

  it('allows independent open items with Space and Enter when multiple is enabled', async () => {
    const host = mountAccordion({ multiple: true });
    const controls = triggers(host);

    controls[0].focus();
    await userEvent.keyboard(' ');
    await flush();
    controls[1].focus();
    await userEvent.keyboard('{Enter}');
    await flush();

    expect(items(host)[0].classList).toContain('lyra-acc__item--open');
    expect(items(host)[1].classList).toContain('lyra-acc__item--open');
    expect(panelWraps(host).every((wrap) => !wrap.hasAttribute('inert'))).toBe(true);
  });

  it('keeps a closed panel inert and unreachable by Tab while its DOM remains present', async () => {
    const host = mountAccordion({ defaultOpen: 'one' });
    const controls = triggers(host);
    const after = host.querySelector<HTMLButtonElement>('[data-testid="after"]');
    if (!after) throw new Error('Expected focus target after accordion');

    expect(panelWraps(host)[1].hasAttribute('inert')).toBe(true);
    expect(panels(host)[1]).toBeInstanceOf(HTMLElement);
    controls[1].focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(after);
  });

  it('is axe clean while closed and open', async () => {
    const host = mountAccordion();
    await expectNoAxeViolations(host);
    await userEvent.click(triggers(host)[0]);
    await flush();
    await expectNoAxeViolations(host);
  });

  it('synchronizes openItems as an array with x-modelable in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: ['one'] }">
        <div class="lyra-accordion" x-data="lyraAccordion()" x-modelable="openItems" x-model="outer">
          <div class="lyra-acc__item" data-value="one" x-bind="item"><button class="lyra-acc__trigger" x-bind="trigger">One</button><div class="lyra-acc__panel-wrap" x-bind="panelWrap"><div class="lyra-acc__panel-clip"><div class="lyra-acc__panel" x-bind="panel">One</div></div></div></div>
          <div class="lyra-acc__item" data-value="two" x-bind="item"><button class="lyra-acc__trigger" x-bind="trigger">Two</button><div class="lyra-acc__panel-wrap" x-bind="panelWrap"><div class="lyra-acc__panel-clip"><div class="lyra-acc__panel" x-bind="panel">Two</div></div></div></div>
        </div>
        <button type="button" data-testid="external-open" x-on:click="outer = ['two']">Open two externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);

    const external = host.querySelector<HTMLButtonElement>('[data-testid="external-open"]');
    if (!external) throw new Error('Expected external control');
    await userEvent.click(external);
    await flush();
    expect(items(host)[0].classList).not.toContain('lyra-acc__item--open');
    expect(items(host)[1].classList).toContain('lyra-acc__item--open');
    expect((Alpine.$data(root(host)) as { openItems: string[] }).openItems).toEqual(['two']);

    await userEvent.click(triggers(host)[1]);
    await flush();
    expect(
      (Alpine.$data(host.firstElementChild as HTMLElement) as { outer: string[] }).outer,
    ).toEqual([]);
  });
});
