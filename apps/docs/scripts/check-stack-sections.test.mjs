import { readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const LOCALES = ['en', 'pt-BR'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }

    return nextResolve(specifier, context);
  },
});

const { components } = await import('../lib/components.ts');
const fileUpload = components.find((entry) => entry.slug === 'file-upload');
assert.ok(fileUpload, 'FileUpload precisa existir no manifesto de componentes');

for (const locale of LOCALES) {
  const dir = join(import.meta.dirname, '..', 'content', 'docs', locale, 'components');

  for (const file of readdirSync(dir).sort()) {
    const source = readFileSync(join(dir, file), 'utf8');

    test(`${locale}/${file} documenta a API dentro das abas de stack`, () => {
      const tabs = source.indexOf('<StackTabs>');
      assert.ok(tabs !== -1, 'faltou <StackTabs>');
      const closing = source.indexOf('</StackTabs>');
      assert.ok(closing !== -1, 'faltou </StackTabs>');

      // Uma página que documenta mais de um componente (fieldset traz FormRow junto) mantém
      // os <PropTable> nomeados — o que não pode é API fora das abas, onde ela ficaria
      // visível na stack errada. Vale para antes E depois das abas.
      const outside = source.slice(0, tabs) + source.slice(closing);
      const stray = outside.match(/^<(PropTable|StackApi)[ />]/m);
      assert.equal(
        stray,
        null,
        'API fora das abas: <PropTable>/<StackApi> pertence a um <StackPanel>',
      );
    });

    test(`${locale}/${file} não tem seção de HTML puro órfã`, () => {
      assert.ok(
        !/^## (Plain HTML|HTML puro)/m.test(source),
        'a seção de HTML puro precisa virar StackPanel',
      );
    });
  }

  test(`${locale}/file-upload.mdx documenta apenas as stacks implementadas`, () => {
    const source = readFileSync(join(dir, 'file-upload.mdx'), 'utf8');
    const panels = [...source.matchAll(/<StackPanel stack="([^"]+)">/g)].map((match) => match[1]);
    const alpineIntents = [
      ['select', 'startUploads'],
      ['retry', 'retryUpload'],
      ['cancel', 'cancelUpload'],
      ['remove', 'removeUpload'],
    ];

    assert.deepEqual(panels, ['react', 'alpine']);
    assert.deepEqual(fileUpload.stacks, ['react', 'alpine']);
    assert.equal(fileUpload.absence.blade, 'absenceBladeFileUploadLifecycle');
    assert.ok(!source.includes('<StackPanel stack="blade">'));
    for (const [event, handler] of alpineIntents) {
      assert.ok(source.includes(`@lyra:file-upload:${event}="${handler}($event.detail)"`));
      assert.match(source, new RegExp(`\\n    ${handler}\\(`));
    }
    assert.ok(
      !source.includes('absenceBladeFileUploadLifecycle'),
      'o motivo da ausência deve vir do manifesto, não de texto solto no MDX',
    );
  });
}
