import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageRoot = resolve(import.meta.dirname, '..');

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

describe('authored pre-JavaScript file upload entries', () => {
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
    expect(openingTagById(english, 'div', 'alpine-evidence-root')?.attributes['x-data']).toBe(
      'uploadItems',
    );
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
