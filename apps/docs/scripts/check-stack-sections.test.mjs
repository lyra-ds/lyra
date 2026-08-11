import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const LOCALES = ['en', 'pt-BR'];

for (const locale of LOCALES) {
  const dir = join(import.meta.dirname, '..', 'content', 'docs', locale, 'components');

  for (const file of readdirSync(dir).sort()) {
    const source = readFileSync(join(dir, file), 'utf8');

    test(`${locale}/${file} documenta a API dentro das abas de stack`, () => {
      const tabs = source.indexOf('<StackTabs>');
      assert.ok(tabs !== -1, 'faltou <StackTabs>');

      // Uma página que documenta mais de um componente (fieldset traz FormRow junto) mantém
      // os <PropTable> nomeados — o que não pode é API fora das abas, onde ela ficaria
      // visível na stack errada.
      const stray = source.slice(0, tabs).match(/^<PropTable /m);
      assert.equal(stray, null, '<PropTable> antes das abas: a API pertence a um <StackPanel>');
    });

    test(`${locale}/${file} não tem seção de HTML puro órfã`, () => {
      assert.ok(
        !/^## (Plain HTML|HTML puro)/m.test(source),
        'a seção de HTML puro precisa virar StackPanel',
      );
    });
  }
}
