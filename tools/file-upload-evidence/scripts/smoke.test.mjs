import { describe, expect, it, vi } from 'vitest';

import { parseSmokeArguments, runSmoke, validateUploadProgress } from './smoke.mjs';

const revision = '1234567890abcdef1234567890abcdef12345678';
const url = 'https://a1b2c3d4.lyra-ds-docs.pages.dev';
const requestId = '11111111-2222-4333-8444-555555555555';
const payloadMarker = 'lyra-evidence-payload-test-marker';
const nativeByteLength = 64 * 1024;
const browserByteLength = 8 * 1024 * 1024;
const expectedMetadata = {
  requestId,
  fileName: 'smoke.bin',
  mediaType: 'application/octet-stream',
  byteLength: browserByteLength,
  revision,
};

function page(locale, pageRevision = revision) {
  const title =
    locale === 'en' ? 'File upload manual evidence' : 'Evidência manual de envio de arquivo';
  return `<!doctype html><html lang="${locale}"><head><meta name="robots" content="noindex,nofollow"><title>${title}</title></head><body><code>${pageRevision}</code></body></html>`;
}

function nativeHtml(overrides = {}, extra = '') {
  const metadata = {
    'Request ID': requestId,
    'File name': 'smoke.bin',
    'Media type': 'application/octet-stream',
    'Byte length': String(nativeByteLength),
    Revision: revision,
    ...overrides,
  };
  return `<!doctype html><html lang="en"><body><h1>Passed</h1><dl>${Object.entries(metadata)
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join('')}</dl>${extra}</body></html>`;
}

function collaborators(overrides = {}) {
  const fetch = vi.fn(async (input, init) => {
    const requestUrl = String(input);
    if (requestUrl.endsWith('/en/file-upload-evidence/')) {
      return new Response(page('en'), { status: 200 });
    }
    if (requestUrl.endsWith('/pt-BR/file-upload-evidence/')) {
      return new Response(page('pt-BR'), { status: 200 });
    }
    if (requestUrl.endsWith('/api/file-upload-evidence') && init?.method === 'POST') {
      const form = init.body;
      if (
        !(form instanceof FormData) ||
        form.get('locale') !== 'en' ||
        form.get('mode') !== 'success'
      ) {
        return new Response('bad multipart fixture', { status: 400 });
      }
      const file = form.get('file');
      const bytes = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : undefined;
      const marker = new TextEncoder().encode(payloadMarker);
      if (
        !(file instanceof File) ||
        file.name !== 'smoke.bin' ||
        file.type !== 'application/octet-stream' ||
        file.size !== nativeByteLength ||
        bytes === undefined ||
        !marker.every((byte, index) => bytes[index] === byte)
      ) {
        return new Response('bad file fixture', { status: 400 });
      }
      return new Response(nativeHtml(), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Lyra-Evidence-Revision': revision,
        },
      });
    }
    return new Response('not found', { status: 404 });
  });

  return {
    fetch,
    uploadWithBrowser: vi.fn(async () => ({
      body: expectedMetadata,
      headerRevision: revision,
      progress: [{ isTrusted: true, lengthComputable: true, loaded: 1, total: 1 }],
      responseIncludesPayloadMarker: false,
      status: 200,
    })),
    createPayloadMarker: () => payloadMarker,
    ...overrides,
  };
}

describe('parseSmokeArguments', () => {
  it('accepts one immutable Pages URL and full revision', () => {
    expect(parseSmokeArguments([`--url=${url}`, `--revision=${revision}`])).toEqual({
      revision,
      url,
    });
  });

  it.each([
    ['a branch alias', 'https://file-upload-evidence.lyra-ds-docs.pages.dev', revision],
    ['a URL path', `${url}/en`, revision],
    ['an insecure URL', 'http://a1b2c3d4.lyra-ds-docs.pages.dev', revision],
    ['an incomplete revision', url, revision.slice(1)],
  ])('rejects %s', (_name, candidateUrl, candidateRevision) => {
    expect(() =>
      parseSmokeArguments([`--url=${candidateUrl}`, `--revision=${candidateRevision}`]),
    ).toThrow();
  });
});

describe('runSmoke', () => {
  it('checks both localized pages, native multipart, Function revision, and trusted XHR progress', async () => {
    const dependencies = collaborators();
    await expect(runSmoke({ revision, url }, dependencies)).resolves.toEqual({
      locales: ['en', 'pt-BR'],
      revision,
      url,
    });
    expect(dependencies.uploadWithBrowser).toHaveBeenCalledExactlyOnceWith({
      payloadMarker,
      revision,
      url,
    });
  });

  it('rejects a page and Function revision mismatch', async () => {
    const mismatch = 'abcdef1234567890abcdef1234567890abcdef12';
    const dependencies = collaborators({
      uploadWithBrowser: async () => ({
        body: { ...expectedMetadata, revision: mismatch },
        headerRevision: mismatch,
        progress: [{ isTrusted: true, lengthComputable: true, loaded: 1, total: 1 }],
        responseIncludesPayloadMarker: false,
        status: 200,
      }),
    });

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'XHR Function revision does not match the deployment revision',
    );
  });

  it('rejects incorrect localized route metadata', async () => {
    const dependencies = collaborators({
      fetch: async (input, init) => {
        if (String(input).endsWith('/pt-BR/file-upload-evidence/')) {
          return new Response(page('en'), { status: 200 });
        }
        return collaborators().fetch(input, init);
      },
    });

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'pt-BR evidence page has incorrect localized metadata',
    );
  });

  it('rejects a native response that is not localized HTML with revision parity', async () => {
    const base = collaborators();
    const dependencies = {
      ...base,
      fetch: async (input, init) => {
        if (String(input).endsWith('/api/file-upload-evidence')) {
          return Response.json(
            { revision },
            { status: 200, headers: { 'X-Lyra-Evidence-Revision': revision } },
          );
        }
        return base.fetch(input, init);
      },
    };

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'native multipart response is not localized HTML',
    );
  });

  it('rejects native HTML without an HTML content type', async () => {
    const base = collaborators();
    const dependencies = {
      ...base,
      fetch: async (input, init) => {
        if (String(input).endsWith('/api/file-upload-evidence')) {
          const response = new Response(
            `<!doctype html><html lang="en"><body><dd>${revision}</dd></body></html>`,
            { status: 200, headers: { 'X-Lyra-Evidence-Revision': revision } },
          );
          response.headers.delete('Content-Type');
          return response;
        }
        return base.fetch(input, init);
      },
    };

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'native multipart response is not localized HTML',
    );
  });

  it.each([
    ['request ID', { 'Request ID': '' }],
    ['file name', { 'File name': 'other.bin' }],
    ['media type', { 'Media type': 'text/plain' }],
    ['byte length', { 'Byte length': String(nativeByteLength - 1) }],
    ['revision', { Revision: 'f'.repeat(40) }],
  ])('rejects incorrect native %s metadata', async (_name, mutation) => {
    const base = collaborators();
    const dependencies = {
      ...base,
      fetch: async (input, init) => {
        if (String(input).endsWith('/api/file-upload-evidence')) {
          return new Response(nativeHtml(mutation), {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Lyra-Evidence-Revision': revision,
            },
          });
        }
        return base.fetch(input, init);
      },
    };

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'native multipart response metadata does not match smoke.bin',
    );
  });

  it('rejects a native response that echoes the unique payload marker', async () => {
    const base = collaborators();
    const dependencies = {
      ...base,
      fetch: async (input, init) => {
        if (String(input).endsWith('/api/file-upload-evidence')) {
          return new Response(nativeHtml({}, payloadMarker), {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Lyra-Evidence-Revision': revision,
            },
          });
        }
        return base.fetch(input, init);
      },
    };

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'native multipart response exposed the payload marker',
    );
  });

  it.each([
    ['file name', { fileName: 'other.bin' }],
    ['media type', { mediaType: 'text/plain' }],
    ['byte length', { byteLength: browserByteLength - 1 }],
    ['request ID', { requestId: '' }],
  ])('rejects incorrect XHR %s metadata', async (_name, mutation) => {
    const dependencies = collaborators({
      uploadWithBrowser: async () => ({
        body: { ...expectedMetadata, ...mutation },
        headerRevision: revision,
        progress: [{ isTrusted: true, lengthComputable: true, loaded: 1, total: 1 }],
        responseIncludesPayloadMarker: false,
        status: 200,
      }),
    });

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'XHR response metadata does not match smoke.bin',
    );
  });

  it('rejects an XHR response that echoes the unique payload marker', async () => {
    const dependencies = collaborators({
      uploadWithBrowser: async () => ({
        body: expectedMetadata,
        headerRevision: revision,
        progress: [{ isTrusted: true, lengthComputable: true, loaded: 1, total: 1 }],
        responseIncludesPayloadMarker: true,
        status: 200,
      }),
    });

    await expect(runSmoke({ revision, url }, dependencies)).rejects.toThrow(
      'XHR response exposed the payload marker',
    );
  });
});

describe('validateUploadProgress', () => {
  it.each([
    ['no events', []],
    ['a synthetic event', [{ isTrusted: false, lengthComputable: true, loaded: 1, total: 1 }]],
    [
      'operator-provided progress',
      [{ isTrusted: false, lengthComputable: true, loaded: 100, total: 100 }],
    ],
    [
      'indeterminate native progress',
      [{ isTrusted: true, lengthComputable: false, loaded: 1, total: 0 }],
    ],
  ])('rejects %s', (_name, events) => {
    expect(() => validateUploadProgress(events)).toThrow(
      'real computable XMLHttpRequest upload progress was not observed',
    );
  });
});
