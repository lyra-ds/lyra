import type { Locale, UploadMode } from './contracts';
import { MESSAGES } from './messages';

const MAX_BODY_BYTES = 10 * 1024 * 1024;
const MAX_DELAY_MS = 15_000;

const XHR_CLIENT_HEADER = 'X-Lyra-Evidence-Client';
const DEFAULT_LOCALE: Locale = 'pt-BR';

export interface EvidenceEndpointEnvironment {
  revision: string;
  randomUUID(): string;
  sleep(milliseconds: number): Promise<void>;
}

interface UploadMetadata {
  readonly requestId: string;
  readonly fileName: string;
  readonly mediaType: string;
  readonly byteLength: number;
  readonly revision: string;
}

interface NativeCopy {
  readonly byteLength: string;
  readonly fileName: string;
  readonly mediaType: string;
  readonly requestId: string;
  readonly revision: string;
}

const NATIVE_COPY = {
  en: {
    requestId: 'Request ID',
    fileName: 'File name',
    mediaType: 'Media type',
    byteLength: 'Byte length',
    revision: 'Revision',
  },
  'pt-BR': {
    requestId: 'ID da solicitação',
    fileName: 'Nome do arquivo',
    mediaType: 'Tipo de mídia',
    byteLength: 'Tamanho em bytes',
    revision: 'Revisão',
  },
} as const satisfies Record<Locale, NativeCopy>;

function isLocale(value: FormDataEntryValue | null): value is Locale {
  return value === 'en' || value === 'pt-BR';
}

function isUploadMode(value: FormDataEntryValue | null): value is UploadMode {
  return value === 'success' || value === 'error' || value === 'delay';
}

function isDeclaredTooLarge(request: Request): boolean {
  const declaredLength = request.headers.get('Content-Length');
  return (
    declaredLength !== null &&
    /^\d+$/u.test(declaredLength) &&
    Number(declaredLength) > MAX_BODY_BYTES
  );
}

async function readBoundedBody(request: Request): Promise<ArrayBuffer | null> {
  if (request.body === null) {
    return new ArrayBuffer(0);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }

      byteLength += chunk.value.byteLength;
      if (byteLength > MAX_BODY_BYTES) {
        await Promise.allSettled([reader.cancel()]);
        return null;
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

async function parseMultipart(request: Request, body: ArrayBuffer): Promise<FormData | null> {
  const headers = new Headers(request.headers);
  headers.delete('Content-Length');

  try {
    return await new Request(request.url, {
      method: 'POST',
      headers,
      body,
    }).formData();
  } catch {
    return null;
  }
}

function clampDelay(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string') {
    return 0;
  }

  const milliseconds = Number(value);
  return Number.isFinite(milliseconds) ? Math.min(MAX_DELAY_MS, Math.max(0, milliseconds)) : 0;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

function responseHeaders(environment: EvidenceEndpointEnvironment): Headers {
  return new Headers({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Lyra-Evidence-Revision': environment.revision,
  });
}

function renderNativeHtml(
  locale: Locale,
  requestId: string,
  revision: string,
  error?: string,
  metadata?: UploadMetadata,
): string {
  const copy = NATIVE_COPY[locale];
  const status = error === undefined ? MESSAGES[locale].status.pass : MESSAGES[locale].status.fail;
  const rows: [string, string][] = [[copy.requestId, requestId]];
  if (metadata !== undefined) {
    rows.push(
      [copy.fileName, metadata.fileName],
      [copy.mediaType, metadata.mediaType],
      [copy.byteLength, String(metadata.byteLength)],
    );
  }
  rows.push([copy.revision, revision]);

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>${escapeHtml(status)}</title>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(status)}</h1>
      ${error === undefined ? '' : `<p role="alert">${escapeHtml(error)}</p>`}
      <dl>
        ${rows
          .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
          .join('\n        ')}
      </dl>
    </main>
  </body>
</html>`;
}

interface RespondOptions {
  readonly allowPost?: boolean;
  readonly error?: string;
  readonly locale: Locale;
  readonly metadata?: UploadMetadata;
  readonly requestId: string;
  readonly status: number;
  readonly xhr: boolean;
}

function respond(
  environment: EvidenceEndpointEnvironment,
  { allowPost, error, locale, metadata, requestId, status, xhr }: RespondOptions,
): Response {
  const headers = responseHeaders(environment);
  if (allowPost === true) {
    headers.set('Allow', 'POST');
  }

  if (xhr) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(
      JSON.stringify({
        ...(error === undefined ? {} : { error }),
        ...(metadata ?? { requestId, revision: environment.revision }),
      }),
      { status, headers },
    );
  }

  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(renderNativeHtml(locale, requestId, environment.revision, error, metadata), {
    status,
    headers,
  });
}

export async function handleEvidenceRequest(
  request: Request,
  environment: EvidenceEndpointEnvironment,
): Promise<Response> {
  const requestId = environment.randomUUID();
  const xhr = request.headers.get(XHR_CLIENT_HEADER) === 'xhr';
  const baseResponse = {
    locale: DEFAULT_LOCALE,
    requestId,
    xhr,
  } as const;

  if (request.method !== 'POST') {
    return respond(environment, {
      ...baseResponse,
      allowPost: true,
      error: MESSAGES[DEFAULT_LOCALE].endpoint.invalidRequest,
      status: 405,
    });
  }

  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return respond(environment, {
      ...baseResponse,
      error: MESSAGES[DEFAULT_LOCALE].endpoint.invalidRequest,
      status: 403,
    });
  }

  if (isDeclaredTooLarge(request)) {
    return respond(environment, {
      ...baseResponse,
      error: MESSAGES[DEFAULT_LOCALE].endpoint.requestTooLarge,
      status: 413,
    });
  }

  let body: ArrayBuffer | null;
  try {
    body = await readBoundedBody(request);
  } catch {
    return respond(environment, {
      ...baseResponse,
      error: MESSAGES[DEFAULT_LOCALE].endpoint.invalidRequest,
      status: 400,
    });
  }

  if (body === null) {
    return respond(environment, {
      ...baseResponse,
      error: MESSAGES[DEFAULT_LOCALE].endpoint.requestTooLarge,
      status: 413,
    });
  }

  const formData = await parseMultipart(request, body);
  if (formData === null) {
    return respond(environment, {
      ...baseResponse,
      error: MESSAGES[DEFAULT_LOCALE].endpoint.invalidRequest,
      status: 400,
    });
  }

  const localeValue = formData.get('locale');
  if (!isLocale(localeValue)) {
    return respond(environment, {
      ...baseResponse,
      error: MESSAGES[DEFAULT_LOCALE].endpoint.invalidRequest,
      status: 400,
    });
  }
  const localizedResponse = { ...baseResponse, locale: localeValue };

  const modeValue = formData.get('mode');
  if (!isUploadMode(modeValue)) {
    return respond(environment, {
      ...localizedResponse,
      error: MESSAGES[localeValue].endpoint.invalidMode,
      status: 400,
    });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return respond(environment, {
      ...localizedResponse,
      error: MESSAGES[localeValue].endpoint.invalidRequest,
      status: 400,
    });
  }

  const metadata: UploadMetadata = {
    requestId,
    fileName: file.name,
    mediaType: file.type,
    byteLength: file.size,
    revision: environment.revision,
  };

  if (modeValue === 'error') {
    return respond(environment, {
      ...localizedResponse,
      error: MESSAGES[localeValue].endpoint.invalidRequest,
      metadata,
      status: 503,
    });
  }

  if (modeValue === 'delay') {
    await environment.sleep(clampDelay(formData.get('delay')));
  }

  return respond(environment, {
    ...localizedResponse,
    metadata,
    status: 200,
  });
}
