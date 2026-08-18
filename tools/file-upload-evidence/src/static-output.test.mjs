import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { relative, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const packageRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(packageRoot, '../..');
const viteExecutable = resolve(packageRoot, 'node_modules/vite/bin/vite.js');
const temporaryRoots = [];
const revision = '1234567890abcdef1234567890abcdef12345678';
const buildTime = '2026-08-17T12:00:00.000Z';

const entries = [
  {
    locale: 'en',
    path: 'en/file-upload-evidence/index.html',
    title: 'File upload manual evidence',
    nativeLabel: 'Evidence file',
    alpineLabel: 'Delayed Alpine evidence file',
    nativeSubmit: 'Submit native upload',
    alpineSubmit: 'Submit delayed fixture natively',
  },
  {
    locale: 'pt-BR',
    path: 'pt-BR/file-upload-evidence/index.html',
    title: 'Evidência manual de envio de arquivo',
    nativeLabel: 'Arquivo de evidência',
    alpineLabel: 'Arquivo de evidência do Alpine atrasado',
    nativeSubmit: 'Enviar pelo formulário nativo',
    alpineSubmit: 'Enviar fixture atrasada de modo nativo',
  },
];

function readEntry(entry) {
  const path = resolve(packageRoot, entry.path);
  expect(existsSync(path), `${entry.locale} authored entry must exist`).toBe(true);
  return readFileSync(path, 'utf8');
}

function parseAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([@:\w-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/gu)].map((match) => [
      match[1].toLowerCase(),
      match[2] ?? match[3] ?? '',
    ]),
  );
}

function openingTags(source, name) {
  return [...source.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'giu'))].map((match) => ({
    attributes: parseAttributes(match[0]),
    source: match[0],
  }));
}

function elements(source, name) {
  return [...source.matchAll(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, 'giu'))].map(
    (match) => ({ attributes: parseAttributes(match[1]), innerHtml: match[2] }),
  );
}

function elementById(source, name, id) {
  return elements(source, name).find(({ attributes }) => attributes.id === id);
}

function openingTagById(source, name, id) {
  return openingTags(source, name).find(({ attributes }) => attributes.id === id);
}

function inputById(source, id) {
  return openingTags(source, 'input').find(({ attributes }) => attributes.id === id);
}

function labelFor(source, id) {
  return elements(source, 'label').find(({ attributes }) => attributes.for === id);
}

function normalizedText(html) {
  return html
    .replace(/<[^>]*>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function temporaryRoot() {
  const root = mkdtempSync(resolve(tmpdir(), 'lyra-file-upload-evidence-'));
  temporaryRoots.push(root);
  return root;
}

function previewEnvironment(overrides = {}) {
  const environment = { ...process.env };
  delete environment.FILE_UPLOAD_EVIDENCE;
  delete environment.LYRA_EVIDENCE_REVISION;
  delete environment.LYRA_EVIDENCE_BUILD_TIME;
  return Object.assign(environment, overrides);
}

function buildPreview(environment) {
  const outputRoot = resolve(temporaryRoot(), 'dist');
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
      env: environment,
      timeout: 120_000,
    },
  );

  return { outputRoot, result };
}

function filesUnder(root) {
  const files = [];
  const visit = (directory) => {
    for (const name of readdirSync(directory)) {
      const path = resolve(directory, name);
      if (statSync(path).isDirectory()) visit(path);
      else files.push(relative(root, path).split(sep).join('/'));
    }
  };
  visit(root);
  return files.sort();
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    expect(root.startsWith(`${resolve(tmpdir())}${sep}`)).toBe(true);
    rmSync(root, { force: true, recursive: true });
  }
});

describe('authored pre-JavaScript file upload entries', () => {
  it.each(entries)(
    'uses the Lyra evidence shell and controls in the $locale static fixture',
    (entry) => {
      const source = readEntry(entry);
      const nativeForm = elementById(source, 'form', 'native-upload-form');

      expect(source).toContain('<div class="lyra-evidence">');
      expect(source).toContain('<header class="lyra-evidence__intro">');
      expect(source).toContain(
        '<section class="lyra-evidence__section" aria-labelledby="native-upload-heading">',
      );
      expect(source).toContain(
        '<section class="lyra-evidence__section" aria-labelledby="alpine-upload-heading">',
      );
      expect(nativeForm?.attributes.class).toBe('lyra-field');
      expect(labelFor(nativeForm?.innerHtml ?? '', 'native-file')?.attributes.class).toBe(
        'lyra-label',
      );
      expect(inputById(nativeForm?.innerHtml ?? '', 'native-file')?.attributes.class).toBe(
        'lyra-input',
      );
      expect(nativeForm?.innerHtml).toContain('class="lyra-btn lyra-btn--primary lyra-btn--md"');
    },
  );

  it.each(entries)('authors the $locale document metadata before scripts execute', (entry) => {
    const source = readEntry(entry);
    const html = openingTags(source, 'html')[0];
    const title = elements(source, 'title')[0];
    const robots = openingTags(source, 'meta').find(
      ({ attributes }) => attributes.name?.toLowerCase() === 'robots',
    );

    expect(html?.attributes.lang).toBe(entry.locale);
    expect(normalizedText(title?.innerHtml ?? '')).toBe(entry.title);
    expect(robots?.attributes.content?.toLowerCase().replaceAll(' ', '')).toBe('noindex,nofollow');
    expect(source).toContain('__LYRA_EVIDENCE_REVISION__');
    expect(source).toContain('__LYRA_EVIDENCE_BUILD_TIME__');
  });

  it.each(entries)(
    'keeps the $locale native POST forms usable without enhancement actions',
    (entry) => {
      const source = readEntry(entry);

      for (const [formId, inputId, expectedLabel, expectedSubmit] of [
        ['native-upload-form', 'native-file', entry.nativeLabel, entry.nativeSubmit],
        ['alpine-upload-form', 'alpine-file', entry.alpineLabel, entry.alpineSubmit],
      ]) {
        const form = elementById(source, 'form', formId);
        expect(form?.attributes).toMatchObject({
          action: '/api/file-upload-evidence',
          method: 'post',
          enctype: 'multipart/form-data',
        });
        expect(inputById(form?.innerHtml ?? '', inputId)?.attributes).toMatchObject({
          type: 'file',
          name: 'file',
        });
        expect(normalizedText(labelFor(form?.innerHtml ?? '', inputId)?.innerHtml ?? '')).toBe(
          expectedLabel,
        );
        expect(
          openingTags(form?.innerHtml ?? '', 'input').map(({ attributes }) => [
            attributes.name,
            attributes.value,
          ]),
        ).toEqual(
          expect.arrayContaining([
            ['locale', entry.locale],
            ['mode', 'success'],
          ]),
        );
        expect(normalizedText(form?.innerHtml ?? '')).toContain(expectedSubmit);
        expect(form?.innerHtml).not.toMatch(/lyra:file-upload:(?:retry|cancel|remove)/u);
        expect(form?.innerHtml).not.toMatch(/lyra-upload__(?:retry|cancel|remove)/u);
      }
    },
  );

  it('uses matching semantic identities with independently localized copy', () => {
    const [english, portuguese] = entries.map((entry) => readEntry(entry));
    const ids = (source) =>
      openingTags(source, '[a-z][\\w-]*')
        .map(({ attributes }) => attributes.id)
        .filter(Boolean)
        .sort();

    expect(ids(english)).toEqual(ids(portuguese));
    expect(openingTagById(english, 'div', 'react-evidence-root')).toBeDefined();
    expect(openingTagById(english, 'div', 'alpine-evidence-root')).toBeDefined();
    expect(
      openingTagById(english, 'div', 'react-evidence-root')?.attributes['x-data'],
    ).toBeUndefined();
    for (const [source, locale] of [
      [english, 'en'],
      [portuguese, 'pt-BR'],
    ]) {
      expect(openingTagById(source, 'div', 'alpine-evidence-root')?.attributes['x-data']).toBe(
        `uploadItems({ locale: '${locale}' })`,
      );
    }
    expect(openingTagById(english, 'div', 'alpine-file-upload')?.attributes['x-modelable']).toBe(
      'items',
    );
    expect(openingTagById(english, 'div', 'alpine-file-upload')?.attributes['x-model']).toBe(
      'uploadItems',
    );
    for (const source of [english, portuguese]) {
      const rootAttributes =
        openingTagById(source, 'div', 'alpine-evidence-root')?.attributes ?? {};
      expect(
        Object.keys(rootAttributes)
          .filter((name) => name.startsWith('@lyra:'))
          .sort(),
      ).toEqual([
        '@lyra:file-upload:cancel',
        '@lyra:file-upload:remove',
        '@lyra:file-upload:retry',
        '@lyra:file-upload:select',
      ]);
    }
    expect(normalizedText(english)).not.toBe(normalizedText(portuguese));
    expect(english).toContain('aria-label="Remove file"');
    expect(portuguese).toContain('aria-label="Remover arquivo"');
  });
});

describe('isolated preview build', () => {
  it.each([
    ['an absent evidence gate', {}, 'FILE_UPLOAD_EVIDENCE must be exactly "1".'],
    [
      'an incorrect evidence gate',
      {
        FILE_UPLOAD_EVIDENCE: 'true',
        LYRA_EVIDENCE_REVISION: revision,
        LYRA_EVIDENCE_BUILD_TIME: buildTime,
      },
      'FILE_UPLOAD_EVIDENCE must be exactly "1".',
    ],
    [
      'a non-full revision',
      {
        FILE_UPLOAD_EVIDENCE: '1',
        LYRA_EVIDENCE_REVISION: revision.slice(1),
        LYRA_EVIDENCE_BUILD_TIME: buildTime,
      },
      'LYRA_EVIDENCE_REVISION must be a full 40-character lowercase Git SHA.',
    ],
    [
      'an invalid UTC build timestamp',
      {
        FILE_UPLOAD_EVIDENCE: '1',
        LYRA_EVIDENCE_REVISION: revision,
        LYRA_EVIDENCE_BUILD_TIME: '2026-08-17 12:00:00',
      },
      'LYRA_EVIDENCE_BUILD_TIME must be an ISO 8601 UTC timestamp.',
    ],
  ])('fails closed for %s', (_caseName, overrides, expectedError) => {
    const { outputRoot, result } = buildPreview(previewEnvironment(overrides));

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain(expectedError);
    expect(existsSync(outputRoot)).toBe(false);
  });

  it('emits only the two revision-pinned localized routes and private hashed assets', () => {
    const { outputRoot, result } = buildPreview(
      previewEnvironment({
        FILE_UPLOAD_EVIDENCE: '1',
        LYRA_EVIDENCE_REVISION: revision,
        LYRA_EVIDENCE_BUILD_TIME: buildTime,
      }),
    );

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    const outputFiles = filesUnder(outputRoot);
    expect(outputFiles.filter((path) => path.endsWith('/index.html'))).toEqual([
      'en/file-upload-evidence/index.html',
      'pt-BR/file-upload-evidence/index.html',
    ]);
    expect(
      outputFiles.every((path) => path.endsWith('/index.html') || path.startsWith('assets/')),
    ).toBe(true);
    const assets = outputFiles.filter((path) => path.startsWith('assets/'));
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.every((path) => /-[A-Za-z0-9_-]{8,}\.(?:css|js)$/u.test(path))).toBe(true);

    for (const entry of entries) {
      const html = readFileSync(resolve(outputRoot, entry.path), 'utf8');
      expect(openingTags(html, 'html')[0]?.attributes.lang).toBe(entry.locale);
      expect(
        openingTags(html, 'meta')
          .find(({ attributes }) => attributes.name?.toLowerCase() === 'robots')
          ?.attributes.content?.toLowerCase()
          .replaceAll(' ', ''),
      ).toBe('noindex,nofollow');
      expect(html).toContain(revision);
      expect(html).toContain(buildTime);
    }

    for (const path of outputFiles) {
      const contents = readFileSync(resolve(outputRoot, path), 'utf8');
      expect(contents).not.toContain('__LYRA_EVIDENCE_REVISION__');
      expect(contents).not.toContain('__LYRA_EVIDENCE_BUILD_TIME__');
    }
  });
});

describe('ordinary documentation output', () => {
  it('contains no file-upload evidence route or asset after a fresh production build', () => {
    const result = spawnSync('pnpm', ['--filter', '@lyra-ds/docs', 'run', 'build'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' },
      timeout: 300_000,
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);

    const outputRoot = resolve(repositoryRoot, 'apps/docs/out');
    expect(existsSync(outputRoot)).toBe(true);
    expect(filesUnder(outputRoot).filter((path) => path.includes('file-upload-evidence'))).toEqual(
      [],
    );
  }, 300_000);
});
