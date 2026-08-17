import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const revisionPattern = /^[a-f0-9]{40}$/u;
const immutableHostPattern = /^[a-z0-9-]{8,}\.lyra-ds-docs\.pages\.dev$/u;
const branchAlias = 'file-upload-evidence.lyra-ds-docs.pages.dev';
const payloadBytes = 8 * 1024 * 1024;

const locales = [
  { locale: 'en', title: 'File upload manual evidence' },
  { locale: 'pt-BR', title: 'Evidência manual de envio de arquivo' },
];

function parseImmutableUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('url must be an absolute immutable HTTPS Pages deployment URL.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.hostname === branchAlias ||
    !immutableHostPattern.test(url.hostname)
  ) {
    throw new Error('url must be an absolute immutable HTTPS Pages deployment URL.');
  }
  return url.origin;
}

export function parseSmokeArguments(arguments_) {
  const values = new Map();
  for (const argument of arguments_) {
    const match = /^--(url|revision)=(.+)$/u.exec(argument);
    if (match === null || values.has(match[1]))
      throw new Error(`invalid smoke argument: ${argument}`);
    values.set(match[1], match[2]);
  }

  const revision = values.get('revision');
  const url = values.get('url');
  if (revision === undefined || !revisionPattern.test(revision)) {
    throw new Error('revision must be a full 40-character lowercase Git SHA.');
  }
  if (url === undefined) throw new Error('url is required.');
  return { revision, url: parseImmutableUrl(url) };
}

function openingTag(html, name) {
  return new RegExp(`<${name}\\b[^>]*>`, 'iu').exec(html)?.[0] ?? '';
}

function attribute(tag, name) {
  return new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, 'iu').exec(tag)?.slice(1).find(Boolean);
}

function pageMetadataIsValid(html, locale, title, revision) {
  const htmlTag = openingTag(html, 'html');
  const robotsTag = [...html.matchAll(/<meta\b[^>]*>/giu)].find(
    ([tag]) => attribute(tag, 'name')?.toLowerCase() === 'robots',
  )?.[0];
  const actualTitle = /<title\b[^>]*>([\s\S]*?)<\/title>/iu.exec(html)?.[1].trim();
  return (
    attribute(htmlTag, 'lang') === locale &&
    actualTitle === title &&
    robotsTag !== undefined &&
    attribute(robotsTag, 'content')?.replaceAll(' ', '').toLowerCase() === 'noindex,nofollow' &&
    html.includes(revision)
  );
}

export function validateUploadProgress(events) {
  const observed = events.some(
    (event) =>
      event.isTrusted === true &&
      event.lengthComputable === true &&
      Number.isFinite(event.total) &&
      event.total > 0,
  );
  if (!observed) {
    throw new Error('real computable XMLHttpRequest upload progress was not observed.');
  }
}

async function checkLocalizedPages(url, revision, fetchImplementation) {
  for (const { locale, title } of locales) {
    const response = await fetchImplementation(`${url}/${locale}/file-upload-evidence/`);
    const html = await response.text();
    if (!response.ok || !pageMetadataIsValid(html, locale, title, revision)) {
      throw new Error(`${locale} evidence page has incorrect localized metadata.`);
    }
  }
}

async function checkNativeMultipart(url, revision, fetchImplementation) {
  const form = new FormData();
  form.set('locale', 'en');
  form.set('mode', 'success');
  form.set(
    'file',
    new Blob([new Uint8Array(64 * 1024)], { type: 'application/octet-stream' }),
    'smoke.bin',
  );
  const response = await fetchImplementation(`${url}/api/file-upload-evidence`, {
    body: form,
    headers: { Origin: url },
    method: 'POST',
  });
  const html = await response.text();
  const contentType = response.headers.get('Content-Type');
  if (
    !response.ok ||
    response.headers.get('X-Lyra-Evidence-Revision') !== revision ||
    attribute(openingTag(html, 'html'), 'lang') !== 'en' ||
    !html.includes(revision) ||
    contentType === null ||
    !contentType.startsWith('text/html')
  ) {
    throw new Error('native multipart response is not localized HTML with revision parity.');
  }
}

export async function uploadWithBrowser({ revision, url }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${url}/en/file-upload-evidence/`, { waitUntil: 'domcontentloaded' });
    return await page.evaluate(
      ({ bytes, endpoint, expectedRevision }) =>
        new Promise((resolvePromise, reject) => {
          const xhr = new XMLHttpRequest();
          const progress = [];
          xhr.open('POST', endpoint);
          xhr.setRequestHeader('X-Lyra-Evidence-Client', 'xhr');
          xhr.timeout = 60_000;
          xhr.upload.onprogress = (event) => {
            progress.push({
              isTrusted: event.isTrusted,
              lengthComputable: event.lengthComputable,
              loaded: event.loaded,
              total: event.total,
            });
          };
          xhr.onerror = () => reject(new Error('XHR upload failed at the network boundary.'));
          xhr.onabort = () => reject(new Error('XHR upload was aborted.'));
          xhr.ontimeout = () => reject(new Error('XHR upload timed out.'));
          xhr.onload = () => {
            let body;
            try {
              body = JSON.parse(xhr.responseText);
            } catch {
              reject(new Error('XHR Function response was not JSON.'));
              return;
            }
            resolvePromise({
              bodyRevision: body.revision,
              headerRevision: xhr.getResponseHeader('X-Lyra-Evidence-Revision'),
              progress,
              status: xhr.status,
            });
          };

          const form = new FormData();
          form.set('locale', 'en');
          form.set('mode', 'success');
          form.set(
            'file',
            new File([new Uint8Array(bytes)], `smoke-${expectedRevision}.bin`, {
              type: 'application/octet-stream',
            }),
          );
          xhr.send(form);
        }),
      {
        bytes: payloadBytes,
        endpoint: `${url}/api/file-upload-evidence`,
        expectedRevision: revision,
      },
    );
  } finally {
    await browser.close();
  }
}

export async function runSmoke(options, dependencies = {}) {
  const fetchImplementation = dependencies.fetch ?? globalThis.fetch;
  const browserUpload = dependencies.uploadWithBrowser ?? uploadWithBrowser;
  await checkLocalizedPages(options.url, options.revision, fetchImplementation);
  await checkNativeMultipart(options.url, options.revision, fetchImplementation);
  const upload = await browserUpload(options);
  if (
    upload.status !== 200 ||
    upload.headerRevision !== options.revision ||
    upload.bodyRevision !== options.revision
  ) {
    throw new Error('XHR Function revision does not match the deployment revision.');
  }
  validateUploadProgress(upload.progress);
  return {
    locales: locales.map(({ locale }) => locale),
    revision: options.revision,
    url: options.url,
  };
}

const isCli =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const options = parseSmokeArguments(process.argv.slice(2));
  const result = await runSmoke(options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
