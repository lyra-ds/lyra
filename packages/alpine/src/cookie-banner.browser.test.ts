import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';

const DEFAULT_STORAGE_KEY = 'lyra-cookie-consent';
const CUSTOM_STORAGE_KEY = 'alpine-custom-cookie-banner-test';
const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function mountCookieBanner(options = '{}'): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div x-data="lyraCookieBanner(${options})">
      <div class="lyra-cookies" role="region" aria-label="Cookie notice" x-cloak x-bind="root">
        <p class="lyra-cookies__text">We use cookies to improve your experience.</p>
        <div class="lyra-cookies__actions">
          <button class="lyra-btn lyra-btn--secondary" x-bind="essentials">Only essentials</button>
          <button class="lyra-btn" x-bind="accept">Accept all</button>
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
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function banner(host: HTMLElement): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-cookies');
  if (!element) throw new Error('Expected cookie banner');
  return element;
}

function accept(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-btn:last-child');
  if (!element) throw new Error('Expected accept button');
  return element;
}

function essentials(host: HTMLElement): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>('.lyra-btn:first-child');
  if (!element) throw new Error('Expected essentials button');
  return element;
}

beforeEach(() => {
  localStorage.removeItem(DEFAULT_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_STORAGE_KEY);
});

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  localStorage.removeItem(DEFAULT_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_STORAGE_KEY);
});

describe('lyraCookieBanner', () => {
  it('shows after init when no choice is stored', async () => {
    const host = mountCookieBanner();
    await flush();

    expect(banner(host).style.display).not.toBe('none');
  });

  for (const choice of ['all', 'essentials'] as const) {
    it(`stays hidden when ${choice} is already stored`, async () => {
      localStorage.setItem(DEFAULT_STORAGE_KEY, choice);
      const host = mountCookieBanner();
      await flush();

      expect(banner(host).style.display).toBe('none');
    });
  }

  it('persists acceptance, dispatches its event, and finishes its exit on animationend', async () => {
    const host = mountCookieBanner();
    const events: Event[] = [];
    host.addEventListener('lyra:accept', (event) => events.push(event));
    await flush();

    await userEvent.click(accept(host));
    await flush();

    expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).toBe('all');
    expect(events).toHaveLength(1);
    expect(banner(host).classList).toContain('lyra-cookies--closing');

    banner(host).dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
    await flush();
    expect(banner(host).style.display).toBe('none');
  });

  it('persists essential-only consent and dispatches its event', async () => {
    const host = mountCookieBanner();
    const events: Event[] = [];
    host.addEventListener('lyra:essentials', (event) => events.push(event));
    await flush();

    await userEvent.click(essentials(host));
    await flush();

    expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).toBe('essentials');
    expect(events).toHaveLength(1);
  });

  it('honors a custom storage key', async () => {
    const host = mountCookieBanner(`{ storageKey: '${CUSTOM_STORAGE_KEY}' }`);
    await flush();
    await userEvent.click(accept(host));
    await flush();

    expect(localStorage.getItem(CUSTOM_STORAGE_KEY)).toBe('all');
    expect(localStorage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
  });

  it('synchronizes visible with x-modelable in both directions', async () => {
    localStorage.setItem(DEFAULT_STORAGE_KEY, 'all');
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outer: false }">
        <div x-data="lyraCookieBanner()" x-modelable="visible" x-model="outer">
          <div class="lyra-cookies" role="region" aria-label="Cookie notice" x-cloak x-bind="root">
            <div class="lyra-cookies__actions">
              <button class="lyra-btn lyra-btn--secondary" x-bind="essentials">Only essentials</button>
              <button class="lyra-btn" x-bind="accept">Accept all</button>
            </div>
          </div>
        </div>
        <button type="button" data-testid="external-show" x-on:click="outer = true">Show externally</button>
      </div>
    `;
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    const externalShow = host.querySelector<HTMLButtonElement>('[data-testid="external-show"]');
    if (!externalShow) throw new Error('Expected external state control');

    await userEvent.click(externalShow);
    await flush();
    expect(banner(host).style.display).not.toBe('none');

    await userEvent.click(accept(host));
    await flush();
    expect((Alpine.$data(host.firstElementChild as HTMLElement) as { outer: boolean }).outer).toBe(
      false,
    );
  });

  it('is axe clean while visible', async () => {
    const host = mountCookieBanner();
    await flush();

    await expectNoAxeViolations(host);
  });
});
