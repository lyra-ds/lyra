import '@lyra-ds/styles/styles.css';
import Alpine from 'alpinejs';
import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FILE_UPLOAD_SCENARIOS } from '../../../tools/file-upload/scenarios';
import { expectNoAxeViolations } from './internal/test-axe';
import lyra from './index';
import type {
  LyraFileUploadData,
  LyraFileUploadItem,
  LyraFileUploadOptions,
  LyraFileUploadSelectDetail,
} from './index';

const mountedHosts: HTMLElement[] = [];

Alpine.plugin(lyra);

function fileList(...files: File[]): FileList {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  return transfer.files;
}

function markup(id: string, options: LyraFileUploadOptions = {}): string {
  return `
    <div id="${id}" class="lyra-upload" data-state="idle"
      x-data='lyraFileUpload(${JSON.stringify(options)})' x-modelable="items">
      <label class="lyra-upload__zone" for="${id}-input" x-bind="zone">Select files</label>
      <input id="${id}-input" class="lyra-upload__input" type="file" x-bind="input">
      <ul class="lyra-upload__list">
        <template x-for="item in items" :key="item.id">
          <li class="lyra-upload__item" x-bind="itemBindings(item)">
            <span class="lyra-upload__item-name" x-text="item.name"></span>
            <span class="lyra-upload__item-meta"
              x-text="item.status === 'error' ? item.error.message : item.status"></span>
            <template x-if="item.status === 'uploading' || item.status === 'canceling'">
              <progress class="lyra-upload__bar" x-bind="progressBindings(item)"></progress>
            </template>
            <template x-if="item.status === 'uploading'">
              <button class="lyra-upload__cancel" x-bind="actionBindings('cancel', item)">Cancel</button>
            </template>
            <template x-if="item.status === 'canceled' || (item.status === 'error' && item.error.retryable)">
              <button class="lyra-upload__retry" x-bind="actionBindings('retry', item)">Retry</button>
            </template>
            <template x-if="item.status === 'selected' || item.status === 'success' || item.status === 'canceled' || item.status === 'error'">
              <button class="lyra-upload__remove" x-bind="actionBindings('remove', item)">Remove</button>
            </template>
          </li>
        </template>
      </ul>
      <span class="lyra-upload__live lyra-visually-hidden" aria-live="polite"
        aria-atomic="true" x-bind="liveRegion"></span>
    </div>`;
}

function mountControlledFileUpload(
  items: LyraFileUploadItem[] = [],
  options: LyraFileUploadOptions = {},
  { form = false, id = 'test-upload' }: { form?: boolean; id?: string } = {},
): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = form ? `<form>${markup(id, options)}</form>` : markup(id, options);
  document.body.appendChild(host);
  Alpine.initTree(host);
  data(host).setItems(items);
  mountedHosts.push(host);
  return host;
}

function root(host: ParentNode): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-upload');
  if (!element) throw new Error('Expected file upload root');
  return element;
}

function data(host: ParentNode): LyraFileUploadData {
  const value: unknown = Alpine.$data(root(host));
  if (
    value === null ||
    typeof value !== 'object' ||
    !('setItems' in value) ||
    typeof value.setItems !== 'function'
  ) {
    throw new Error('Expected file upload data');
  }
  return value as LyraFileUploadData;
}

function zone(host: ParentNode): HTMLLabelElement {
  const element = host.querySelector<HTMLLabelElement>('.lyra-upload__zone');
  if (!element) throw new Error('Expected upload zone');
  return element;
}

function input(host: ParentNode): HTMLInputElement {
  const element = host.querySelector<HTMLInputElement>('input[type="file"]');
  if (!element) throw new Error('Expected upload input');
  return element;
}

function liveRegion(host: ParentNode): HTMLElement {
  const element = host.querySelector<HTMLElement>('.lyra-upload__live');
  if (!element) throw new Error('Expected upload live region');
  return element;
}

function button(host: ParentNode, className: string): HTMLButtonElement {
  const element = host.querySelector<HTMLButtonElement>(className);
  if (!element) throw new Error(`Expected ${className} button`);
  return element;
}

function selectFiles(inputElement: HTMLInputElement, ...files: File[]): void {
  inputElement.files = fileList(...files);
  inputElement.dispatchEvent(new Event('change', { bubbles: true }));
}

async function flush(): Promise<void> {
  await Alpine.nextTick();
  await Alpine.nextTick();
}

function selected(id = 'selected', name = `${id}.pdf`): LyraFileUploadItem {
  return { id, name, size: 1, type: 'application/pdf', status: 'selected' };
}

function uploading(
  id = 'uploading',
  attemptId = `${id}-attempt`,
  value: number | null = 40,
): Extract<LyraFileUploadItem, { status: 'uploading' | 'canceling' }> {
  return {
    id,
    name: `${id}.pdf`,
    size: 1,
    type: 'application/pdf',
    status: 'uploading',
    attemptId,
    progress: value === null ? { kind: 'indeterminate' } : { kind: 'determinate', value },
  };
}

function failed(id = 'failed', attemptId = `${id}-attempt`): LyraFileUploadItem {
  return {
    id,
    name: `${id}.pdf`,
    size: 1,
    type: 'application/pdf',
    status: 'error',
    attemptId,
    error: { kind: 'transport', message: 'Offline', retryable: true },
  };
}

function succeeded(id: string): LyraFileUploadItem {
  return {
    id,
    name: `${id}.pdf`,
    size: 1,
    type: 'application/pdf',
    status: 'success',
    attemptId: `${id}-attempt`,
  };
}

function itemAttempt(item: LyraFileUploadItem): string | null {
  return 'attemptId' in item ? item.attemptId : null;
}

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    Alpine.destroyTree(host);
    host.remove();
  }
  vi.restoreAllMocks();
});

describe('lyraFileUpload', () => {
  it(FILE_UPLOAD_SCENARIOS.conformance, async () => {
    const host = mountControlledFileUpload();
    const onSelect = vi.fn();
    const onLegacyFiles = vi.fn();
    const onLegacyChange = vi.fn();
    root(host).addEventListener('lyra:file-upload:select', onSelect);
    root(host).addEventListener('lyra:files', onLegacyFiles);
    root(host).addEventListener('lyra:change', onLegacyChange);
    const file = new File(['one'], 'one.pdf', { type: 'application/pdf' });

    selectFiles(input(host), file);
    await flush();

    expect(onSelect).toHaveBeenCalledOnce();
    const event = onSelect.mock.calls[0][0] as CustomEvent<LyraFileUploadSelectDetail>;
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail).toEqual({
      selections: [
        {
          id: 'test-upload-1',
          file,
          name: 'one.pdf',
          size: 3,
          type: 'application/pdf',
          proposedItem: {
            id: 'test-upload-1',
            name: 'one.pdf',
            size: 3,
            type: 'application/pdf',
            status: 'selected',
          },
          proposedAttemptId: 'test-upload-attempt-1',
        },
      ],
    });
    expect(root(host).querySelector('.lyra-upload__item')).toBeNull();
    expect(onLegacyFiles).not.toHaveBeenCalled();
    expect(onLegacyChange).not.toHaveBeenCalled();
    expect(root(host)).toHaveAttribute('x-modelable', 'items');
    expect(root(host)).not.toHaveAttribute('x-modelable', 'dragging');
    expect(data(host)).not.toHaveProperty('updateItems');
    expect(data(host)).not.toHaveProperty('addFiles');
    expect(data(host)).not.toHaveProperty('timers');
  });

  it(FILE_UPLOAD_SCENARIOS.selection, async () => {
    const host = mountControlledFileUpload([], {
      accept: '.pdf',
      maxSizeMB: 1,
      messages: {
        validationAccept: '{name} deve corresponder a {accept}.',
        validationMaxSize: '{name} deve ter no máximo {maxSizeMB} MB.',
      },
    });
    const onSelect = vi.fn();
    root(host).addEventListener('lyra:file-upload:select', onSelect);

    selectFiles(input(host), new File(['text'], 'notes.txt', { type: 'text/plain' }));
    selectFiles(
      input(host),
      new File([new Uint8Array(1_000_001)], 'large.pdf', { type: 'application/pdf' }),
    );
    await flush();

    const acceptSelection = (onSelect.mock.calls[0][0] as CustomEvent<LyraFileUploadSelectDetail>)
      .detail.selections[0];
    expect(acceptSelection).toMatchObject({
      id: 'test-upload-1',
      proposedItem: {
        id: 'test-upload-1',
        status: 'error',
        error: {
          kind: 'validation',
          code: 'accept',
          message: 'notes.txt deve corresponder a .pdf.',
          retryable: false,
        },
      },
    });
    expect(acceptSelection).not.toHaveProperty('proposedAttemptId');
    const sizeSelection = (onSelect.mock.calls[1][0] as CustomEvent<LyraFileUploadSelectDetail>)
      .detail.selections[0];
    expect(sizeSelection).toMatchObject({
      id: 'test-upload-2',
      proposedItem: {
        status: 'error',
        error: {
          kind: 'validation',
          code: 'max-size',
          message: 'large.pdf deve ter no máximo 1 MB.',
          retryable: false,
        },
      },
    });
    expect(sizeSelection).not.toHaveProperty('proposedAttemptId');
  });

  it(FILE_UPLOAD_SCENARIOS.lifecycle, async () => {
    const host = mountControlledFileUpload([
      selected(),
      uploading('determinate', 'determinate-attempt', 100),
      {
        ...uploading('indeterminate', 'indeterminate-attempt', null),
        status: 'canceling',
      },
      failed(),
      {
        id: 'validation',
        name: 'validation.txt',
        size: 1,
        type: 'text/plain',
        status: 'error',
        error: { kind: 'validation', code: 'accept', message: 'Not a PDF', retryable: false },
      },
      {
        id: 'canceled',
        name: 'canceled.pdf',
        size: 1,
        type: 'application/pdf',
        status: 'canceled',
        attemptId: 'canceled-attempt',
      },
      succeeded('success'),
    ]);
    await flush();

    expect(root(host)).toHaveAttribute('data-state', 'active');
    expect(root(host).querySelectorAll('.lyra-upload__item')).toHaveLength(7);
    expect(root(host).querySelector('[data-state="uploading"]')).not.toBeNull();
    expect(root(host).querySelector('[data-state="canceling"]')).not.toBeNull();
    const progress = root(host).querySelectorAll('progress.lyra-upload__bar');
    expect(progress[0]).toHaveAttribute('max', '100');
    expect(progress[0]).toHaveAttribute('value', '100');
    expect(progress[1]).not.toHaveAttribute('value');
    expect(root(host).querySelectorAll('.lyra-upload__cancel')).toHaveLength(1);
    expect(root(host).querySelectorAll('.lyra-upload__retry')).toHaveLength(2);
    expect(root(host).querySelectorAll('.lyra-upload__remove')).toHaveLength(5);

    data(host).setItems([]);
    await flush();
    expect(root(host)).toHaveAttribute('data-state', 'idle');
    expect(root(host).querySelector('.lyra-upload__item')).toBeNull();
  });

  it(FILE_UPLOAD_SCENARIOS.retry, async () => {
    const original = failed('report', 'attempt-1');
    const host = mountControlledFileUpload([original]);
    const onRetry = vi.fn();
    root(host).addEventListener('lyra:file-upload:retry', onRetry);
    await flush();

    button(host, '.lyra-upload__retry').click();
    button(host, '.lyra-upload__retry').click();
    await flush();

    expect(onRetry).toHaveBeenCalledOnce();
    const event = onRetry.mock.calls[0][0] as CustomEvent;
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.detail).toEqual({
      id: 'report',
      previousAttemptId: 'attempt-1',
      proposedAttemptId: 'test-upload-attempt-1',
    });
    expect(button(host, '.lyra-upload__retry')).toBeDisabled();

    data(host).setItems([uploading('report', 'test-upload-attempt-1', 25)]);
    await flush();
    expect(data(host).items.map((item) => [item.status, itemAttempt(item)])).toEqual([
      ['uploading', 'test-upload-attempt-1'],
    ]);
    expect(root(host).querySelector('.lyra-upload__item')).toHaveAttribute(
      'data-state',
      'uploading',
    );
    expect(button(host, '.lyra-upload__cancel')).toBeEnabled();

    data(host).setItems([original]);
    await flush();
    expect(root(host).querySelector('.lyra-upload__item')).toHaveAttribute(
      'data-state',
      'uploading',
    );
    expect(root(host).querySelector('progress')).toHaveAttribute('value', '25');

    data(host).setItems([]);
    data(host).setItems([original]);
    await flush();
    expect(root(host).querySelector('.lyra-upload__item')).toBeNull();
  });

  it(FILE_UPLOAD_SCENARIOS.cancellation, async () => {
    const host = mountControlledFileUpload([uploading('video', 'attempt-1', null)]);
    const onCancel = vi.fn();
    const onTeardown = vi.fn();
    root(host).addEventListener('lyra:file-upload:cancel', onCancel);
    root(host).addEventListener('lyra:file-upload:teardown', onTeardown);
    await flush();

    button(host, '.lyra-upload__cancel').click();
    button(host, '.lyra-upload__cancel').click();
    await flush();

    expect(onCancel).toHaveBeenCalledOnce();
    const event = onCancel.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ id: 'video', attemptId: 'attempt-1' });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(button(host, '.lyra-upload__cancel')).toBeDisabled();

    data(host).setItems([{ ...uploading('video', 'attempt-1', null), status: 'canceling' }]);
    await flush();
    expect(root(host).querySelector('.lyra-upload__cancel')).toBeNull();
    expect(root(host).querySelector('.lyra-upload__remove')).toBeNull();

    Alpine.destroyTree(host);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onTeardown).not.toHaveBeenCalled();
    mountedHosts.splice(mountedHosts.indexOf(host), 1);
    host.remove();
  });

  it(FILE_UPLOAD_SCENARIOS.removal, async () => {
    const first = succeeded('first');
    const middle = succeeded('middle');
    const last = succeeded('last');
    const host = mountControlledFileUpload([first, middle, last]);
    const onRemove = vi.fn((event: Event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      data(host).setItems(data(host).items.filter((item) => item.id !== id));
    });
    root(host).addEventListener('lyra:file-upload:remove', onRemove);
    await flush();

    const middleButton = Array.from(
      root(host).querySelectorAll<HTMLButtonElement>('.lyra-upload__remove'),
    ).find((element) => element.getAttribute('aria-label') === 'Remove middle.pdf');
    if (!middleButton) throw new Error('Expected middle remove button');
    middleButton.focus();
    middleButton.click();
    await flush();

    expect(onRemove).toHaveBeenCalledOnce();
    const removeEvent = onRemove.mock.calls[0][0] as CustomEvent;
    expect(removeEvent.detail).toEqual({ id: 'middle' });
    expect(removeEvent.bubbles).toBe(true);
    expect(removeEvent.composed).toBe(true);
    expect(root(host).querySelector('[aria-label="Remove last.pdf"]')).toHaveFocus();
    expect(liveRegion(host)).toHaveTextContent('middle.pdf removed.');
  });

  it(FILE_UPLOAD_SCENARIOS.idempotence, async () => {
    const host = mountControlledFileUpload([failed(), uploading('active'), succeeded('done')]);
    const retry = vi.fn();
    const cancel = vi.fn();
    const remove = vi.fn();
    root(host).addEventListener('lyra:file-upload:retry', retry);
    root(host).addEventListener('lyra:file-upload:cancel', cancel);
    root(host).addEventListener('lyra:file-upload:remove', remove);
    await flush();

    for (const selector of [
      '.lyra-upload__retry',
      '.lyra-upload__cancel',
      '[aria-label="Remove done.pdf"]',
    ]) {
      button(host, selector).click();
      button(host, selector).click();
      await flush();
      expect(button(host, selector)).toBeDisabled();
    }

    expect(retry).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();

    data(host).setItems([
      uploading('failed', 'test-upload-attempt-1', 0),
      { ...uploading('active'), status: 'canceling' },
      selected('done'),
    ]);
    await flush();
    expect(root(host).querySelectorAll('button:disabled')).toHaveLength(0);
  });

  it(FILE_UPLOAD_SCENARIOS.single, async () => {
    const host = mountControlledFileUpload([uploading('active', 'active-1', null)], {
      multiple: false,
      messages: { selectionUnavailable: 'Substituição indisponível durante o envio.' },
    });
    const onSelect = vi.fn();
    root(host).addEventListener('lyra:file-upload:select', onSelect);
    await flush();

    expect(input(host)).toBeEnabled();
    expect(zone(host)).toHaveAttribute('aria-disabled', 'true');
    selectFiles(input(host), new File(['new'], 'new.pdf', { type: 'application/pdf' }));
    await flush();
    expect(onSelect).not.toHaveBeenCalled();
    expect(liveRegion(host)).toHaveTextContent('Substituição indisponível durante o envio.');

    const transfer = new DataTransfer();
    transfer.items.add(new File(['drop'], 'drop.pdf', { type: 'application/pdf' }));
    const drop = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: transfer,
    });
    expect(zone(host).dispatchEvent(drop)).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it(FILE_UPLOAD_SCENARIOS.form, async () => {
    const remote = succeeded('remote');
    const host = mountControlledFileUpload([remote], { name: 'attachments' }, { form: true });
    const form = host.querySelector('form');
    if (!form) throw new Error('Expected upload form');
    root(host).addEventListener('lyra:file-upload:select', (event) => {
      const detail = (event as CustomEvent<LyraFileUploadSelectDetail>).detail;
      data(host).setItems([remote, ...detail.selections.map((entry) => entry.proposedItem)]);
    });
    root(host).addEventListener('lyra:file-upload:remove', (event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      data(host).setItems(data(host).items.filter((item) => item.id !== id));
    });
    const file = new File(['local'], 'local.pdf', { type: 'application/pdf' });

    selectFiles(input(host), file);
    await flush();

    expect(new FormData(form).getAll('attachments')).toEqual([file]);
    expect(root(host).querySelector('[data-upload-id="remote"]')).not.toBeNull();
    button(host, '[aria-label="Remove local.pdf"]').click();
    await flush();
    expect(new FormData(form).getAll('attachments')).toEqual([]);
    expect(root(host).querySelector('[data-upload-id="remote"]')).not.toBeNull();
  });

  it('DF-FU-09 retains delayed and concurrent local files only for exact controlled echoes', async () => {
    const host = mountControlledFileUpload([], { name: 'attachments' }, { form: true });
    const form = host.querySelector('form');
    if (!form) throw new Error('Expected upload form');
    const proposals: LyraFileUploadItem[] = [];
    root(host).addEventListener('lyra:file-upload:select', (event) => {
      proposals.push(
        ...(event as CustomEvent<LyraFileUploadSelectDetail>).detail.selections.map(
          (entry) => entry.proposedItem,
        ),
      );
    });
    const first = new File(['first'], 'first.pdf', { type: 'application/pdf' });
    const second = new File(['second'], 'second.pdf', { type: 'application/pdf' });

    selectFiles(input(host), first);
    await Promise.resolve();
    data(host).setItems([]);
    selectFiles(input(host), second);
    await flush();
    expect(new FormData(form).getAll('attachments')).toEqual([]);

    data(host).setItems([proposals[1]]);
    await flush();
    expect(new FormData(form).getAll('attachments')).toEqual([second]);

    data(host).setItems([proposals[1], proposals[0]]);
    await flush();
    expect(data(host).items.map((item) => item.id)).toEqual([proposals[1]?.id, proposals[0]?.id]);
    expect(Array.from(input(host).files ?? [], (file) => file.name)).toEqual([
      'second.pdf',
      'first.pdf',
    ]);
    expect(
      new FormData(form)
        .getAll('attachments')
        .map((entry) => (entry instanceof File ? entry.name : entry)),
    ).toEqual(['second.pdf', 'first.pdf']);

    data(host).setItems([{ ...proposals[0], id: 'substituted' }]);
    await flush();
    expect(new FormData(form).getAll('attachments')).toEqual([]);
  });

  it('DF-FU-09 preserves required validation and resets a nameless same-file selection', async () => {
    const host = mountControlledFileUpload([], { required: true }, { form: true });
    const form = host.querySelector('form');
    if (!form) throw new Error('Expected upload form');
    const onSelect = vi.fn();
    root(host).addEventListener('lyra:file-upload:select', onSelect);
    const file = new File(['same'], 'same.pdf', { type: 'application/pdf' });

    expect(input(host)).toBeRequired();
    expect(form.checkValidity()).toBe(false);
    expect(Array.from(new FormData(form).entries())).toEqual([]);
    await userEvent.upload(input(host), file);
    await userEvent.upload(input(host), file);

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(input(host).value).toBe('');
    expect(Array.from(new FormData(form).entries())).toEqual([]);
  });

  it('routes x-modelable items through stale-attempt and pending-lock reconciliation', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <div x-data="{ outerItems: [{ id: 'report', name: 'report.pdf', size: 1, type: 'application/pdf', status: 'error', attemptId: 'attempt-1', error: { kind: 'transport', message: 'Offline', retryable: true } }] }">
        ${markup('model-upload')}
        <button data-set-uploading type="button"
          x-on:click="outerItems = [{ id: 'report', name: 'report.pdf', size: 1, type: 'application/pdf', status: 'uploading', attemptId: 'model-upload-attempt-1', progress: { kind: 'determinate', value: 25 } }]">
          Commit retry
        </button>
        <button data-set-stale type="button"
          x-on:click="outerItems = [{ id: 'report', name: 'report.pdf', size: 1, type: 'application/pdf', status: 'error', attemptId: 'attempt-1', error: { kind: 'transport', message: 'Offline', retryable: true } }]">
          Commit stale
        </button>
      </div>`;
    const uploadRoot = root(host);
    uploadRoot.setAttribute('x-model', 'outerItems');
    document.body.appendChild(host);
    Alpine.initTree(host);
    mountedHosts.push(host);
    await flush();

    button(host, '.lyra-upload__retry').click();
    await flush();
    expect(button(host, '.lyra-upload__retry')).toBeDisabled();
    button(host, '[data-set-uploading]').click();
    await flush();
    expect(root(host).querySelector('.lyra-upload__item')).toHaveAttribute(
      'data-state',
      'uploading',
    );
    expect(button(host, '.lyra-upload__cancel')).toBeEnabled();

    button(host, '[data-set-stale]').click();
    await flush();
    expect(root(host).querySelector('.lyra-upload__item')).toHaveAttribute(
      'data-state',
      'uploading',
    );
    expect(root(host).querySelector('progress')).toHaveAttribute('value', '25');
  });

  it(FILE_UPLOAD_SCENARIOS.announcements, async () => {
    const host = mountControlledFileUpload([], {
      messages: {
        selected: '{name} selecionado.',
        progress: '{name}: envio em {percent}%.',
        success: '{name} enviado.',
        removed: '{name} removido.',
      },
    });
    const item = selected('report', 'report.pdf');

    data(host).setItems([item]);
    expect(liveRegion(host)).toHaveTextContent('report.pdf selecionado.');
    data(host).setItems([uploading('report', 'attempt-1', 24)]);
    expect(liveRegion(host)).toHaveTextContent('report.pdf selecionado.');
    for (const [value, message] of [
      [25, 'report.pdf: envio em 25%.'],
      [50, 'report.pdf: envio em 50%.'],
      [75, 'report.pdf: envio em 75%.'],
      [100, 'report.pdf: envio em 100%.'],
    ] as const) {
      data(host).setItems([uploading('report', 'attempt-1', value)]);
      expect(liveRegion(host)).toHaveTextContent(message);
    }
    data(host).setItems([{ ...item, status: 'success', attemptId: 'attempt-1' }]);
    expect(liveRegion(host)).toHaveTextContent('report.pdf enviado.');
    data(host).setItems([]);
    expect(liveRegion(host)).toHaveTextContent('report.pdf removido.');
  });

  it('keeps unknown message tokens literal and never evaluates them', async () => {
    const diagnostic = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const browserGlobal = window as typeof window & { __lyraUploadExecuted?: boolean };
    browserGlobal.__lyraUploadExecuted = false;
    const host = mountControlledFileUpload([], {
      messages: { selected: '{name} {window.__lyraUploadExecuted = true}' },
    });

    data(host).setItems([selected('safe', 'safe.pdf')]);
    await flush();

    expect(liveRegion(host)).toHaveTextContent('safe.pdf {window.__lyraUploadExecuted = true}');
    expect(browserGlobal.__lyraUploadExecuted).toBe(false);
    expect(diagnostic).toHaveBeenCalledOnce();
    delete browserGlobal.__lyraUploadExecuted;
  });

  it('diagnoses a missing server root id instead of fabricating proposal identity', async () => {
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const host = mountControlledFileUpload([], {}, { id: '' });
    const onSelect = vi.fn();
    root(host).addEventListener('lyra:file-upload:select', onSelect);

    selectFiles(input(host), new File(['one'], 'one.pdf'));
    await flush();

    expect(diagnostic).toHaveBeenCalledOnce();
    expect(diagnostic.mock.calls[0][0]).toContain('id');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it(FILE_UPLOAD_SCENARIOS.alpine, async () => {
    const host = document.createElement('div');
    const serverMarkup = `
      <div id="delayed-upload" class="lyra-upload" data-state="active"
        x-data="lyraFileUpload({ name: 'attachments' })" x-modelable="items">
        <label class="lyra-upload__zone" for="delayed-input" x-bind="zone">Select files</label>
        <input id="delayed-input" class="lyra-upload__input" type="file"
          name="attachments" x-bind="input">
        <ul class="lyra-upload__list">
          <li class="lyra-upload__item" data-state="success" data-upload-id="server">
            <span class="lyra-upload__item-name">server.pdf</span>
            <span class="lyra-upload__item-meta">Uploaded</span>
          </li>
        </ul>
        <span class="lyra-upload__live" aria-live="polite" aria-atomic="true"
          x-bind="liveRegion"></span>
      </div>`;
    host.innerHTML = serverMarkup;
    document.body.appendChild(host);
    mountedHosts.push(host);
    const originalInput = input(host);
    const originalRow = root(host).querySelector('.lyra-upload__item');
    const preInitFile = new File(['native'], 'native.pdf', { type: 'application/pdf' });
    originalInput.files = fileList(preInitFile);
    const onSelect = vi.fn();
    const onAnyIntent = vi.fn();
    host.addEventListener('lyra:file-upload:select', onSelect);
    for (const name of [
      'lyra:file-upload:retry',
      'lyra:file-upload:cancel',
      'lyra:file-upload:remove',
      'lyra:file-upload:teardown',
    ]) {
      host.addEventListener(name, onAnyIntent);
    }

    expect(root(host).querySelector('.lyra-upload__item-name')).toHaveTextContent('server.pdf');
    Alpine.initTree(host);
    await flush();
    expect(input(host)).toBe(originalInput);
    expect(root(host).querySelector('.lyra-upload__item')).toBe(originalRow);
    expect(input(host).files).toEqual(fileList(preInitFile));
    expect(liveRegion(host)).toBeEmptyDOMElement();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onAnyIntent).not.toHaveBeenCalled();

    Alpine.destroyTree(host);
    expect(onSelect).not.toHaveBeenCalled();
    expect(onAnyIntent).not.toHaveBeenCalled();
    host.innerHTML = serverMarkup;
    Alpine.initTree(host);
    selectFiles(input(host), new File(['after'], 'after.pdf', { type: 'application/pdf' }));
    await flush();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onAnyIntent).not.toHaveBeenCalled();
    expect(root(host).querySelectorAll('[data-upload-id="server"]')).toHaveLength(1);
  });

  it(FILE_UPLOAD_SCENARIOS.progress, async () => {
    const host = mountControlledFileUpload([
      uploading('determinate', 'determinate-1', 48),
      { ...uploading('indeterminate', 'indeterminate-1', null), status: 'canceling' },
    ]);
    await flush();

    const progress = root(host).querySelectorAll('progress.lyra-upload__bar');
    expect(progress[0]).toHaveAttribute('value', '48');
    expect(progress[0]).toHaveAttribute('max', '100');
    expect(progress[0]).toHaveAccessibleName('determinate.pdf is 48% uploaded.');
    expect(progress[1]).not.toHaveAttribute('value');
    expect(progress[1]).toHaveAccessibleName('indeterminate.pdf is uploading.');
    await expectNoAxeViolations(host);
  });
});
