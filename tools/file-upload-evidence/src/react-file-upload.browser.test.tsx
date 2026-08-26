import { act, useRef, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import '@lyra-ds/styles/styles.css';
import {
  ReactFileUploadEvidence,
  type EvidenceOperatorMode,
  type ReactFileUploadEvidenceHandle,
} from './react-file-upload';

const REQUEST_URL = '/api/file-upload-evidence';
const CLIENT_HEADER = 'X-Lyra-Evidence-Client';

class TrackedEventTarget extends EventTarget {
  private readonly listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    if (callback !== null) {
      const listeners = this.listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
      listeners.add(callback);
      this.listeners.set(type, listeners);
    }
    super.addEventListener(type, callback, options);
  }

  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {
    if (callback !== null) {
      const listeners = this.listeners.get(type);
      listeners?.delete(callback);
      if (listeners?.size === 0) this.listeners.delete(type);
    }
    super.removeEventListener(type, callback, options);
  }

  hasListeners(): boolean {
    return this.listeners.size > 0;
  }
}

class ControllableUpload extends TrackedEventTarget implements XMLHttpRequestUpload {
  onabort: ((this: XMLHttpRequestUpload, event: ProgressEvent) => unknown) | null = null;
  onerror: ((this: XMLHttpRequestUpload, event: ProgressEvent) => unknown) | null = null;
  onload: ((this: XMLHttpRequestUpload, event: ProgressEvent) => unknown) | null = null;
  onloadend: ((this: XMLHttpRequestUpload, event: ProgressEvent) => unknown) | null = null;
  onloadstart: ((this: XMLHttpRequestUpload, event: ProgressEvent) => unknown) | null = null;
  onprogress: ((this: XMLHttpRequestUpload, event: ProgressEvent) => unknown) | null = null;
  ontimeout: ((this: XMLHttpRequestUpload, event: ProgressEvent) => unknown) | null = null;

  progress(lengthComputable: boolean, loaded: number, total: number): void {
    this.dispatchEvent(new ProgressEvent('progress', { lengthComputable, loaded, total }));
  }
}

interface RequestExpectation {
  readonly mode: 'success' | 'error' | 'delay';
  readonly beforeAbort?: () => void;
  readonly requireDetachedBeforeAbort?: boolean;
}

type RequestSetup = RequestExpectation | RequestExpectation['mode'];

class ControllableXMLHttpRequest extends TrackedEventTarget implements XMLHttpRequest {
  readonly DONE = XMLHttpRequest.DONE;
  readonly HEADERS_RECEIVED = XMLHttpRequest.HEADERS_RECEIVED;
  readonly LOADING = XMLHttpRequest.LOADING;
  readonly OPENED = XMLHttpRequest.OPENED;
  readonly UNSENT = XMLHttpRequest.UNSENT;
  readonly upload = new ControllableUpload();
  onabort: ((this: XMLHttpRequest, event: ProgressEvent) => unknown) | null = null;
  onerror: ((this: XMLHttpRequest, event: ProgressEvent) => unknown) | null = null;
  onload: ((this: XMLHttpRequest, event: ProgressEvent) => unknown) | null = null;
  onloadend: ((this: XMLHttpRequest, event: ProgressEvent) => unknown) | null = null;
  onloadstart: ((this: XMLHttpRequest, event: ProgressEvent) => unknown) | null = null;
  onprogress: ((this: XMLHttpRequest, event: ProgressEvent) => unknown) | null = null;
  onreadystatechange: ((this: XMLHttpRequest, event: Event) => unknown) | null = null;
  ontimeout: ((this: XMLHttpRequest, event: ProgressEvent) => unknown) | null = null;
  readyState: number = XMLHttpRequest.UNSENT;
  response: unknown = null;
  responseText = '';
  responseType: XMLHttpRequestResponseType = '';
  responseURL = '';
  responseXML: Document | null = null;
  status = 0;
  statusText = '';
  timeout = 0;
  withCredentials = false;
  sentFile: File | null = null;
  private didInvokeBeforeAbort = false;
  private method = '';
  private url = '';
  private readonly headers = new Headers();

  constructor(
    private readonly expectation: RequestExpectation,
    private readonly acceptFile: (file: File) => void,
  ) {
    super();
  }

  abort(): void {
    if (!this.didInvokeBeforeAbort) {
      this.didInvokeBeforeAbort = true;
      this.expectation.beforeAbort?.();
    }
    if (
      this.expectation.requireDetachedBeforeAbort === true &&
      (this.hasListeners() || this.upload.hasListeners())
    ) {
      throw new Error('Cleanup must remove request listeners before aborting the request.');
    }
    this.dispatchEvent(new ProgressEvent('abort'));
    this.dispatchEvent(new ProgressEvent('loadend'));
  }

  getAllResponseHeaders(): string {
    return '';
  }

  getResponseHeader(_name: string): string | null {
    return null;
  }

  open(method: string, url: string | URL): void;
  open(
    method: string,
    url: string | URL,
    async: boolean,
    username?: string | null,
    password?: string | null,
  ): void;
  open(method: string, url: string | URL): void {
    this.method = method;
    this.url = String(url);
    this.readyState = XMLHttpRequest.OPENED;
  }

  overrideMimeType(_mime: string): void {}

  respond(status: number, response: unknown): void {
    this.status = status;
    this.response = response;
    this.readyState = XMLHttpRequest.DONE;
    this.dispatchEvent(new ProgressEvent('load'));
    this.dispatchEvent(new ProgressEvent('loadend'));
  }

  send(body?: Document | XMLHttpRequestBodyInit | null): void {
    if (this.method !== 'POST' || this.url !== REQUEST_URL) {
      throw new Error('The evidence request must POST to the preview endpoint.');
    }
    if (this.headers.get(CLIENT_HEADER) !== 'xhr') {
      throw new Error('The evidence request must identify the XHR client.');
    }
    if (!(body instanceof FormData)) {
      throw new Error('The evidence request body must be multipart form data.');
    }
    const file = body.get('file');
    if (!(file instanceof File)) {
      throw new Error('The evidence request must include the selected File.');
    }
    this.sentFile = file;
    this.acceptFile(file);
    if (body.get('locale') !== 'en') {
      throw new Error('The evidence request must preserve the selected route locale.');
    }
    const mode = body.get('mode');
    if (mode !== this.expectation.mode) {
      throw new Error(`The operator mode must map to endpoint mode ${this.expectation.mode}.`);
    }
    if (mode === 'delay' && body.get('delay') !== '15000') {
      throw new Error('A delayed request must remain within the endpoint bound.');
    }
  }

  setRequestHeader(name: string, value: string): void {
    this.headers.set(name, value);
  }
}

class ControllableTransport {
  readonly requests: ControllableXMLHttpRequest[] = [];
  private readonly selectedFiles = new Map<string, File>();

  constructor(private readonly requestSetups: readonly RequestSetup[]) {}

  create = (): XMLHttpRequest => {
    const setup = this.requestSetups[this.requests.length];
    if (setup === undefined) throw new Error('An unexpected evidence request started.');
    const expectation = typeof setup === 'string' ? { mode: setup } : setup;

    const request = new ControllableXMLHttpRequest(expectation, (file) => {
      const selectedFile = this.selectedFiles.get(file.name);
      if (selectedFile === undefined) {
        this.selectedFiles.set(file.name, file);
      } else if (selectedFile !== file) {
        throw new Error('A retry must reuse the exact selected File.');
      }
    });
    this.requests.push(request);
    return request;
  };
}

const messages = {
  retry: (name: string) => `Retry ${name}`,
  cancel: (name: string) => `Cancel ${name}`,
  remove: (name: string) => `Remove ${name}`,
  selected: (name: string) => `${name} selected.`,
  progress: (name: string, percent: number) => `${name} is ${percent}% uploaded.`,
  progressIndeterminate: (name: string) => `${name} is uploading.`,
  canceling: (name: string) => `${name} canceling.`,
  success: (name: string) => `${name} uploaded.`,
  error: (name: string, message: string) => `${name}: ${message}`,
  canceled: (name: string) => `${name} canceled.`,
  removed: (name: string) => `${name} removed.`,
};

interface OperatorHarnessProps {
  initialMode: EvidenceOperatorMode;
  transport: ControllableTransport;
  withDiagnostics?: boolean;
}

function OperatorHarness({
  initialMode,
  transport,
  withDiagnostics = false,
}: OperatorHarnessProps) {
  const [mode, setMode] = useState(initialMode);
  const instrumentRef = useRef<ReactFileUploadEvidenceHandle>(null);

  return (
    <form>
      <button type="button" onClick={() => setMode('success')}>
        Use success
      </button>
      <button type="button" onClick={() => instrumentRef.current?.advanceIndeterminate()}>
        Advance recorded progress
      </button>
      <button type="button" onClick={() => instrumentRef.current?.deliverStale()}>
        Deliver retained result
      </button>
      <ReactFileUploadEvidence
        ref={instrumentRef}
        locale="en"
        mode={mode}
        xhrFactory={transport.create}
        label="Evidence file"
        hint="Choose evidence files"
        messages={messages}
        multiple
        {...(withDiagnostics
          ? {
              renderDiagnostics: () => (
                <aside aria-label="Lifecycle diagnostics">Idle diagnostics</aside>
              ),
            }
          : {})}
      />
    </form>
  );
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) throw new Error('The native file input was not rendered.');
  return input;
}

function liveRegion(): HTMLElement {
  const live = document.querySelector<HTMLElement>('[aria-live="polite"]');
  if (live === null) throw new Error('The persistent live region was not rendered.');
  return live;
}

async function selectNativeFile(file: File): Promise<void> {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  const input = fileInput();
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: transfer.files,
    writable: true,
  });
  const actEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const previousActEnvironment = actEnvironment.IS_REACT_ACT_ENVIRONMENT;
  actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    });
  } finally {
    if (previousActEnvironment === undefined) {
      delete actEnvironment.IS_REACT_ACT_ENVIRONMENT;
    } else {
      actEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  }
}

afterEach(() => cleanup());

describe('ReactFileUploadEvidence', () => {
  it('keeps private evidence hooks on the real accessible FileUpload output', async () => {
    const transport = new ControllableTransport(['delay']);
    await render(<OperatorHarness initialMode="delay" transport={transport} withDiagnostics />);
    const input = page.getByLabelText('Evidence file');
    await expect.element(input).toHaveAttribute('data-evidence-id', 'react-file-input');
    await expect
      .element(page.getByRole('complementary', { name: 'Lifecycle diagnostics' }))
      .toHaveAttribute('data-evidence-id', 'react-diagnostics');

    await userEvent.upload(
      await input.element(),
      new File(['hook'], 'hook.pdf', { type: 'application/pdf' }),
    );

    await expect
      .element(page.getByRole('list'))
      .toHaveAttribute('data-evidence-id', 'react-file-list');
    const cancel = page.getByRole('button', { name: 'Cancel hook.pdf' });
    await expect.element(cancel).toBeVisible();
    expect(document.querySelector('[data-evidence-id="react-live-region"]')).toBe(liveRegion());
    await userEvent.click(cancel);
    await expect.element(page.getByRole('button', { name: 'Retry hook.pdf' })).toBeVisible();
    expect(liveRegion().textContent).toBe('hook.pdf canceled.');
  });

  it('preserves the exact native File and advances only recorded progress', async () => {
    const transport = new ControllableTransport(['delay']);
    await render(<OperatorHarness initialMode="indeterminate" transport={transport} />);
    const originalFile = new File(['evidence'], 'evidence.pdf', { type: 'application/pdf' });

    await selectNativeFile(originalFile);

    expect(transport.requests[0]!.sentFile).toBe(originalFile);
    await expect.element(page.getByRole('button', { name: 'Cancel evidence.pdf' })).toBeVisible();
    const progress = page.getByRole('progressbar');
    await expect.element(progress).not.toHaveAttribute('value');

    transport.requests[0]!.upload.progress(true, 50, 100);
    await expect.element(progress).not.toHaveAttribute('value');

    await userEvent.click(page.getByRole('button', { name: 'Advance recorded progress' }));
    await expect.element(progress).toHaveAttribute('value', '50');
  });

  it('commits canceling before native abort synchronously finishes cancellation', async () => {
    const transport = new ControllableTransport([
      {
        mode: 'delay',
        beforeAbort: () => {
          expect(document.querySelector('.lyra-upload__list')?.textContent).toContain(
            'first.pdf canceling.',
          );
          expect(liveRegion().textContent).toBe('first.pdf canceling.');
        },
      },
      'delay',
    ]);
    await render(<OperatorHarness initialMode="delay" transport={transport} />);
    const first = new File(['first'], 'first.pdf', { type: 'application/pdf' });
    const second = new File(['second'], 'second.pdf', { type: 'application/pdf' });
    await userEvent.upload(fileInput(), [first, second]);

    await userEvent.click(page.getByRole('button', { name: 'Cancel first.pdf' }));
    await expect.element(page.getByRole('button', { name: 'Retry first.pdf' })).toBeVisible();
    expect(liveRegion().textContent).toBe('first.pdf canceled.');
    await expect.element(page.getByRole('button', { name: 'Cancel second.pdf' })).toBeVisible();
  });

  it('detaches request lifecycle ownership before aborting during unmount', async () => {
    const transport = new ControllableTransport([
      { mode: 'delay', requireDetachedBeforeAbort: true },
    ]);
    const screen = await render(<OperatorHarness initialMode="delay" transport={transport} />);
    await userEvent.upload(
      fileInput(),
      new File(['unmount'], 'unmount.pdf', { type: 'application/pdf' }),
    );

    await screen.unmount();
  });

  it('rejects a retained older result after a real retry without a new announcement', async () => {
    const transport = new ControllableTransport(['error', 'success']);
    await render(<OperatorHarness initialMode="stale" transport={transport} />);
    const file = new File(['stale'], 'stale.pdf', { type: 'application/pdf' });
    await userEvent.upload(fileInput(), file);

    transport.requests[0]!.respond(503, { error: 'The upload request is invalid.' });
    await expect.element(page.getByRole('button', { name: 'Retry stale.pdf' })).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Use success' }));
    await userEvent.click(page.getByRole('button', { name: 'Retry stale.pdf' }));
    await expect.element(page.getByRole('button', { name: 'Cancel stale.pdf' })).toBeVisible();
    const announcement = liveRegion().textContent;

    await userEvent.click(page.getByRole('button', { name: 'Deliver retained result' }));
    await expect.element(page.getByRole('button', { name: 'Cancel stale.pdf' })).toBeVisible();
    expect(liveRegion().textContent).toBe(announcement);

    transport.requests[1]!.respond(200, { requestId: 'request-2' });
    await expect.element(page.getByRole('button', { name: 'Remove stale.pdf' })).toBeVisible();
  });

  it('supports retryable error, retry, success, removal, and input focus recovery', async () => {
    const transport = new ControllableTransport(['error', 'success']);
    await render(<OperatorHarness initialMode="error" transport={transport} />);
    const originalFile = new File(['retry'], 'retry.pdf', { type: 'application/pdf' });
    await selectNativeFile(originalFile);
    expect(transport.requests[0]!.sentFile).toBe(originalFile);

    transport.requests[0]!.respond(503, { error: 'The upload request is invalid.' });
    await expect.element(page.getByRole('button', { name: 'Retry retry.pdf' })).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Use success' }));
    await userEvent.click(page.getByRole('button', { name: 'Retry retry.pdf' }));
    expect(transport.requests[1]!.sentFile).toBe(originalFile);
    transport.requests[1]!.respond(200, { requestId: 'request-2' });
    await expect.element(page.getByRole('list').getByText('retry.pdf uploaded.')).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Remove retry.pdf' }));
    await expect
      .element(page.getByRole('button', { name: 'Remove retry.pdf' }))
      .not.toBeInTheDocument();
    await expect.poll(() => document.activeElement).toBe(fileInput());
  });

  it('restores removal focus to the next action and then the previous action', async () => {
    const transport = new ControllableTransport(['success', 'success', 'success']);
    await render(<OperatorHarness initialMode="success" transport={transport} />);
    const files = [
      new File(['a'], 'a.pdf', { type: 'application/pdf' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
      new File(['c'], 'c.pdf', { type: 'application/pdf' }),
    ];
    await userEvent.upload(fileInput(), files);
    for (const [index, request] of transport.requests.entries()) {
      request.respond(200, { requestId: `request-${index}` });
    }

    await userEvent.click(page.getByRole('button', { name: 'Remove b.pdf' }));
    const removeC = page.getByRole('button', { name: 'Remove c.pdf' });
    await expect.poll(() => document.activeElement).toBe(await removeC.element());

    await userEvent.click(removeC);
    const removeA = page.getByRole('button', { name: 'Remove a.pdf' });
    await expect.poll(() => document.activeElement).toBe(await removeA.element());
  });
});
