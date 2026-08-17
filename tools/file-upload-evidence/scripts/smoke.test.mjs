import { describe, expect, it, vi } from 'vitest';

import { parseSmokeArguments, runSmoke, validateUploadProgress } from './smoke.mjs';

const revision = '1234567890abcdef1234567890abcdef12345678';
const url = 'https://a1b2c3d4.lyra-ds-docs.pages.dev';

function page(locale, pageRevision = revision) {
  const title =
    locale === 'en' ? 'File upload manual evidence' : 'Evidência manual de envio de arquivo';
  return `<!doctype html><html lang="${locale}"><head><meta name="robots" content="noindex,nofollow"><title>${title}</title></head><body><code>${pageRevision}</code></body></html>`;
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
      return new Response(
        `<!doctype html><html lang="en"><body><h1>Passed</h1><dd>${revision}</dd></body></html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Lyra-Evidence-Revision': revision,
          },
        },
      );
    }
    return new Response('not found', { status: 404 });
  });

  return {
    fetch,
    uploadWithBrowser: vi.fn(async () => ({
      bodyRevision: revision,
      headerRevision: revision,
      progress: [{ isTrusted: true, lengthComputable: true, loaded: 1, total: 1 }],
      status: 200,
    })),
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
    await expect(runSmoke({ revision, url }, collaborators())).resolves.toEqual({
      locales: ['en', 'pt-BR'],
      revision,
      url,
    });
  });

  it('rejects a page and Function revision mismatch', async () => {
    const mismatch = 'abcdef1234567890abcdef1234567890abcdef12';
    const dependencies = collaborators({
      uploadWithBrowser: async () => ({
        bodyRevision: mismatch,
        headerRevision: mismatch,
        progress: [{ isTrusted: true, lengthComputable: true, loaded: 1, total: 1 }],
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
