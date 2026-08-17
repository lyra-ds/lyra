/// <reference types="vite/client" />

import { afterEach, describe, expect, it } from 'vitest';
import englishEntry from '../en/file-upload-evidence/index.html?raw';

interface ScheduledTask {
  readonly callback: () => void;
  readonly milliseconds: number;
}

const mountedHosts: HTMLElement[] = [];

function mountEntry() {
  const parsed = new DOMParser().parseFromString(englishEntry, 'text/html');
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

afterEach(async () => {
  const { default: Alpine } = await import('alpinejs');
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
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

  it('keeps repeated bootstrap and same-node reconnect on the original initialization', async () => {
    const { host, input, root } = mountEntry();
    selectFiles(input, [new File(['native'], 'before.txt', { type: 'text/plain' })]);
    const { bootstrapAlpine } = await import('./alpine-bootstrap');
    const scheduler = controlledScheduler();
    const options = { schedule: scheduler.schedule, search: '?alpineDelay=0' };

    const first = bootstrapAlpine(root, options);
    const repeated = bootstrapAlpine(root, options);
    expect(repeated).toBe(first);
    expect(scheduler.tasks).toHaveLength(1);
    scheduler.runNext();
    await first;
    await flushAlpine();

    root.remove();
    host.appendChild(root);
    const reconnected = bootstrapAlpine(root, options);
    expect(reconnected).toBe(first);
    expect(scheduler.tasks).toHaveLength(0);
    expect(counter(host, 'alpine-initializations')).toBe(1);

    let selectionEvents = 0;
    root.addEventListener('lyra:file-upload:select', () => {
      selectionEvents += 1;
    });
    selectFiles(input, [new File(['after'], 'after.txt', { type: 'text/plain' })]);
    await flushAlpine();

    expect(selectionEvents).toBe(1);
    expect(counter(host, 'alpine-selection-intents')).toBe(1);
    expect(counter(host, 'alpine-controlled-echoes')).toBe(1);
    expect(counter(host, 'alpine-initializations')).toBe(1);
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
