import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';
import { lyraToasts, type LyraToastsStore } from './toasts';
import { page, userEvent } from 'vitest/browser';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function toastStore(): LyraToastsStore {
  return Alpine.store('lyraToasts') as LyraToastsStore;
}

function mountToastStack(): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = `
    <div class="lyra-toast-stack" x-data="lyraToastStack()">
      <div data-lyra-toast-region="polite" aria-live="polite" aria-relevant="additions" style="display: contents">
        <template x-for="toast in politeToasts" :key="toast.id">
          <div class="lyra-toast">
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
      <div data-lyra-toast-region="assertive" aria-live="assertive" aria-relevant="additions" style="display: contents">
        <template x-for="toast in assertiveToasts" :key="toast.id">
          <div class="lyra-toast">
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
  Alpine.store('lyraToasts', lyraToasts());
}

beforeEach(async () => {
  const pointerOrigin = document.createElement('div');
  pointerOrigin.textContent = 'Pointer origin';
  document.body.append(pointerOrigin);
  await userEvent.hover(pointerOrigin);
  pointerOrigin.remove();
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
    vi.advanceTimersByTime(7999);
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

    const row = host.querySelector<HTMLElement>('.lyra-toast');
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

  it('mounts persistent live regions before any toast and leaves the stack itself non-live', () => {
    const host = mountToastStack();
    const stack = host.querySelector<HTMLElement>('.lyra-toast-stack');
    const polite = host.querySelector<HTMLElement>('[data-lyra-toast-region="polite"]');
    const assertive = host.querySelector<HTMLElement>('[data-lyra-toast-region="assertive"]');

    expect(stack?.hasAttribute('aria-live')).toBe(false);
    expect(polite?.getAttribute('aria-live')).toBe('polite');
    expect(assertive?.getAttribute('aria-live')).toBe('assertive');
    expect(host.querySelectorAll('.lyra-toast')).toHaveLength(0);
  });

  it('routes danger toasts to the assertive region and the rest to the polite one', async () => {
    const host = mountToastStack();
    const polite = host.querySelector<HTMLElement>('[data-lyra-toast-region="polite"]')!;
    const assertive = host.querySelector<HTMLElement>('[data-lyra-toast-region="assertive"]')!;
    const store = toastStore();
    store.info('Info notification', { duration: 0 });
    store.success('Success notification', { duration: 0 });
    store.error('Danger notification', { duration: 0 });
    await flush();

    expect(polite.querySelectorAll('.lyra-toast')).toHaveLength(2);
    expect(polite.textContent).not.toContain('Danger notification');
    expect(assertive.querySelectorAll('.lyra-toast')).toHaveLength(1);
    expect(assertive.textContent).toContain('Danger notification');
    expect(host.querySelector('.lyra-toast[role]')).toBeNull();
    expect(host.querySelector('[data-lyra-toast-region="polite"]')).toBe(polite);
  });

  it('renders a row with the matching tone class and visible icon', async () => {
    const host = mountToastStack();
    toastStore().toast('Danger notification', { tone: 'danger', duration: 0 });
    await flush();

    const row = host.querySelector<HTMLElement>('.lyra-toast');
    const icon = row?.querySelector<HTMLElement>('.lyra-toast__icon');
    const icons = row?.querySelectorAll<SVGSVGElement>('.lyra-toast__icon svg');
    if (!row || !icon || !icons) throw new Error('Expected rendered toast row and icons');

    expect(row.classList).toContain('lyra-toast');
    expect(row.hasAttribute('role')).toBe(false);
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
    expect(host.querySelectorAll('.lyra-toast')).toHaveLength(1);
    expect(host.querySelector('.lyra-toast')?.textContent).toContain('First notification');
  });

  it('auto-dismisses a toast queued while no stack is mounted', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();

    store.toast('Background notification');
    expect(store.items).toHaveLength(1);

    vi.advanceTimersByTime(8000);
    expect(store.items).toHaveLength(0);
  });

  it('is axe clean with a populated stack', async () => {
    const host = mountToastStack();
    toastStore().success('Changes saved', { duration: 0 });
    await flush();

    await expectNoAxeViolations(host);
  });
});

// Alpine.nextTick uses its own zero-delay timer; only flush that tick, never the toast deadline.
async function clockFlush(): Promise<void> {
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
}

describe('toast duration policy and renderer ownership', () => {
  it.each([
    [undefined, undefined, 'info', 8000],
    [undefined, undefined, 'success', 8000],
    [undefined, undefined, 'danger', 0],
    [8000, undefined, 'danger', 8000],
    [0, 300, 'danger', 300],
    [300, 0, 'info', 0],
    [300, 8000, 'danger', 8000],
    [8000, 300, 'success', 300],
    [undefined, 300, 'danger', 300],
    [undefined, 0, 'info', 0],
    [300, undefined, 'danger', 300],
    [0, undefined, 'success', 0],
  ] as const)(
    'resolves global %s, override %s, tone %s to %s',
    (global, duration, tone, expected) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      const store = toastStore();
      expect(store.duration).toBe(8000);
      if (global !== undefined) store.duration = global;
      store.toast('Boundary', { tone, duration });
      expect(Object.keys(store.items[0]).sort()).toEqual(['id', 'message', 'tone']);
      vi.advanceTimersByTime(expected ? expected - 1 : 100000);
      expect(store.items).toHaveLength(1);
      if (expected) {
        vi.advanceTimersByTime(1);
        expect(store.items).toHaveLength(0);
      } else expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('applies assigned defaults only to new notifications and normalizes error tone first', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();
    store.error('Persistent', { tone: 'info' });
    store.info('Old');
    vi.advanceTimersByTime(3000);
    store.duration = 8000;
    store.error('Explicit');
    vi.advanceTimersByTime(5000);
    expect(store.items.map(({ message }) => message)).toEqual(['Persistent', 'Explicit']);
    vi.advanceTimersByTime(3000);
    expect(store.items.map(({ message }) => message)).toEqual(['Persistent']);
  });

  for (const first of ['pointer', 'focus'] as const) {
    it(`pauses with ${first} first and resumes only after both claims clear`, async () => {
      const outside = document.createElement('button');
      outside.textContent = 'Outside';
      document.body.append(outside);
      mountedHosts.push(outside);
      mountToastStack();
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
      const store = toastStore();
      store.info('Paused');
      await clockFlush();
      await vi.advanceTimersByTimeAsync(3000);
      const close = page.getByRole('button', { name: 'Close notification' });
      await expect.element(close).toBeInTheDocument();
      outside.focus();
      await expect.element(outside).toHaveFocus();
      if (first === 'pointer') {
        await userEvent.hover(close);
        await expect.element(outside).toHaveFocus();
      }
      close.element().focus();
      await expect.element(close).toHaveFocus();
      await userEvent.hover(close);
      await expect.element(close).toHaveFocus();
      await vi.advanceTimersByTimeAsync(9000);
      if (first === 'pointer') await userEvent.hover(outside);
      else outside.focus();
      await expect.element(first === 'pointer' ? close : outside).toHaveFocus();
      await vi.advanceTimersByTimeAsync(9000);
      expect(store.items).toHaveLength(1);
      if (first === 'pointer') outside.focus();
      else await userEvent.hover(outside);
      await expect.element(outside).toHaveFocus();
      await vi.advanceTimersByTimeAsync(4999);
      expect(store.items).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(store.items).toHaveLength(0);
    });
  }

  it('releases only the destroyed renderer claims and remounts without resetting remaining time', async () => {
    const first = mountToastStack();
    const second = mountToastStack();
    const firstStack = first.querySelector<HTMLElement>('.lyra-toast-stack');
    if (!firstStack) throw new Error('Expected first renderer');
    firstStack.style.top = '0';
    firstStack.style.bottom = 'auto';
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();
    store.info('Shared');
    await clockFlush();
    await vi.advanceTimersByTimeAsync(3000);
    const closes = page.getByRole('button', { name: 'Close notification' });
    await userEvent.hover(closes.nth(0));
    closes.nth(1).element().focus();
    Alpine.destroyTree(first);
    first.remove();
    await vi.advanceTimersByTimeAsync(9000);
    expect(store.items).toHaveLength(1);
    Alpine.destroyTree(second);
    second.remove();
    await vi.advanceTimersByTimeAsync(2000);
    mountToastStack();
    await clockFlush();
    await vi.advanceTimersByTimeAsync(2999);
    expect(store.items).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(store.items).toHaveLength(0);
  });

  it('forwards the singleton bridge to only the latest store', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const old = toastStore();
    old.init();
    Alpine.store('lyraToasts', lyraToasts());
    const current = toastStore();
    current.init();
    current.init();
    window.dispatchEvent(
      new CustomEvent('lyra:toast', {
        detail: { message: 'Latest', tone: 'danger', duration: 250 },
      }),
    );
    expect(old.items).toHaveLength(0);
    expect(current.items).toHaveLength(1);
    vi.advanceTimersByTime(250);
    expect(current.items).toHaveLength(0);
  });
});

describe('toast focus ownership', () => {
  it('closes a public queue item without a lifetime record using canonical markup', async () => {
    const host = mountToastStack();
    const store = toastStore();
    store.items.push({ id: -1, message: 'Public notification', tone: 'info' });
    await flush();
    const close = page.getByRole('button', { name: 'Close notification' });
    await expect.element(close).toBeInTheDocument();
    close.element().focus();
    await expect.element(close).toHaveFocus();
    const items = store.items;
    store.dismiss(-2);
    expect(store.items).toBe(items);
    await expect.element(close).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await flush();
    expect(store.items).toHaveLength(0);
    expect(host.querySelector('.lyra-toast')).toBeNull();
    const region = page.getByRole('region', { name: 'Notifications' });
    await expect.element(region).toHaveFocus();
    store.dismiss(-1);
    await expect.element(region).toHaveFocus();
    expect(host.querySelectorAll('[aria-live]')).toHaveLength(2);
    expect(region.element().hasAttribute('aria-live')).toBe(false);
  });

  for (const invalid of ['none', 'removed', 'disabled', 'inert'] as const) {
    it(`restores the opener or persistent stack when opener is ${invalid}`, async () => {
      const opener = document.createElement('button');
      opener.textContent = 'Opener';
      document.body.append(opener);
      mountedHosts.push(opener);
      const host = mountToastStack();
      opener.focus();
      await expect.element(opener).toHaveFocus();
      toastStore().info('Focus notification', { duration: 0 });
      await flush();
      if (invalid === 'removed') opener.remove();
      if (invalid === 'disabled') opener.disabled = true;
      if (invalid === 'inert') opener.inert = true;
      const close = page.getByRole('button', { name: 'Close notification' });
      await expect.element(close).toBeInTheDocument();
      close.element().focus();
      await expect.element(close).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await flush();
      const group = page.getByRole('region', { name: 'Notifications' });
      await expect.element(group).toBeInTheDocument();
      await expect.element(invalid === 'none' ? opener : group).toHaveFocus();
      expect(host.querySelectorAll('[aria-live]')).toHaveLength(2);
      expect(group.element().hasAttribute('aria-live')).toBe(false);
    });
  }

  it('does not move focus on an unfocused dismissal and preserves authored labels', async () => {
    const host = mountToastStack();
    const group = host.querySelector('.lyra-toast-stack');
    if (!(group instanceof HTMLElement)) throw new Error('Expected stack');
    Alpine.destroyTree(host);
    group.setAttribute('aria-label', 'Saved notifications');
    Alpine.initTree(host);
    const store = toastStore();
    const id = store.error('Unfocused');
    await flush();
    const active = document.activeElement;
    store.dismiss(id);
    await flush();
    expect(document.activeElement).toBe(active);
    await expect
      .element(page.getByRole('region', { name: 'Saved notifications' }))
      .toBeInTheDocument();
  });
});

describe('toast row interaction isolation', () => {
  for (const mutation of ['remove', 'disable'] as const) {
    for (const hovered of [false, true]) {
      it(`reconciles focus after a descendant ${mutation}, pointer=${hovered}`, async () => {
        const host = mountToastStack();
        const outside = document.createElement('input');
        outside.setAttribute('aria-label', 'Outside');
        host.append(outside);
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
        const store = toastStore();
        store.info('Dynamic notification');
        await clockFlush();
        const message = page.getByText('Dynamic notification');
        const row = message.element().closest('.lyra-toast');
        if (!row) throw new Error('Expected toast row');
        const action = document.createElement('input');
        action.setAttribute('aria-label', 'Dynamic action');
        action.size = 8;
        row.append(action);
        await vi.advanceTimersByTimeAsync(3000);
        action.focus();
        await expect.element(action).toHaveFocus();
        if (hovered)
          await userEvent.hover(page.getByRole('button', { name: 'Close notification' }));
        await vi.advanceTimersByTimeAsync(9000);
        if (mutation === 'remove') action.remove();
        else action.disabled = true;
        await clockFlush();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (mutation === 'remove') expect(row.contains(document.activeElement)).toBe(false);
        else {
          expect(action.disabled).toBe(true);
          // Native focus fixup after disabling is asynchronous in some engines.
          // Establish outside focus before measuring the exact remaining duration.
          outside.focus();
          await expect.element(outside).toHaveFocus();
        }
        expect(row.contains(document.activeElement)).toBe(false);
        expect(row.matches(':hover')).toBe(hovered);
        if (hovered) {
          await vi.advanceTimersByTimeAsync(9000);
          expect(store.items).toHaveLength(1);
          await userEvent.hover(outside);
        }
        await vi.advanceTimersByTimeAsync(4999);
        expect(store.items).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(store.items).toHaveLength(0);
      });
    }
  }

  it('keeps independent deadlines, ignores duplicate/descendant events and cannot revive dismissed rows', async () => {
    const host = mountToastStack();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const store = toastStore();
    const paused = store.info('Paused');
    store.success('Running');
    await clockFlush();
    await vi.advanceTimersByTimeAsync(3000);
    const close = page.getByRole('button', { name: 'Close notification' }).nth(0);
    await userEvent.hover(close);
    const row = close.element().closest('.lyra-toast');
    if (!row) throw new Error('Expected toast row');
    const message = row.querySelector('span:nth-child(2)');
    if (!message) throw new Error('Expected plain text message');
    await userEvent.hover(message);
    row.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    row.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(5000);
    expect(store.items.map(({ id }) => id)).toEqual([paused]);
    const stale = close.element();
    store.dismiss(paused);
    await clockFlush();
    stale.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }));
    stale.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    store.dismiss(paused);
    await vi.advanceTimersByTimeAsync(100000);
    expect(store.items).toHaveLength(0);
    expect(host.querySelector('.lyra-toast')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps persistent notifications timer-free through descendant focus transitions', async () => {
    const host = mountToastStack();
    const store = toastStore();
    store.error('Persistent');
    await flush();
    const row = host.querySelector('.lyra-toast');
    if (!row) throw new Error('Expected toast row');
    const outside = document.createElement('button');
    outside.textContent = 'Outside';
    host.append(outside);
    const extra = document.createElement('input');
    extra.setAttribute('aria-label', 'Extra control');
    row.append(extra);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    await userEvent.hover(extra);
    const close = page.getByRole('button', { name: 'Close notification' });
    close.element().focus();
    await expect.element(close).toHaveFocus();
    await userEvent.tab();
    await expect.element(page.getByRole('textbox', { name: 'Extra control' })).toHaveFocus();
    await userEvent.hover(outside);
    extra.blur();
    await vi.advanceTimersByTimeAsync(100000);
    expect(store.items).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses the same region when a focused mixed-tone toast captured another row as opener', async () => {
    mountToastStack();
    const store = toastStore();
    store.info('First', { duration: 0 });
    await flush();
    page.getByRole('button', { name: 'Close notification' }).element().focus();
    const id = store.error('Second');
    await flush();
    page.getByRole('button', { name: 'Close notification' }).nth(1).element().focus();
    store.dismiss(id);
    await flush();
    await expect.element(page.getByRole('region', { name: 'Notifications' })).toHaveFocus();
    expect(store.items.map(({ message }) => message)).toEqual(['First']);
  });
});
