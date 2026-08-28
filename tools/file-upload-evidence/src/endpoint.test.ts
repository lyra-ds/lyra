import { describe, expect, it } from 'vitest';

import { handleEvidenceRequest, type EvidenceEndpointEnvironment } from './endpoint';
import { MESSAGES } from './messages';

const ENDPOINT_URL = 'https://evidence.example.test/api/file-upload-evidence';
const REVISION = 'a'.repeat(40);
const MAX_BODY_BYTES = 10 * 1024 * 1024;

interface TestEnvironment extends EvidenceEndpointEnvironment {
  readonly sleepDurations: number[];
}

function createEnvironment(overrides: Partial<EvidenceEndpointEnvironment> = {}): TestEnvironment {
  const sleepDurations: number[] = [];

  return {
    revision: REVISION,
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
    sleep: (milliseconds) => {
      sleepDurations.push(milliseconds);
      return Promise.resolve();
    },
    ...overrides,
    sleepDurations,
  };
}

interface UploadRequestOptions {
  readonly client?: string;
  readonly delay?: string;
  readonly file?: File | null;
  readonly locale?: string;
  readonly mode?: string | null;
  readonly origin?: string | null;
}

function uploadRequest({
  client,
  delay,
  file = new File(['hello'], 'evidence.txt', { type: 'text/plain' }),
  locale = 'en',
  mode = 'success',
  origin = new URL(ENDPOINT_URL).origin,
}: UploadRequestOptions = {}): Request {
  const formData = new FormData();
  if (mode !== null) formData.set('mode', mode);
  if (locale !== undefined) formData.set('locale', locale);
  if (delay !== undefined) formData.set('delay', delay);
  if (file !== null) formData.set('file', file);

  const headers = new Headers();
  if (origin !== null) headers.set('Origin', origin);
  if (client !== undefined) headers.set('X-Lyra-Evidence-Client', client);

  return new Request(ENDPOINT_URL, { method: 'POST', headers, body: formData });
}

function expectMandatoryHeaders(response: Response, revision = REVISION): void {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  expect(response.headers.get('X-Lyra-Evidence-Revision')).toBe(revision);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
}

describe('handleEvidenceRequest', () => {
  it('rejects non-POST requests and advertises the only accepted method', async () => {
    const response = await handleEvidenceRequest(new Request(ENDPOINT_URL), createEnvironment());

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
    expectMandatoryHeaders(response);
  });

  it.each([
    ['missing', null],
    ['mismatched', 'https://other.example.test'],
  ] as const)('rejects a %s Origin', async (_case, origin) => {
    const response = await handleEvidenceRequest(uploadRequest({ origin }), createEnvironment());

    expect(response.status).toBe(403);
    expectMandatoryHeaders(response);
  });

  it.each([
    ['missing', null],
    ['unsupported', 'retry'],
  ] as const)('rejects a %s upload mode with localized JSON', async (_case, mode) => {
    const response = await handleEvidenceRequest(
      uploadRequest({ client: 'xhr', locale: 'en', mode }),
      createEnvironment(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES.en.endpoint.invalidMode,
    });
    expectMandatoryHeaders(response);
  });

  it('rejects unsupported locales', async () => {
    const response = await handleEvidenceRequest(
      uploadRequest({ client: 'xhr', locale: 'fr' }),
      createEnvironment(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES['pt-BR'].endpoint.invalidRequest,
    });
    expectMandatoryHeaders(response);
  });

  it('rejects malformed multipart bodies', async () => {
    const request = new Request(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=missing-boundary',
        Origin: new URL(ENDPOINT_URL).origin,
        'X-Lyra-Evidence-Client': 'xhr',
      },
      body: 'not multipart data',
    });

    const response = await handleEvidenceRequest(request, createEnvironment());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES['pt-BR'].endpoint.invalidRequest,
    });
    expectMandatoryHeaders(response);
  });

  it('rejects multipart requests without a file', async () => {
    const response = await handleEvidenceRequest(
      uploadRequest({ client: 'xhr', file: null, locale: 'en' }),
      createEnvironment(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES.en.endpoint.invalidRequest,
    });
    expectMandatoryHeaders(response);
  });

  it('rejects a declared body larger than 10 MiB before consuming it', async () => {
    const request = uploadRequest({ client: 'xhr' });
    request.headers.set('Content-Length', String(MAX_BODY_BYTES + 1));

    const response = await handleEvidenceRequest(request, createEnvironment());

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES['pt-BR'].endpoint.requestTooLarge,
    });
    expect(request.bodyUsed).toBe(false);
    expectMandatoryHeaders(response);
  });

  it('cancels and rejects a streamed body that crosses 10 MiB', async () => {
    let canceled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_BODY_BYTES + 1));
      },
      cancel() {
        canceled = true;
      },
    });
    const init: RequestInit & { duplex: 'half' } = {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=unused',
        Origin: new URL(ENDPOINT_URL).origin,
        'X-Lyra-Evidence-Client': 'xhr',
      },
      body: stream,
      duplex: 'half',
    };

    const response = await handleEvidenceRequest(
      new Request(ENDPOINT_URL, init),
      createEnvironment(),
    );

    expect(response.status).toBe(413);
    expect(canceled).toBe(true);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES['pt-BR'].endpoint.requestTooLarge,
    });
    expectMandatoryHeaders(response);
  });

  it('preserves streamed overflow when reader cancellation rejects', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_BODY_BYTES + 1));
      },
      cancel() {
        return Promise.reject(new Error('cancellation failed'));
      },
    });
    const init: RequestInit & { duplex: 'half' } = {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=unused',
        Origin: new URL(ENDPOINT_URL).origin,
        'X-Lyra-Evidence-Client': 'xhr',
      },
      body: stream,
      duplex: 'half',
    };

    const response = await handleEvidenceRequest(
      new Request(ENDPOINT_URL, init),
      createEnvironment(),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES['pt-BR'].endpoint.requestTooLarge,
    });
    expectMandatoryHeaders(response);
  });

  it('returns only bounded upload metadata for a successful XHR request', async () => {
    const response = await handleEvidenceRequest(
      uploadRequest({
        client: 'xhr',
        file: new File(['hello'], 'evidence.txt', { type: 'text/plain' }),
      }),
      createEnvironment(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      fileName: 'evidence.txt',
      mediaType: 'text/plain',
      byteLength: 5,
      revision: REVISION,
    });
    expectMandatoryHeaders(response);
  });

  it('returns a localized retryable 503 for the explicit error mode', async () => {
    const response = await handleEvidenceRequest(
      uploadRequest({ client: 'xhr', locale: 'en', mode: 'error' }),
      createEnvironment(),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: MESSAGES.en.endpoint.invalidRequest,
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      revision: REVISION,
    });
    expectMandatoryHeaders(response);
  });

  it('keeps native retryable errors as localized HTML', async () => {
    const response = await handleEvidenceRequest(
      uploadRequest({ locale: 'pt-BR', mode: 'error' }),
      createEnvironment(),
    );
    const html = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain('<h1>REPROVADO</h1>');
    expect(html).toContain(MESSAGES['pt-BR'].endpoint.invalidRequest);
    expectMandatoryHeaders(response);
  });

  it.each([
    ['negative', '-10', 0],
    ['above the maximum', '20000', 15_000],
  ] as const)('clamps a %s requested delay before awaiting it', async (_case, delay, expected) => {
    const environment = createEnvironment();

    const response = await handleEvidenceRequest(
      uploadRequest({ client: 'xhr', delay, mode: 'delay' }),
      environment,
    );

    expect(response.status).toBe(200);
    expect(environment.sleepDurations).toEqual([expected]);
    expectMandatoryHeaders(response);
  });

  it.each([
    ['en', 'PASS'],
    ['pt-BR', 'APROVADO'],
  ] as const)('returns accessible localized native HTML for %s', async (locale, statusLabel) => {
    const response = await handleEvidenceRequest(uploadRequest({ locale }), createEnvironment());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(html).toContain(`<html lang="${locale}">`);
    expect(html).toContain(`<h1>${statusLabel}</h1>`);
    expect(html).toContain('123e4567-e89b-12d3-a456-426614174000');
    expect(html).toContain('evidence.txt');
    expect(html).toContain('text/plain');
    expect(html).toContain('>5<');
    expect(html).toContain(REVISION);
    expect(html).not.toContain('hello');
    expectMandatoryHeaders(response);
  });

  it('requires the exact explicit XHR classification value', async () => {
    const response = await handleEvidenceRequest(
      uploadRequest({ client: 'XHR' }),
      createEnvironment(),
    );

    expect(response.headers.get('Content-Type')).toContain('text/html');
    expectMandatoryHeaders(response);
  });

  it('escapes every dynamic field in native HTML', async () => {
    const response = await handleEvidenceRequest(
      uploadRequest({
        file: new File(['safe bytes'], '"><script>alert(1)</script>.txt', {
          type: 'text/plain&profile=evil',
        }),
      }),
      createEnvironment({
        revision: '"><script>alert(2)</script>',
        randomUUID: () => '"><script>alert(3)</script>',
      }),
    );
    const html = await response.text();

    expect(html).not.toContain('<script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;.txt');
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(2)&lt;/script&gt;');
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(3)&lt;/script&gt;');
    expect(html).toContain('text/plain&amp;profile=evil');
    expectMandatoryHeaders(response, '"><script>alert(2)</script>');
  });
});
