import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, resolve, sep } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { chromium } from 'playwright';

const packageRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(packageRoot, '../..');
const viteExecutable = resolve(packageRoot, 'node_modules/vite/bin/vite.js');
const revision = '1234567890abcdef1234567890abcdef12345678';
const buildTime = '2026-08-27T12:00:00.000Z';
const temporaryRoots = [];

function productionContentSecurityPolicy() {
  const headers = readFileSync(
    resolve(repositoryRoot, 'apps/docs/scripts/_headers.template'),
    'utf8',
  );
  const header = headers
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('Content-Security-Policy:'));
  if (header === undefined) throw new Error('Missing the production Content-Security-Policy.');
  return header.slice('Content-Security-Policy:'.length).trim();
}

function buildPreview() {
  const outputRoot = resolve(mkdtempSync(resolve(tmpdir(), 'lyra-csp-runtime-')), 'dist');
  temporaryRoots.push(resolve(outputRoot, '..'));
  const result = spawnSync(
    process.execPath,
    [
      viteExecutable,
      'build',
      '--config',
      resolve(packageRoot, 'vite.config.ts'),
      '--outDir',
      outputRoot,
    ],
    {
      cwd: packageRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        FILE_UPLOAD_EVIDENCE: '1',
        LYRA_EVIDENCE_REVISION: revision,
        LYRA_EVIDENCE_BUILD_TIME: buildTime,
      },
      timeout: 120_000,
    },
  );
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  return outputRoot;
}

function contentType(path) {
  if (extname(path) === '.html') return 'text/html; charset=utf-8';
  if (extname(path) === '.js') return 'text/javascript; charset=utf-8';
  if (extname(path) === '.css') return 'text/css; charset=utf-8';
  return 'application/octet-stream';
}

async function servePreview(outputRoot) {
  const policy = productionContentSecurityPolicy();
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    if (pathname === '/csp-eval-probe.js') {
      response.writeHead(200, {
        'Content-Security-Policy': policy,
        'Content-Type': 'text/javascript; charset=utf-8',
      });
      response.end(`
        globalThis.__LYRA_CSP_DYNAMIC_EVALUATION_ALLOWED__ = (() => {
          try {
            Function('return true')();
            return true;
          } catch {
            return false;
          }
        })();
      `);
      return;
    }
    const relativePath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const path = resolve(outputRoot, `.${relativePath}`);
    if (!path.startsWith(`${outputRoot}${sep}`)) {
      response.writeHead(404).end();
      return;
    }

    try {
      const body = readFileSync(path);
      response.writeHead(200, {
        'Content-Security-Policy': policy,
        'Content-Type': contentType(path),
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected the CSP preview server to listen on a TCP port.');
  }
  return {
    server,
    url: `http://127.0.0.1:${address.port}/en/file-upload-evidence/?alpineDelay=1000`,
  };
}

async function selectedFileMetadata(input) {
  return input.evaluate((element) => {
    const file = element.files?.[0];
    return file === undefined ? null : { name: file.name, size: file.size, type: file.type };
  });
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { force: true, recursive: true });
});

it('preserves the Alpine upload lifecycle under the production Content-Security-Policy', async () => {
  const outputRoot = buildPreview();
  const { server, url } = await servePreview(outputRoot);
  const executablePath = process.env.LYRA_EVIDENCE_BROWSER_EXECUTABLE;
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      ...(executablePath === undefined ? {} : { executablePath }),
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ url: '/csp-eval-probe.js' });
    expect(await page.evaluate(() => globalThis.__LYRA_CSP_DYNAMIC_EVALUATION_ALLOWED__)).toBe(
      false,
    );

    const input = page.locator('#alpine-file');
    await input.setInputFiles({
      name: 'selected-before-alpine.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(128, 1),
    });
    const beforeInitialization = await selectedFileMetadata(input);
    await page.waitForFunction(
      () => document.querySelector('#alpine-initializations')?.textContent?.trim() === '1',
      undefined,
      { timeout: 5_000 },
    );

    expect(beforeInitialization).toEqual({
      name: 'selected-before-alpine.pdf',
      size: 128,
      type: 'application/pdf',
    });
    expect(await selectedFileMetadata(input)).toEqual(beforeInitialization);
    expect(await page.locator('#alpine-selection-intents').textContent()).toBe('0');
    expect(await page.locator('#alpine-controlled-echoes').textContent()).toBe('0');
    expect(await page.locator('#alpine-connects').textContent()).toBe('1');

    await input.setInputFiles([
      { name: 'first.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(32, 2) },
      { name: 'second.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(64, 3) },
    ]);
    await page.waitForFunction(() => document.querySelectorAll('.lyra-upload__item').length === 2);
    expect(await page.locator('#alpine-selection-intents').textContent()).toBe('1');
    expect(await page.locator('#alpine-controlled-echoes').textContent()).toBe('1');

    await page.getByRole('button', { name: 'Remove first.pdf' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.lyra-upload__item').length === 1);
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Remove second.pdf',
    );
    expect(
      await page
        .getByRole('button', { name: 'Remove second.pdf' })
        .evaluate((element) => element === document.activeElement),
    ).toBe(true);

    const alpineRoot = page.locator('#alpine-evidence-root');
    await alpineRoot.evaluate(async (root) => {
      await window.__LYRA_FILE_UPLOAD_EVIDENCE__.teardownAlpineFixture(root);
    });
    expect(await page.locator('#alpine-disconnects').textContent()).toBe('1');
    expect(await page.locator('#alpine-evidence-root .lyra-upload__live').textContent()).toBe('');

    await alpineRoot.evaluate(async (root) => {
      await window.__LYRA_FILE_UPLOAD_EVIDENCE__.reconnectAlpineFixture(root);
    });
    await page.waitForFunction(
      () => document.querySelector('#alpine-initializations')?.textContent?.trim() === '2',
    );
    expect(await page.locator('#alpine-connects').textContent()).toBe('2');
    expect(await page.locator('#alpine-disconnects').textContent()).toBe('1');

    await page.locator('#alpine-file').setInputFiles({
      name: 'after-reconnect.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(96, 4),
    });
    await page.waitForFunction(() => document.querySelectorAll('.lyra-upload__item').length === 1);
    expect(await page.locator('#alpine-selection-intents').textContent()).toBe('2');
    expect(await page.locator('#alpine-controlled-echoes').textContent()).toBe('2');
    expect(pageErrors).toEqual([]);
  } finally {
    await browser?.close();
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error === undefined ? resolveClose() : rejectClose(error)));
    });
  }
}, 20_000);
