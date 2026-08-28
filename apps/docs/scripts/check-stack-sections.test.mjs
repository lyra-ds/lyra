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
const reactFileUploadExample = readFileSync(
  join(import.meta.dirname, '..', 'components', 'examples', 'file-upload', 'default-items.tsx'),
  'utf8',
);

function assertSafeUploadProgress(source) {
  assert.match(source, /lengthComputable\s*&&\s*event\.total\s*>\s*0/);
  assert.match(
    source,
    /Math\.min\(100,\s*Math\.max\(0,\s*Math\.round\(\(event\.loaded \/ event\.total\) \* 100\)\)\)/,
  );
}

test('o exemplo React normaliza progresso computável e trata total zero como indeterminado', () => {
  assertSafeUploadProgress(reactFileUploadExample);
});

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
    assertSafeUploadProgress(source);
    assert.ok(
      !source.includes('absenceBladeFileUploadLifecycle'),
      'o motivo da ausência deve vir do manifesto, não de texto solto no MDX',
    );

    if (locale === 'pt-BR') {
      assert.match(source, /statusLabels:\s*\{/);
      assert.ok(source.includes('statusLabels[item.status]'));
      for (const label of ['Selecionado', 'Enviando', 'Cancelando', 'Concluído', 'Cancelado']) {
        assert.ok(source.includes(label), `faltou o status visível em pt-BR: ${label}`);
      }
      for (const message of [
        "selectionUnavailable: 'A substituição de arquivo fica indisponível enquanto há um upload ativo.'",
        "validationAccept: '{name} precisa corresponder a {accept}.'",
        "validationMaxSize: '{name} não pode exceder {maxSizeMB} MB.'",
        "selected: '{name} selecionado.'",
        "progress: 'Upload de {name} em {percent}%.'",
        "progressIndeterminate: 'Enviando {name}.'",
        "canceling: 'Cancelando {name}.'",
        "success: '{name} enviado.'",
        "error: '{name}: falha no upload.'",
        "canceled: 'Upload de {name} cancelado.'",
        "removed: '{name} removido.'",
        "retry: 'Tentar novamente: {name}'",
        "cancel: 'Cancelar {name}'",
        "remove: 'Remover {name}'",
      ]) {
        assert.ok(source.includes(message), `faltou a mensagem Alpine em pt-BR: ${message}`);
      }
      for (const englishMessage of [
        'Choose attachments',
        'Images or PDF, up to',
        '>Cancel<',
        '>Retry<',
        '>Remove<',
        '>Submit<',
        'is not ready for a new attempt',
        'The server rejected the upload',
        'The upload could not reach the server',
        'No local File is available to retry upload',
        'No active transport exists for upload',
      ]) {
        assert.ok(
          !source.includes(englishMessage),
          `mensagem visível não traduzida: ${englishMessage}`,
        );
      }
    }
  });
}
