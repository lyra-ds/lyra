/// <reference types="vite/client" />

import { afterEach, describe, expect, it, vi } from 'vitest';
import englishEntry from '../en/file-upload-evidence/index.html?raw';
import portugueseEntry from '../pt-BR/file-upload-evidence/index.html?raw';
import type { LyraFileUploadItem } from '@lyra-ds/alpine';

interface ScheduledTask {
  readonly callback: () => void;
  readonly milliseconds: number;
}

const mountedHosts: HTMLElement[] = [];

function mountEntry(entry = englishEntry) {
  const parsed = new DOMParser().parseFromString(entry, 'text/html');
  const host = document.createElement('div');
  for (const child of [...parsed.body.children]) host.appendChild(child.cloneNode(true));
  document.body.appendChild(host);
  mountedHosts.push(host);

  const root = host.querySelector<HTMLElement>('#alpine-evidence-root');
  const form = host.querySelector<HTMLFormElement>('#alpine-upload-form');
  const input = host.querySelector<HTMLInputElement>('#alpine-file');
  const liveRegion = host.querySelector<HTMLElement>('.lyra-upload__live');
  if (root === null || form === null || input === null || liveRegion === null) {
    throw new Error('The authored Alpine fixture is incomplete.');
  }

  return { form, host, input, liveRegion, root };
}

function selectFiles(input: HTMLInputElement, files: readonly File[]): void {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
}

function controlledScheduler() {
  const tasks: ScheduledTask[] = [];
  return {
    schedule(callback: () => void, milliseconds: number): void {
      tasks.push({ callback, milliseconds });
    },
    runNext(): void {
      const task = tasks.shift();
      if (task === undefined) throw new Error('Expected a scheduled Alpine initialization.');
      task.callback();
    },
    tasks,
  };
}

async function flushAlpine(): Promise<void> {
  const { default: Alpine } = await import('alpinejs');
  await Alpine.nextTick();
  await Alpine.nextTick();
}

function counter(host: HTMLElement, id: string): number {
  const value = host.querySelector(`#${id}`)?.textContent;
  if (value === undefined || value === null) throw new Error(`Missing counter ${id}.`);
  return Number(value);
}

async function setControlledItems(root: HTMLElement, items: LyraFileUploadItem[]): Promise<void> {
  const { default: Alpine } = await import('alpinejs');
  const data: unknown = Alpine.$data(root);
  if (typeof data !== 'object' || data === null || !('uploadItems' in data)) {
    throw new Error('Expected the parent-owned uploadItems model.');
  }
  data.uploadItems = items;
}

afterEach(async () => {
  const { default: Alpine } = await import('alpinejs');
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  vi.restoreAllMocks();
});

describe('delayed Alpine evidence bootstrap', () => {
  it('preserves a pre-init File and handles one later selection through one controlled path', async () => {
    const { form, host, input, liveRegion, root } = mountEntry();
    const file = new File(['native'], 'native.pdf', { type: 'application/pdf' });
    selectFiles(input, [file]);
    const originalInput = input;
    let selectionEvents = 0;
    root.addEventListener('lyra:file-upload:select', () => {
      selectionEvents += 1;
    });

    const { bootstrapAlpine } = await import('./alpine-bootstrap');
    const scheduler = controlledScheduler();
    const initialized = bootstrapAlpine(root, {
      schedule: scheduler.schedule,
      search: '?alpineDelay=37',
    });

    expect(scheduler.tasks.map(({ milliseconds }) => milliseconds)).toEqual([37]);
    expect(counter(host, 'alpine-initializations')).toBe(0);
    scheduler.runNext();
    await initialized;
    await flushAlpine();

    expect(root.querySelector('input[type=file]')).toBe(originalInput);
    expect(input.files?.[0]).toBe(file);
    expect(new FormData(form).get('file')).toBe(file);
    expect(counter(host, 'alpine-initializations')).toBe(1);
    expect(counter(host, 'alpine-selection-intents')).toBe(0);
    expect(counter(host, 'alpine-controlled-echoes')).toBe(0);
    expect(counter(host, 'alpine-connects')).toBe(1);
    expect(counter(host, 'alpine-disconnects')).toBe(0);
    expect(liveRegion).toBeEmptyDOMElement();
    expect(root.querySelectorAll('#alpine-file-upload')).toHaveLength(1);
    const identities = host.querySelector('#alpine-selection-identities');
    expect(identities).not.toBeNull();
    expect(identities?.closest('[aria-live]')).toBeNull();
    expect(identities).toBeEmptyDOMElement();

    const first = new File(['first'], 'first.pdf', { type: 'application/pdf' });
    const second = new File(['second'], 'second.pdf', { type: 'application/pdf' });
    selectFiles(input, [first, second]);
    await flushAlpine();

    expect(selectionEvents).toBe(1);
    expect(counter(host, 'alpine-selection-intents')).toBe(1);
    expect(counter(host, 'alpine-controlled-echoes')).toBe(1);
    expect(identities).toHaveTextContent('alpine-file-upload-1, alpine-file-upload-2');
    expect(root.querySelectorAll('.lyra-upload__item')).toHaveLength(2);
    const firstRemove = root.querySelector<HTMLButtonElement>('[aria-label="Remove first.pdf"]');
    if (firstRemove === null) throw new Error('Expected the first public remove action.');
    firstRemove.focus();
    firstRemove.click();
    await flushAlpine();

    expect(root.querySelectorAll('.lyra-upload__item')).toHaveLength(1);
    expect(root.querySelector('[aria-label="Remove second.pdf"]')).toHaveFocus();
    expect(selectionEvents).toBe(1);
    expect(counter(host, 'alpine-controlled-echoes')).toBe(1);
  });

  it.each([
    {
      entry: englishEntry,
      locale: 'en',
      selected: 'Selected',
      expected: ['Selected', 'Uploading', 'Canceling', 'Uploaded', 'Upload failed', 'Canceled'],
    },
    {
      entry: portugueseEntry,
      locale: 'pt-BR',
      selected: 'Selecionado',
      expected: ['Selecionado', 'Enviando', 'Cancelando', 'Enviado', 'Falha no envio', 'Cancelado'],
    },
  ])(
    'renders every controlled status in $locale after a real selection',
    async ({ entry, expected, selected }) => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { input, root } = mountEntry(entry);
      const { bootstrapAlpine } = await import('./alpine-bootstrap');
      const scheduler = controlledScheduler();
      const initialized = bootstrapAlpine(root, {
        schedule: scheduler.schedule,
        search: '?alpineDelay=0',
      });
      scheduler.runNext();
      await initialized;
      await flushAlpine();

      selectFiles(input, [new File(['status'], 'status.pdf', { type: 'application/pdf' })]);
      await flushAlpine();
      expect(root.querySelector('.lyra-upload__item-meta')).toHaveTextContent(selected);

      const items: LyraFileUploadItem[] = [
        {
          id: 'selected',
          name: 'selected.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'selected',
        },
        {
          id: 'uploading',
          name: 'uploading.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'uploading',
          attemptId: 'uploading-attempt',
          progress: { kind: 'indeterminate' },
        },
        {
          id: 'canceling',
          name: 'canceling.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'canceling',
          attemptId: 'canceling-attempt',
          progress: { kind: 'indeterminate' },
        },
        {
          id: 'success',
          name: 'success.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'success',
          attemptId: 'success-attempt',
        },
        {
          id: 'error',
          name: 'error.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'error',
          attemptId: 'error-attempt',
          error: { kind: 'transport', message: 'Offline', retryable: true },
        },
        {
          id: 'canceled',
          name: 'canceled.pdf',
          size: 1,
          type: 'application/pdf',
          status: 'canceled',
          attemptId: 'canceled-attempt',
        },
      ];
      await setControlledItems(root, items);
      await flushAlpine();

      expect(
        [...root.querySelectorAll('.lyra-upload__item-meta')].map((element) => element.textContent),
      ).toEqual(expected);
      expect(warning).not.toHaveBeenCalled();
    },
  );

  it('keeps repeated bootstrap idempotent and makes explicit reconnect teardown observable', async () => {
    const { host, input, root } = mountEntry();
    selectFiles(input, [new File(['native'], 'before.txt', { type: 'text/plain' })]);
    const { bootstrapAlpine, reconnectAlpineFixture, teardownAlpineFixture } =
      await import('./alpine-bootstrap');
    const scheduler = controlledScheduler();
    const options = { schedule: scheduler.schedule, search: '?alpineDelay=0' };

    const first = bootstrapAlpine(root, options);
    const repeated = bootstrapAlpine(root, options);
    expect(repeated).toBe(first);
    expect(scheduler.tasks).toHaveLength(1);
    scheduler.runNext();
    await first;
    await flushAlpine();

    const repeatedAfterInitialization = bootstrapAlpine(root, options);
    expect(repeatedAfterInitialization).toBe(first);
    expect(scheduler.tasks).toHaveLength(0);
    expect(counter(host, 'alpine-initializations')).toBe(1);
    expect(counter(host, 'alpine-connects')).toBe(1);
    expect(counter(host, 'alpine-disconnects')).toBe(0);

    await reconnectAlpineFixture(root);
    await flushAlpine();
    expect(counter(host, 'alpine-initializations')).toBe(2);
    expect(counter(host, 'alpine-connects')).toBe(2);
    expect(counter(host, 'alpine-disconnects')).toBe(1);
    const reconnectedInput = root.querySelector<HTMLInputElement>('#alpine-file');
    if (reconnectedInput === null) throw new Error('Expected the reconnected native input.');
    const reconnectedLiveRegion = root.querySelector<HTMLElement>('.lyra-upload__live');
    if (reconnectedLiveRegion === null) {
      throw new Error('Expected the reconnected live region.');
    }
    expect(reconnectedInput).not.toBe(input);

    let selectionEvents = 0;
    root.addEventListener('lyra:file-upload:select', () => {
      selectionEvents += 1;
    });
    selectFiles(reconnectedInput, [new File(['after'], 'after.txt', { type: 'text/plain' })]);
    await flushAlpine();

    expect(selectionEvents).toBe(1);
    expect(counter(host, 'alpine-selection-intents')).toBe(1);
    expect(counter(host, 'alpine-controlled-echoes')).toBe(1);
    expect(counter(host, 'alpine-initializations')).toBe(2);
    expect(root.querySelectorAll('.lyra-upload__item')).toHaveLength(1);

    await teardownAlpineFixture(root);
    await flushAlpine();
    expect(counter(host, 'alpine-connects')).toBe(2);
    expect(counter(host, 'alpine-disconnects')).toBe(2);
    expect(reconnectedLiveRegion).toBeEmptyDOMElement();
    selectFiles(reconnectedInput, [new File(['detached'], 'detached.txt', { type: 'text/plain' })]);
    await flushAlpine();
    expect(counter(host, 'alpine-selection-intents')).toBe(1);
    expect(counter(host, 'alpine-controlled-echoes')).toBe(1);
    expect(root.querySelectorAll('.lyra-upload__item')).toHaveLength(0);
    expect(reconnectedLiveRegion).toBeEmptyDOMElement();
  });

  it('accepts only unpadded base-10 Alpine delays inside the public bound', async () => {
    const { parseAlpineDelay } = await import('./alpine-bootstrap');

    for (const [search, expected] of [
      ['?alpineDelay=0', 0],
      ['?alpineDelay=1', 1],
      ['?alpineDelay=14999', 14_999],
      ['?alpineDelay=15000', 15_000],
      ['', 5_000],
      ['?other=10', 5_000],
      ['?alpineDelay=', 5_000],
      ['?alpineDelay=%2B1', 5_000],
      ['?alpineDelay=-1', 5_000],
      ['?alpineDelay=1.5', 5_000],
      ['?alpineDelay=01', 5_000],
      ['?alpineDelay=%201', 5_000],
      ['?alpineDelay=1%20', 5_000],
      ['?alpineDelay=1e3', 5_000],
      ['?alpineDelay=15001', 5_000],
    ] as const) {
      expect(parseAlpineDelay(search), search || 'absent value').toBe(expected);
    }
  });
});
