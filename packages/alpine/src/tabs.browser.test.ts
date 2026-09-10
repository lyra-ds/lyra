import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function tabsMarkup({
  active = 'one',
  customIds = false,
  direction = 'ltr',
  variant = 'line',
  serverRenderedActive = false,
}: {
  active?: string;
  customIds?: boolean;
  direction?: 'ltr' | 'rtl';
  variant?: 'line' | 'pills';
  serverRenderedActive?: boolean;
} = {}): string {
  const listClasses = variant === 'pills' ? 'lyra-tabs lyra-tabs--pills' : 'lyra-tabs';
  const staticActiveClass = serverRenderedActive && active === 'one' ? ' lyra-tab--active' : '';
  return `
    <div ${customIds ? 'id="project-tabs"' : ''} data-lyra-tabs x-data="lyraTabs({ active: '${active}' })">
      <nav aria-label="Project sections" data-lyra-tabs-fallback x-bind="fallback">
        <a href="#one-panel">One</a><a href="#two-panel">Two</a><a href="#three-panel">Three</a>
      </nav>
      <div class="${listClasses}" dir="${direction}" aria-label="Project sections" data-lyra-tabs-enhanced x-bind="list" hidden>
        <button ${customIds ? 'id="custom-one-tab"' : ''} type="button" class="lyra-tab${staticActiveClass}" data-value="one" x-bind="tab">One <span class="lyra-tab__count">2</span></button>
        <button type="button" class="lyra-tab" data-value="two" x-bind="tab">Two</button>
        <button type="button" class="lyra-tab" data-value="three" x-bind="tab">Three</button>
      </div>
      <section id="one-panel" data-value="one" x-bind="panel"><h2>One</h2><p>One panel</p></section>
      <section id="two-panel" data-value="two" x-bind="panel"><h2>Two</h2><p>Two panel</p></section>
      <section id="three-panel" data-value="three" x-bind="panel"><h2>Three</h2><p>Three panel</p></section>
    </div>
  `;
}

function mountTabs(options: Parameters<typeof tabsMarkup>[0] = {}): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = tabsMarkup(options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
}

function root(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[data-lyra-tabs]');
  if (!element) throw new Error('Expected Tabs root');
  return element;
}

function list(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[data-lyra-tabs-enhanced]');
  if (!element) throw new Error('Expected Tabs list');
  return element;
}

function fallback(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('[data-lyra-tabs-fallback]');
  if (!element) throw new Error('Expected Tabs fallback');
  return element;
}

function tabs(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('button[x-bind="tab"]'));
}

function panels(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('section[x-bind="panel"]'));
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
});

describe('lyraTabs', () => {
  it('leaves the required native fallback readable before Alpine initializes', () => {
    const host = document.createElement('div');
    host.innerHTML = tabsMarkup();
    const serverRoot = root(host);
    const serverList = list(host);

    expect(serverRoot.hasAttribute('role')).toBe(false);
    expect(fallback(host).hidden).toBe(false);
    expect(serverList.hidden).toBe(true);
    expect(serverList.hasAttribute('role')).toBe(false);
    expect(tabs(host).every((tab) => !tab.hasAttribute('role'))).toBe(true);
    expect(panels(host).every((panel) => !panel.hidden && !panel.hasAttribute('role'))).toBe(true);
  });

  it('enhances complete paired markup with supplied and value-stable generated ids', async () => {
    const host = mountTabs({ active: 'two', customIds: true });
    await flush();

    expect(root(host).id).toBe('project-tabs');
    expect(fallback(host).hidden).toBe(true);
    expect(list(host).hidden).toBe(false);
    expect(list(host).getAttribute('role')).toBe('tablist');
    expect(tabs(host)[0].classList).toContain('lyra-tab');
    expect(tabs(host)[0].querySelector('.lyra-tab__count')?.className).toBe('lyra-tab__count');
    expect(tabs(host)[0].querySelector('.lyra-tab__count')?.textContent).toBe('2');
    expect(tabs(host)[0].id).toBe('custom-one-tab');
    expect(tabs(host)[1].id).toBe('project-tabs-tab-two');
    expect(tabs(host)[0].getAttribute('aria-controls')).toBe('one-panel');
    expect(panels(host)[1].getAttribute('aria-labelledby')).toBe('project-tabs-tab-two');
    expect(tabs(host)[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs(host)[1].getAttribute('data-state')).toBe('active');
    expect(panels(host)[1].hidden).toBe(false);
    expect(panels(host)[0].hidden).toBe(true);
  });

  it('fails invalid active input visibly without hiding native content', async () => {
    const host = mountTabs({ active: 'missing', customIds: true });
    await flush();

    expect((Alpine.$data(root(host)) as { ready: boolean }).ready).toBe(false);
    expect(fallback(host).hidden).toBe(false);
    expect(list(host).hidden).toBe(true);
    expect(list(host).hasAttribute('role')).toBe(false);
    expect(tabs(host)[0].id).toBe('custom-one-tab');
    expect(panels(host).every((panel) => !panel.hidden && !panel.hasAttribute('role'))).toBe(true);
  });

  it('preserves supplied trigger ids when duplicate paired values prevent enhancement', async () => {
    const host = document.createElement('div');
    host.innerHTML = tabsMarkup({ customIds: true }).replace(
      'data-value="two" x-bind="tab"',
      'data-value="one" x-bind="tab"',
    );
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    await flush();

    expect((Alpine.$data(root(host)) as { ready: boolean }).ready).toBe(false);
    expect(tabs(host)[0].id).toBe('custom-one-tab');
    expect(fallback(host).hidden).toBe(false);
  });

  it('emits cancellable before and synchronous committed change events only for accepted clicks', async () => {
    const host = mountTabs();
    const events: Array<{ name: string; detail: unknown; active: string }> = [];
    const tabsRoot = root(host);
    for (const name of ['lyra:tabs-before-change', 'lyra:tabs-change']) {
      tabsRoot.addEventListener(name, (event) => {
        events.push({
          name,
          detail: (event as CustomEvent).detail,
          active: (Alpine.$data(tabsRoot) as { active: string }).active,
        });
      });
    }

    await userEvent.click(tabs(host)[1]);

    expect(events).toEqual([
      {
        name: 'lyra:tabs-before-change',
        detail: { value: 'two', previousValue: 'one' },
        active: 'one',
      },
      { name: 'lyra:tabs-change', detail: { value: 'two', previousValue: 'one' }, active: 'two' },
    ]);

    tabsRoot.addEventListener('lyra:tabs-before-change', (event) => event.preventDefault(), {
      once: true,
    });
    await userEvent.click(tabs(host)[2]);
    expect((Alpine.$data(tabsRoot) as { active: string }).active).toBe('two');
    expect(events).toHaveLength(3);
  });

  it('honors native trigger and list prevention before the root-owned default', async () => {
    const host = mountTabs();
    const controls = tabs(host);
    const prevent = (event: Event): void => event.preventDefault();
    controls[1].addEventListener('click', prevent);
    list(host).addEventListener('keydown', prevent);

    await userEvent.click(controls[1]);
    controls[0].focus();
    await userEvent.keyboard('{ArrowRight}');

    expect((Alpine.$data(root(host)) as { active: string }).active).toBe('one');
    expect(document.activeElement).toBe(controls[0]);
  });

  it('uses current eligible DOM order and mirrors horizontal navigation in RTL', async () => {
    const host = mountTabs({ direction: 'rtl' });
    const controls = tabs(host);
    controls[1].disabled = true;
    controls[0].focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(controls[2]);
    expect((Alpine.$data(root(host)) as { active: string }).active).toBe('three');
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(controls[0]);
  });

  it('roves in LTR with Home, End and wrap in both directions', async () => {
    const host = mountTabs();
    const controls = tabs(host);
    controls[0].focus();

    for (const [key, index] of [
      ['{End}', 2],
      ['{ArrowRight}', 0],
      ['{ArrowLeft}', 2],
      ['{Home}', 0],
    ] as const) {
      await userEvent.keyboard(key);
      await flush();
      expect(document.activeElement).toBe(controls[index]);
      expect(controls[index].getAttribute('aria-selected')).toBe('true');
      expect(controls[index].getAttribute('tabindex')).toBe('0');
      expect(panels(host)[index].hidden).toBe(false);
    }
  });

  it('dispatches a cancellable before event when navigation targets the selected value', async () => {
    const host = mountTabs();
    const controls = tabs(host);
    const tabsRoot = root(host);
    controls[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(controls[1]);
    expect((Alpine.$data(tabsRoot) as { active: string }).active).toBe('two');
    (Alpine.$data(tabsRoot) as { active: string }).active = 'one';
    await flush();
    expect(document.activeElement).toBe(controls[1]);

    const before: Array<{ value: string; previousValue: string }> = [];
    tabsRoot.addEventListener('lyra:tabs-before-change', (event) => {
      before.push((event as CustomEvent<{ value: string; previousValue: string }>).detail);
      event.preventDefault();
    });

    await userEvent.keyboard('{Home}');

    expect(before).toEqual([{ value: 'one', previousValue: 'one' }]);
    expect(document.activeElement).toBe(controls[1]);
    expect((Alpine.$data(tabsRoot) as { active: string }).active).toBe('one');
  });

  it('skips collapsed tabs while choosing the next eligible destination', async () => {
    const host = mountTabs();
    const controls = tabs(host);
    controls[1].style.visibility = 'collapse';
    controls[0].focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(controls[2]);
    expect((Alpine.$data(root(host)) as { active: string }).active).toBe('three');
  });

  it('isolates nested roots and synchronizes x-modelable active in both directions', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: 'one' }">
        <div data-lyra-tabs x-data="lyraTabs({ active: 'one' })" x-modelable="active" x-model="outer">
          <nav aria-label="Outer sections" data-lyra-tabs-fallback x-bind="fallback"><a href="#one-panel">One</a><a href="#two-panel">Two</a></nav>
          <div class="lyra-tabs" data-lyra-tabs-enhanced x-bind="list" hidden><button class="lyra-tab" data-value="one" x-bind="tab">One</button><button class="lyra-tab" data-value="two" x-bind="tab">Two</button></div>
          <section id="one-panel" data-value="one" x-bind="panel"><h2>One</h2></section><section id="two-panel" data-value="two" x-bind="panel"><h2>Two</h2></section>
          <div data-lyra-tabs x-data="lyraTabs({ active: 'inner' })"><nav aria-label="Inner sections" data-lyra-tabs-fallback x-bind="fallback"><a href="#inner-panel">Inner</a></nav><div class="lyra-tabs" data-lyra-tabs-enhanced x-bind="list" hidden><button class="lyra-tab" data-value="inner" x-bind="tab">Inner</button></div><section id="inner-panel" data-value="inner" x-bind="panel"><h2>Inner</h2></section></div>
        </div>
        <button type="button" x-on:click="outer = 'two'">Set two</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    const outerRoot = host.querySelector<HTMLElement>('[x-modelable="active"]');
    if (!outerRoot) throw new Error('Expected modelable Tabs root');
    const changes: Event[] = [];
    outerRoot.addEventListener('lyra:tabs-change', (event) => changes.push(event));

    await userEvent.click(
      host.querySelector<HTMLButtonElement>('button[x-on\\:click]') as HTMLButtonElement,
    );
    await flush();

    expect((Alpine.$data(outerRoot) as { active: string }).active).toBe('two');
    expect(changes).toHaveLength(0);
    expect(host.querySelectorAll('[role="tablist"]')).toHaveLength(2);

    await userEvent.click(tabs(host)[0]);
    await flush();

    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: string }).outer).toBe(
      'one',
    );
    expect(changes).toHaveLength(1);
  });

  it('keeps native fallback after init then immediate destroy before the first flush', async () => {
    const host = mountTabs({ customIds: true });
    const retired = Alpine.$data(root(host)) as { ready: boolean };
    Alpine.destroyTree(root(host));
    await flush();

    expect(retired.ready).toBe(false);
    expect(fallback(host).hidden).toBe(false);
    expect(list(host).hidden).toBe(true);
    expect(list(host).hasAttribute('role')).toBe(false);
    expect(tabs(host)[0].id).toBe('custom-one-tab');
    for (const tab of tabs(host)) {
      expect(tab.hasAttribute('role')).toBe(false);
      expect(tab.hasAttribute('aria-selected')).toBe(false);
      expect(tab.hasAttribute('tabindex')).toBe(false);
    }
    for (const panel of panels(host)) {
      expect(panel.hidden).toBe(false);
      expect(panel.hasAttribute('role')).toBe(false);
      expect(panel.hasAttribute('aria-labelledby')).toBe(false);
    }
  });

  it('restores native fallback and matching fallback-link focus when destroyed', async () => {
    const host = mountTabs();
    const controls = tabs(host);
    controls[1].focus();

    Alpine.destroyTree(root(host));
    await flush();

    expect(fallback(host).hidden).toBe(false);
    expect(list(host).hidden).toBe(true);
    expect(panels(host).every((panel) => !panel.hidden && !panel.hasAttribute('role'))).toBe(true);
    expect(document.activeElement).toBe(fallback(host).querySelector('a[href="#two-panel"]'));
  });

  it('restores matching fallback-link focus from an enhanced panel container when destroyed', async () => {
    const host = mountTabs({ active: 'two' });
    const panel = panels(host)[1];
    await flush();
    panel.focus();
    expect(document.activeElement).toBe(panel);

    Alpine.destroyTree(root(host));
    await flush();

    expect(document.activeElement).toBe(fallback(host).querySelector('a[href="#two-panel"]'));
    expect(panel.hidden).toBe(false);
    expect(panel.hasAttribute('role')).toBe(false);
    expect(panel.hasAttribute('aria-labelledby')).toBe(false);
    expect(panel.hasAttribute('tabindex')).toBe(false);
    expect(panel.hasAttribute('data-state')).toBe(false);
  });

  it('uses the first eligible fallback when a focused panel container has no matching fallback', async () => {
    const host = mountTabs({ active: 'two' });
    const matchingFallback =
      fallback(host).querySelector<HTMLAnchorElement>('a[href="#two-panel"]');
    if (!matchingFallback) throw new Error('Expected matching fallback link');
    matchingFallback.hidden = true;
    const panel = panels(host)[1];
    await flush();
    panel.focus();
    expect(document.activeElement).toBe(panel);

    Alpine.destroyTree(root(host));
    await flush();

    expect(document.activeElement).toBe(fallback(host).querySelector('a[href="#one-panel"]'));
  });

  it('preserves focus in live native panel content when destroyed', async () => {
    const host = mountTabs();
    const panelButton = document.createElement('button');
    panelButton.type = 'button';
    panelButton.textContent = 'Native panel action';
    panels(host)[0].appendChild(panelButton);
    panelButton.focus();

    Alpine.destroyTree(root(host));
    await flush();

    expect(document.activeElement).toBe(panelButton);
  });

  it('does not let a detached root take focus from an outside element when destroyed', async () => {
    const host = mountTabs();
    const outside = document.createElement('button');
    outside.type = 'button';
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);

    const tabsRoot = root(host);
    tabsRoot.remove();
    Alpine.destroyTree(tabsRoot);
    await flush();

    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('deactivates a server-rendered active class after an accepted change', async () => {
    const host = mountTabs({ serverRenderedActive: true });
    const controls = tabs(host);
    expect(controls[0].classList).toContain('lyra-tab--active');

    await userEvent.click(controls[1]);

    expect(controls[0].classList).not.toContain('lyra-tab--active');
    expect(controls[1].classList).toContain('lyra-tab--active');
  });

  it('preserves line and pills classes and remains axe clean', async () => {
    for (const variant of ['line', 'pills'] as const) {
      const host = mountTabs({ variant });
      expect(list(host).classList).toContain('lyra-tabs');
      expect(list(host).classList.contains('lyra-tabs--pills')).toBe(variant === 'pills');
      await expectNoAxeViolations(host);
    }
  });

  it('is axe clean for the enhanced native-fallback composition', async () => {
    const host = mountTabs();
    await flush();
    await expectNoAxeViolations(host);
  });
});
