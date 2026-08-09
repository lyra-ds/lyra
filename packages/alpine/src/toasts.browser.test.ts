import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';
import type { LyraToastsStore } from './toasts';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function toastStore(): LyraToastsStore {
  return Alpine.store('lyraToasts') as LyraToastsStore;
}

function mountToastStack(): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div class="lyra-toast-stack" x-data="lyraToastStack()">
      <template x-for="toast in toasts" :key="toast.id">
        <div class="lyra-toast" role="status">
          <span class="lyra-toast__icon" :class="toneClass(toast.tone)">
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              x-show="toast.tone === 'success'">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              x-show="toast.tone === 'danger'">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              x-show="toast.tone === 'info'">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </span>
          <span x-text="toast.message"></span>
          <button class="lyra-toast__close" :data-toast-id="toast.id" x-bind="closeButton">×</button>
        </div>
      </template>
    </div>
  `;
  document.body.appendChild(host);
  Alpine.initTree(host);
  mountedHosts.push(host);
  return host;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Alpine.nextTick();
}

function resetToastStore(): void {
  const store = toastStore();
  for (const toast of store.items.slice()) store.dismiss(toast.id);
  store.duration = 4000;
  store.closeLabel = 'Close notification';
}

beforeEach(() => {
  resetToastStore();
});

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  resetToastStore();
  vi.useRealTimers();
});

describe('lyraToasts and lyraToastStack', () => {
  it('auto-dismisses at the store default duration', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();

    store.toast('Default timeout');
    vi.advanceTimersByTime(3999);
    expect(store.items).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(store.items).toHaveLength(0);
  });

  it('auto-dismisses at a per-toast duration override', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();

    store.toast('Override timeout', { duration: 300 });
    vi.advanceTimersByTime(299);
    expect(store.items).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(store.items).toHaveLength(0);
  });

  it('does not schedule a timer when duration is zero', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();

    store.toast('Persistent notification', { duration: 0 });

    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10_000);
    expect(store.items.map((toast) => toast.message)).toEqual(['Persistent notification']);
  });

  it('dismisses before expiry and clears the pending timer', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();
    const id = store.toast('Dismiss me');

    expect(vi.getTimerCount()).toBe(1);
    store.dismiss(id);
    expect(store.items).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);

    expect(() => vi.advanceTimersByTime(10_000)).not.toThrow();
    expect(store.items).toHaveLength(0);
  });

  it('forces sugar-method tones while toast defaults to info', () => {
    const store = toastStore();

    store.toast('Default', { duration: 0 });
    store.success('Saved', { tone: 'danger', duration: 0 });
    store.error('Failed', { tone: 'success', duration: 0 });
    store.info('Notice', { tone: 'danger', duration: 0 });

    expect(store.items.map((toast) => toast.tone)).toEqual(['info', 'success', 'danger', 'info']);
  });

  it('returns always-incrementing identifiers', () => {
    const store = toastStore();
    const first = store.toast('First', { duration: 0 });
    const second = store.toast('Second', { duration: 0 });

    expect(typeof first).toBe('number');
    expect(second).toBe(first + 1);
    expect(store.items.map((toast) => toast.id)).toEqual([first, second]);
  });

  it('renders a lyra:toast event once as plain text with its tone', async () => {
    const store = toastStore();
    const host = mountToastStack();
    store.init();
    store.init();

    window.dispatchEvent(
      new CustomEvent('lyra:toast', {
        detail: {
          message: '<strong data-event-markup="true">Livewire saved</strong>',
          tone: 'success',
          duration: 0,
        },
      }),
    );
    await flush();

    expect(store.items).toHaveLength(1);
    expect(store.items[0]).toMatchObject({
      message: '<strong data-event-markup="true">Livewire saved</strong>',
      tone: 'success',
    });

    const row = host.querySelector<HTMLElement>('[role="status"]');
    const message = row?.querySelectorAll<HTMLSpanElement>('span')[1];
    if (!row || !message) throw new Error('Expected rendered toast message');
    expect(message.textContent).toBe('<strong data-event-markup="true">Livewire saved</strong>');
    expect(row.querySelector('[data-event-markup="true"]')).toBeNull();
  });

  it('honours a lyra:toast event duration instead of the store default', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();
    store.init();

    window.dispatchEvent(
      new CustomEvent('lyra:toast', {
        detail: { message: 'Livewire saved', duration: 250 },
      }),
    );

    expect(store.items).toHaveLength(1);

    vi.advanceTimersByTime(249);
    expect(store.items).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(store.items).toHaveLength(0);
  });

  it('renders a polite row with the matching tone class and visible icon', async () => {
    const host = mountToastStack();
    toastStore().toast('Danger notification', { tone: 'danger', duration: 0 });
    await flush();

    const row = host.querySelector<HTMLElement>('[role="status"]');
    const icon = row?.querySelector<HTMLElement>('.lyra-toast__icon');
    const icons = row?.querySelectorAll<SVGSVGElement>('.lyra-toast__icon svg');
    if (!row || !icon || !icons) throw new Error('Expected rendered toast row and icons');

    expect(row.classList).toContain('lyra-toast');
    expect(row.getAttribute('role')).toBe('status');
    expect(icon.classList).toContain('lyra-toast__icon--danger');
    expect(icons).toHaveLength(3);
    expect(icons[0].style.display).toBe('none');
    expect(icons[1].style.display).not.toBe('none');
    expect(icons[2].style.display).toBe('none');
  });

  it('binds the localized close label and dismisses the clicked row', async () => {
    const host = mountToastStack();
    const store = toastStore();
    store.closeLabel = 'Fechar notificação';
    store.toast('First notification', { duration: 0 });
    store.toast('Second notification', { duration: 0 });
    await flush();

    const closes = host.querySelectorAll<HTMLButtonElement>('.lyra-toast__close');
    const close = closes[1];
    if (!close) throw new Error('Expected second toast close button');
    expect(close.type).toBe('button');
    expect(close.getAttribute('aria-label')).toBe('Fechar notificação');
    expect(close.textContent).toBe('×');

    close.click();
    await flush();
    expect(store.items.map((toast) => toast.message)).toEqual(['First notification']);
    expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(host.querySelector('[role="status"]')?.textContent).toContain('First notification');
  });

  it('auto-dismisses a toast queued while no stack is mounted', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();

    store.toast('Background notification');
    expect(store.items).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    expect(store.items).toHaveLength(0);
  });

  it('is axe clean with a populated stack', async () => {
    const host = mountToastStack();
    toastStore().success('Changes saved', { duration: 0 });
    await flush();

    await expectNoAxeViolations(host);
  });
});
