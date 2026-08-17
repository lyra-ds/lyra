import { useRef, useState } from 'react';
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

class ControllableUpload extends EventTarget implements XMLHttpRequestUpload {
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

class ControllableXMLHttpRequest extends EventTarget implements XMLHttpRequest {
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
  private abortRequested = false;
  private method = '';
  private url = '';
  private readonly headers = new Headers();

  constructor(
    private readonly expectedMode: 'success' | 'error' | 'delay',
    private readonly acceptFile: (file: File) => void,
  ) {
    super();
  }

  abort(): void {
    this.abortRequested = true;
  }

  confirmAbort(): void {
    if (!this.abortRequested) return;
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
    this.acceptFile(file);
    if (body.get('locale') !== 'en') {
      throw new Error('The evidence request must preserve the selected route locale.');
    }
    const mode = body.get('mode');
    if (mode !== this.expectedMode) {
      throw new Error(`The operator mode must map to endpoint mode ${this.expectedMode}.`);
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

  constructor(private readonly expectedModes: readonly ('success' | 'error' | 'delay')[]) {}

  create = (): XMLHttpRequest => {
    const expectedMode = this.expectedModes[this.requests.length];
    if (expectedMode === undefined) throw new Error('An unexpected evidence request started.');

    const request = new ControllableXMLHttpRequest(expectedMode, (file) => {
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
}

function OperatorHarness({ initialMode, transport }: OperatorHarnessProps) {
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

afterEach(() => cleanup());

describe('ReactFileUploadEvidence', () => {
  it('preserves native file participation and advances only recorded progress', async () => {
    const transport = new ControllableTransport(['delay']);
    await render(<OperatorHarness initialMode="indeterminate" transport={transport} />);
    const file = new File(['evidence'], 'evidence.pdf', { type: 'application/pdf' });

    await userEvent.upload(fileInput(), file);

    expect(fileInput().files?.item(0)).toMatchObject({
      name: 'evidence.pdf',
      size: 8,
      type: 'application/pdf',
    });
    await expect.element(page.getByRole('button', { name: 'Cancel evidence.pdf' })).toBeVisible();
    const progress = page.getByRole('progressbar');
    await expect.element(progress).not.toHaveAttribute('value');

    transport.requests[0]!.upload.progress(true, 50, 100);
    await expect.element(progress).not.toHaveAttribute('value');

    await userEvent.click(page.getByRole('button', { name: 'Advance recorded progress' }));
    await expect.element(progress).toHaveAttribute('value', '50');
  });

  it('shows canceling before the matching request confirms cancellation', async () => {
    const transport = new ControllableTransport(['delay', 'delay']);
    await render(<OperatorHarness initialMode="delay" transport={transport} />);
    const first = new File(['first'], 'first.pdf', { type: 'application/pdf' });
    const second = new File(['second'], 'second.pdf', { type: 'application/pdf' });
    await userEvent.upload(fileInput(), [first, second]);

    await userEvent.click(page.getByRole('button', { name: 'Cancel first.pdf' }));
    await expect.element(page.getByRole('list').getByText('first.pdf canceling.')).toBeVisible();
    expect(liveRegion().textContent).toBe('first.pdf canceling.');
    await expect.element(page.getByRole('button', { name: 'Cancel second.pdf' })).toBeVisible();

    transport.requests[0]!.confirmAbort();
    await expect.element(page.getByRole('button', { name: 'Retry first.pdf' })).toBeVisible();
    expect(liveRegion().textContent).toBe('first.pdf canceled.');
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
    const file = new File(['retry'], 'retry.pdf', { type: 'application/pdf' });
    await userEvent.upload(fileInput(), file);

    transport.requests[0]!.respond(503, { error: 'The upload request is invalid.' });
    await expect.element(page.getByRole('button', { name: 'Retry retry.pdf' })).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Use success' }));
    await userEvent.click(page.getByRole('button', { name: 'Retry retry.pdf' }));
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
